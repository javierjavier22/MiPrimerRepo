/*
  O.FRE.SER — Backend de identificación orientativa de plagas con Gemini.

  Objetivos:
  - mantener la API key fuera del navegador;
  - aceptar una sola imagen por consulta;
  - enviar imagen + contexto a Gemini;
  - devolver JSON estructurado y conservador;
  - limitar el universo a plagas relevantes para Argentina / NOA;
  - no generar dosis químicas ni reemplazar una identificación profesional.

  Variables de entorno:
  - GEMINI_API_KEY: obligatoria para analizar imágenes.
  - GEMINI_MODEL: opcional. Default: gemini-3.8-flash.
  - ALLOWED_ORIGINS: opcional, lista separada por coma.
  - PORT: definida por Render.
*/

const http = require('node:http');

const PORT = Number(process.env.PORT || 10000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS ||
    'https://ofreser-v8-imagefix-demo.onrender.com,https://www.ofreser.com.ar,https://ofreser.com.ar,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
);

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const buckets = new Map();

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/avif'
]);

const allowedCategoryKeys = [
  'cockroach_german',
  'cockroach_american',
  'cockroach_other',
  'rodent_house_mouse',
  'rodent_rat',
  'rodent_field_or_puna',
  'mosquito_aedes',
  'mosquito_other',
  'fly',
  'ant',
  'scorpion',
  'kissing_bug',
  'spider',
  'bed_bug',
  'flea',
  'tick',
  'pantry_moth',
  'stored_product_beetle',
  'wasp',
  'termite',
  'other_pest',
  'not_pest',
  'inconclusive'
];

const responseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      enum: ['identified', 'uncertain', 'not_pest'],
      description: 'identified sólo si la evidencia visual alcanza; uncertain si hay duda real; not_pest si no parece una plaga.'
    },
    category_key: {
      type: 'string',
      enum: allowedCategoryKeys
    },
    group_name: {
      type: 'string',
      description: 'Nombre común general en español, por ejemplo Cucaracha o Alacrán.'
    },
    likely_species: {
      type: ['string', 'null'],
      description: 'Nombre común y/o científico sólo si la imagen permite sostenerlo visualmente.'
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low']
    },
    visible_traits: {
      type: 'array',
      items: { type: 'string' },
      maxItems: 5
    },
    alternatives: {
      type: 'array',
      maxItems: 2,
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['name', 'reason']
      }
    },
    explanation: {
      type: 'string',
      description: 'Explicación breve y prudente de por qué el resultado encaja o por qué no es concluyente.'
    }
  },
  required: [
    'status',
    'category_key',
    'group_name',
    'likely_species',
    'confidence',
    'visible_traits',
    'alternatives',
    'explanation'
  ]
};

