/*
  O.FRE.SER — Backend Gemini para identificación orientativa de plagas.
  La API key vive sólo en Render. La respuesta de Gemini se valida antes de enviarse al navegador.
*/
const http = require('node:http');

const PORT = Number(process.env.PORT || 10000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS ||
  'https://ofreser-v8-imagefix-demo.onrender.com,https://www.ofreser.com.ar,https://ofreser.com.ar,http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map(v => v.trim()).filter(Boolean));

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;
const buckets = new Map();

const ALLOWED_MIME = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','image/avif']);
const ALLOWED_KEYS = new Set([
  'cockroach_german','cockroach_american','cockroach_other',
  'rodent_house_mouse','rodent_rat','rodent_field_or_puna',
  'mosquito_aedes','mosquito_other','fly','ant','scorpion','kissing_bug',
  'spider','bed_bug','flea','tick','pantry_moth','stored_product_beetle',
  'wasp','termite','other_pest','not_pest','inconclusive'
]);

function sendJson(res, status, payload, origin='') {
  const headers = {
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Vary'] = 'Origin';
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(payload));
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimited(ip) {
  const now = Date.now();
  const bucket = buckets.get(ip);
  if (!bucket || now - bucket.start >= RATE_LIMIT_WINDOW_MS) {
    buckets.set(ip, {start: now, count: 1});
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let total = 0;
    const chunks = [];
    req.on('data', chunk => {
      total += chunk.length;
      if (total > MAX_BODY_BYTES) {
        reject(new Error('payload_too_large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); }
      catch { reject(new Error('invalid_json')); }
    });
    req.on('error', reject);
  });
}

function clean(value, max=200) {
  return typeof value === 'string' ? value.replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,max) : '';
}

function promptFor({locality, environment, details}) {
  return `Analizá la imagen como asistente visual de O.FRE.SER, empresa de control de plagas de Salta, Argentina.

Foco: plagas habituales o plausibles de Argentina y NOA: cucaracha germánica (Blattella germanica), cucaracha americana (Periplaneta americana), otras cucarachas, ratón doméstico, ratas, roedores de campo/Puna, mosquitos/Aedes, moscas, hormigas, alacranes, vinchucas/triatominos, arañas, chinches de cama, pulgas, garrapatas, polillas y escarabajos de productos almacenados, avispas y termitas.

Reglas:
- Identificá primero el grupo; especie sólo si la foto muestra rasgos suficientes.
- Si hay duda real, devolvé status "uncertain" y category_key "inconclusive".
- Si no es una plaga identificable, status "not_pest" y category_key "not_pest".
- No inventes especies.
- No des dosis, pesticidas ni indicaciones médicas.
- visible_traits debe describir únicamente rasgos visibles en la foto.
- confidence sólo puede ser high, medium o low.
- category_key sólo puede ser una de estas: ${[...ALLOWED_KEYS].join(', ')}.

Contexto del usuario:
Localidad: ${locality || 'No indicada'}
Ambiente: ${environment || 'No indicado'}
Detalle: ${details || 'Ninguno'}

Respondé EXCLUSIVAMENTE con JSON válido, sin markdown ni comentarios, con esta estructura exacta:
{
  "status":"identified|uncertain|not_pest",
  "category_key":"una clave permitida",
  "group_name":"nombre común general en español",
  "likely_species":null,
  "confidence":"high|medium|low",
  "visible_traits":["rasgo visible 1"],
  "alternatives":[{"name":"alternativa","reason":"motivo breve"}],
  "explanation":"explicación breve y prudente"
}`;
}

function parseModelJson(text) {
  let cleaned = String(text || '').trim();
  cleaned = cleaned.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);
  return JSON.parse(cleaned);
}

function normalizeResult(value) {
  const out = value && typeof value === 'object' ? value : {};
  if (!ALLOWED_KEYS.has(out.category_key)) {
    out.status = 'uncertain';
    out.category_key = 'inconclusive';
    out.confidence = 'low';
  }
  if (!['identified','uncertain','not_pest'].includes(out.status)) out.status = 'uncertain';
  if (!['high','medium','low'].includes(out.confidence)) out.confidence = 'low';
  out.group_name = clean(out.group_name, 120) || 'No concluyente';
  out.likely_species = typeof out.likely_species === 'string' ? clean(out.likely_species, 160) : null;
  out.visible_traits = Array.isArray(out.visible_traits) ? out.visible_traits.slice(0,5).map(v => clean(v,180)).filter(Boolean) : [];
  out.alternatives = Array.isArray(out.alternatives) ? out.alternatives.slice(0,2).map(a => ({
    name: clean(a?.name,120), reason: clean(a?.reason,220)
  })).filter(a => a.name) : [];
  out.explanation = clean(out.explanation, 700) || 'La identificación es orientativa y puede requerir confirmación.';
  return out;
}

async function callGemini({mimeType, imageBase64, locality, environment, details}) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`;
  const body = {
    contents:[{role:'user',parts:[
      {inlineData:{mimeType,data:imageBase64}},
      {text:promptFor({locality,environment,details})}
    ]}],
    generationConfig:{temperature:0.1,topP:0.8,maxOutputTokens:1200}
  };
  const response = await fetch(url, {
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},
    body:JSON.stringify(body),
    signal:AbortSignal.timeout(45000)
  });
  const raw = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(raw?.error?.message || `Gemini HTTP ${response.status}`);
  const text = raw?.candidates?.[0]?.content?.parts?.find(p => typeof p.text === 'string')?.text;
  if (!text) throw new Error('Gemini no devolvió texto.');
  return normalizeResult(parseModelJson(text));
}

const server = http.createServer(async (req,res) => {
  const origin = req.headers.origin || '';

  if (req.method === 'OPTIONS') {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return sendJson(res,403,{error:'origin_not_allowed'},origin);
    res.writeHead(204,{
      'Access-Control-Allow-Origin':origin,
      'Access-Control-Allow-Methods':'POST, OPTIONS',
      'Access-Control-Allow-Headers':'Content-Type',
      'Access-Control-Max-Age':'600',
      'Vary':'Origin'
    });
    return res.end();
  }

  if (req.method === 'GET' && req.url === '/health') {
    return sendJson(res,200,{ok:true,service:'ofreser-pest-ai',model:GEMINI_MODEL,configured:Boolean(GEMINI_API_KEY)},origin);
  }
  if (req.method !== 'POST' || req.url !== '/api/identify') return sendJson(res,404,{error:'not_found'},origin);
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return sendJson(res,403,{error:'origin_not_allowed'},origin);
  if (!GEMINI_API_KEY) return sendJson(res,503,{error:'gemini_not_configured',message:'Falta GEMINI_API_KEY.'},origin);
  if (rateLimited(clientIp(req))) return sendJson(res,429,{error:'rate_limited',message:'Límite temporal alcanzado.'},origin);

  let payload;
  try { payload = await readBody(req); }
  catch (e) { return sendJson(res,e.message==='payload_too_large'?413:400,{error:e.message},origin); }

  const mimeType = clean(payload.mimeType,40).toLowerCase();
  const imageBase64 = typeof payload.imageBase64 === 'string' ? payload.imageBase64 : '';
  const locality = clean(payload.locality,120);
  const environment = clean(payload.environment,120);
  const details = clean(payload.details,300);

  if (!ALLOWED_MIME.has(mimeType)) return sendJson(res,400,{error:'unsupported_image_type'},origin);
  if (!imageBase64 || imageBase64.length > 5500000 || !/^[A-Za-z0-9+/=]+$/.test(imageBase64)) return sendJson(res,400,{error:'invalid_image'},origin);

  try {
    const result = await callGemini({mimeType,imageBase64,locality,environment,details});
    return sendJson(res,200,{ok:true,result},origin);
  } catch (error) {
    console.error('Gemini identify error:', error?.message || error);
    return sendJson(res,502,{error:'gemini_failed',message:'No se pudo completar el análisis con Gemini en este momento.'},origin);
  }
});

server.listen(PORT,'0.0.0.0',() => {
  console.log(`O.FRE.SER pest AI backend listening on ${PORT} with model ${GEMINI_MODEL}`);
});