function json(res, status, payload, origin) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function getClientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0]
    .trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const current = buckets.get(ip);
  if (!current || now - current.start >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(ip, { start: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

async function readJson(req) {
  return await new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('payload_too_large'), { code: 'PAYLOAD_TOO_LARGE' }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('invalid_json'), { code: 'INVALID_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function cleanText(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').trim().slice(0, maxLen);
}

function buildPrompt({ locality, environment, details }) {
  return `
Sos un asistente de identificación visual de plagas para O.FRE.SER, empresa de control de plagas de Salta, Argentina.

Tu tarea es analizar ÚNICAMENTE lo que puede sostenerse por la imagen y el contexto. El universo prioritario son plagas habituales o plausibles de Argentina y especialmente del NOA: cucarachas (incluyendo Blattella germanica, Periplaneta americana y otras), roedores urbanos y de campo, mosquitos (incluyendo Aedes cuando los rasgos visibles alcancen), moscas, hormigas, alacranes, vinchucas/triatominos, arañas, chinches de cama, pulgas, garrapatas, polillas y escarabajos de productos almacenados, avispas y termitas.

Reglas estrictas:
1. No inventes una especie. Si sólo podés sostener el grupo, dejá likely_species en null.
2. Usá status="identified" sólo cuando la imagen sea suficientemente clara para el grupo principal.
3. Si hay varias posibilidades razonables o la imagen no alcanza, usá status="uncertain", category_key="inconclusive" y confidence="low" o "medium".
4. Si la imagen no parece una plaga o no contiene un organismo identificable, usá status="not_pest" y category_key="not_pest".
5. No des instrucciones médicas, dosis, mezclas, concentraciones ni nombres de pesticidas. La web mostrará recomendaciones revisadas por O.FRE.SER después.
6. No uses la localidad para forzar una identificación contraria a la evidencia visual. El contexto sólo sirve como apoyo.
7. Para especies sensibles como alacranes, vinchucas, arañas o garrapatas, sé especialmente conservador.
8. visible_traits debe mencionar rasgos realmente visibles en la foto; no rasgos teóricos que no se vean.

Contexto aportado por el usuario:
- Localidad: ${locality || 'No indicada'}
- Ambiente donde apareció: ${environment || 'No indicado'}
- Detalle adicional: ${details || 'Ninguno'}

Devolvé exclusivamente el JSON que respeta el esquema solicitado.`.trim();
}

async function callGemini({ mimeType, imageBase64, locality, environment, details }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              mimeType,
              data: imageBase64
            }
          },
          {
            text: buildPrompt({ locality, environment, details })
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      maxOutputTokens: 1200,
      responseFormat: {
        text: {
          mimeType: 'application/json',
          schema: responseSchema
        }
      }
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000)
  });

  const raw = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = raw?.error?.message || `Gemini HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const text = raw?.candidates?.[0]?.content?.parts?.find(part => typeof part.text === 'string')?.text;
  if (!text) throw new Error('Gemini no devolvió texto estructurado.');

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Gemini devolvió una respuesta que no pudo parsearse como JSON.');
  }

  if (!allowedCategoryKeys.includes(parsed.category_key)) {
    parsed.status = 'uncertain';
    parsed.category_key = 'inconclusive';
    parsed.confidence = 'low';
    parsed.explanation = 'La salida del modelo quedó fuera de las categorías permitidas; se marcó como no concluyente.';
  }

  return parsed;
}

const server = http.createServer(async (req, res) => {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json(res, 403, { error: 'origin_not_allowed' }, origin);
    }
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '600',
      'Vary': 'Origin'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return json(res, 200, {
      ok: true,
      service: 'ofreser-pest-ai',
      model: GEMINI_MODEL,
      configured: Boolean(GEMINI_API_KEY)
    }, origin);
  }

  if (req.method !== 'POST' || req.url !== '/api/identify') {
    return json(res, 404, { error: 'not_found' }, origin);
  }

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return json(res, 403, { error: 'origin_not_allowed' }, origin);
  }

  if (!GEMINI_API_KEY) {
    return json(res, 503, {
      error: 'gemini_not_configured',
      message: 'El backend está instalado pero falta configurar GEMINI_API_KEY.'
    }, origin);
  }

  const ip = getClientIp(req);
  if (rateLimited(ip)) {
    return json(res, 429, {
      error: 'rate_limited',
      message: 'Se alcanzó el límite temporal de análisis. Intentá nuevamente más tarde.'
    }, origin);
  }

  let payload;
  try {
    payload = await readJson(req);
  } catch (error) {
    if (error.code === 'PAYLOAD_TOO_LARGE') {
      return json(res, 413, { error: 'payload_too_large' }, origin);
    }
    return json(res, 400, { error: 'invalid_json' }, origin);
  }

  const mimeType = cleanText(payload.mimeType, 40).toLowerCase();
  const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
  const locality = cleanText(payload.locality, 120);
  const environment = cleanText(payload.environment, 120);
  const details = cleanText(payload.details, 300);

  if (!allowedMimeTypes.has(mimeType)) {
    return json(res, 400, { error: 'unsupported_image_type' }, origin);
  }
  if (!imageBase64 || imageBase64.length > 5_500_000 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64)) {
    return json(res, 400, { error: 'invalid_image' }, origin);
  }

  try {
    const result = await callGemini({ mimeType, imageBase64, locality, environment, details });
    return json(res, 200, { ok: true, result }, origin);
  } catch (error) {
    console.error('Gemini identify error:', error?.message || error);
    return json(res, 502, {
      error: 'gemini_failed',
      message: 'No se pudo completar el análisis con Gemini en este momento.'
    }, origin);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`O.FRE.SER pest AI backend listening on ${PORT} with model ${GEMINI_MODEL}`);
});
