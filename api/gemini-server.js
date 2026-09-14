/*
  O.FRE.SER — Backend Gemini para identificación orientativa de plagas.
  La API key vive sólo en Render. La respuesta se valida antes de enviarse al navegador.
  Esta versión agrega reintentos, fallbacks, cache, límites globales y logging detallado.
*/
const http = require('node:http');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 10000);
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const FALLBACK_MODELS = [...new Set([GEMINI_MODEL,'gemini-3.7-flash','gemini-3.5-flash-lite'])];
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || 'https://ofreser-v8-imagefix-demo.onrender.com,https://www.ofreser.com.ar,https://ofreser.com.ar,http://localhost:3000,http://127.0.0.1:3000').split(',').map(v => v.trim()).filter(Boolean));

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const IP_MINUTE_MAX = Number(process.env.IP_MINUTE_MAX || 8);
const IP_HOUR_MAX = Number(process.env.IP_HOUR_MAX || 30);
const GLOBAL_MINUTE_MAX = Number(process.env.GLOBAL_MINUTE_MAX || 60);
const GLOBAL_DAY_MAX = Number(process.env.GLOBAL_DAY_MAX || 500);
const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT || 5);
const CACHE_TTL_MS = Number(process.env.CACHE_TTL_MS || 10 * 60 * 1000);
const CACHE_MAX = Number(process.env.CACHE_MAX || 100);

const minuteBuckets = new Map();
const hourBuckets = new Map();
let globalMinute = { start: Date.now(), count: 0 };
let globalDay = { start: Date.now(), count: 0 };
let inFlight = 0;
const resultCache = new Map();

const ALLOWED_MIME = new Set(['image/jpeg','image/jpg','image/png','image/webp','image/heic','image/heif','image/avif']);
const ALLOWED_KEYS = new Set(['cockroach_german','cockroach_american','cockroach_other','rodent_house_mouse','rodent_rat','rodent_field_or_puna','mosquito_aedes','mosquito_other','fly','ant','scorpion','kissing_bug','spider','bed_bug','flea','tick','pantry_moth','stored_product_beetle','wasp','termite','other_pest','not_pest','inconclusive']);

function sendJson(res,status,payload,origin='') {
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  if(origin && ALLOWED_ORIGINS.has(origin)){headers['Access-Control-Allow-Origin']=origin;headers['Vary']='Origin';}
  res.writeHead(status,headers);res.end(JSON.stringify(payload));
}
function clean(value,max=200){return typeof value==='string'?value.replace(/[\u0000-\u001F\u007F]/g,' ').trim().slice(0,max):'';}
function sleep(ms){return new Promise(r=>setTimeout(r,ms));}
function jitter(base){return base + Math.floor(Math.random()*350);}
function clientIp(req){return String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'unknown').split(',')[0].trim();}
function bumpBucket(map,key,windowMs,max){const now=Date.now();const b=map.get(key);if(!b||now-b.start>=windowMs){map.set(key,{start:now,count:1});return false;}b.count+=1;return b.count>max;}
function globalLimited(){const now=Date.now();if(now-globalMinute.start>=60000)globalMinute={start:now,count:0};if(now-globalDay.start>=86400000)globalDay={start:now,count:0};globalMinute.count+=1;globalDay.count+=1;return globalMinute.count>GLOBAL_MINUTE_MAX||globalDay.count>GLOBAL_DAY_MAX;}
function requestId(){return crypto.randomUUID();}
function hashPayload(imageBase64,locality,environment,details){return crypto.createHash('sha256').update(imageBase64).update('|'+locality+'|'+environment+'|'+details).digest('hex');}
function getCached(key){const item=resultCache.get(key);if(!item)return null;if(Date.now()-item.at>CACHE_TTL_MS){resultCache.delete(key);return null;}return item.result;}
function setCached(key,result){if(resultCache.size>=CACHE_MAX){const oldest=resultCache.keys().next().value;if(oldest)resultCache.delete(oldest);}resultCache.set(key,{at:Date.now(),result});}
function readBody(req){return new Promise((resolve,reject)=>{let total=0;const chunks=[];req.on('data',c=>{total+=c.length;if(total>MAX_BODY_BYTES){reject(new Error('payload_too_large'));req.destroy();return;}chunks.push(c);});req.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}'));}catch{reject(new Error('invalid_json'));}});req.on('error',reject);});}

function promptFor({locality,environment,details}){return `Analizá la imagen como asistente visual de O.FRE.SER, empresa de control de plagas de Salta, Argentina.\n\nFoco: plagas habituales o plausibles de Argentina y NOA: cucaracha germánica (Blattella germanica), cucaracha americana (Periplaneta americana), otras cucarachas, ratón doméstico, ratas, roedores de campo/Puna, mosquitos/Aedes, moscas, hormigas, alacranes, vinchucas/triatominos, arañas, chinches de cama, pulgas, garrapatas, polillas y escarabajos de productos almacenados, avispas y termitas.\n\nReglas:\n- Identificá primero el grupo; especie sólo si la foto muestra rasgos suficientes.\n- Si hay duda real, devolvé status \"uncertain\" y category_key \"inconclusive\".\n- Si no es una plaga identificable, status \"not_pest\" y category_key \"not_pest\".\n- No inventes especies.\n- No des dosis, pesticidas ni indicaciones médicas.\n- visible_traits debe describir únicamente rasgos visibles en la foto.\n- confidence sólo puede ser high, medium o low.\n- category_key sólo puede ser una de estas: ${[...ALLOWED_KEYS].join(', ')}.\n\nContexto del usuario:\nLocalidad: ${locality||'No indicada'}\nAmbiente: ${environment||'No indicado'}\nDetalle: ${details||'Ninguno'}\n\nRespondé EXCLUSIVAMENTE con JSON válido, sin markdown ni comentarios, con esta estructura exacta:\n{\"status\":\"identified|uncertain|not_pest\",\"category_key\":\"una clave permitida\",\"group_name\":\"nombre común general en español\",\"likely_species\":null,\"confidence\":\"high|medium|low\",\"visible_traits\":[\"rasgo visible 1\"],\"alternatives\":[{\"name\":\"alternativa\",\"reason\":\"motivo breve\"}],\"explanation\":\"explicación breve y prudente\"}`;}
function parseModelJson(text){let s=String(text||'').trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();const a=s.indexOf('{'),b=s.lastIndexOf('}');if(a!==-1&&b>a)s=s.slice(a,b+1);return JSON.parse(s);}
function normalizeResult(value){const out=value&&typeof value==='object'?value:{};if(!ALLOWED_KEYS.has(out.category_key)){out.status='uncertain';out.category_key='inconclusive';out.confidence='low';}if(!['identified','uncertain','not_pest'].includes(out.status))out.status='uncertain';if(!['high','medium','low'].includes(out.confidence))out.confidence='low';out.group_name=clean(out.group_name,120)||'No concluyente';out.likely_species=typeof out.likely_species==='string'?clean(out.likely_species,160):null;out.visible_traits=Array.isArray(out.visible_traits)?out.visible_traits.slice(0,5).map(v=>clean(v,180)).filter(Boolean):[];out.alternatives=Array.isArray(out.alternatives)?out.alternatives.slice(0,2).map(a=>({name:clean(a?.name,120),reason:clean(a?.reason,220)})).filter(a=>a.name):[];out.explanation=clean(out.explanation,700)||'La identificación es orientativa y puede requerir confirmación.';return out;}
function isRetryableStatus(status){return [408,429,500,502,503,504].includes(status);}

async function callGeminiModel(model,payload,signal,reqId,attempt){const started=Date.now();const url=`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;const body={contents:[{role:'user',parts:[{inlineData:{mimeType:payload.mimeType,data:payload.imageBase64}},{text:promptFor(payload)}]}],generationConfig:{maxOutputTokens:900}};try{const response=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},body:JSON.stringify(body),signal});const raw=await response.json().catch(()=>({}));if(!response.ok){const e=new Error(raw?.error?.message||`Gemini HTTP ${response.status}`);e.status=response.status;e.model=model;throw e;}const text=raw?.candidates?.[0]?.content?.parts?.find(p=>typeof p.text==='string')?.text;if(!text){const e=new Error('Gemini no devolvió texto.');e.status=502;e.model=model;throw e;}const result=normalizeResult(parseModelJson(text));console.log(`[${reqId}] success model=${model} attempt=${attempt} ms=${Date.now()-started}`);return result;}catch(error){console.error(`[${reqId}] error model=${model} attempt=${attempt} status=${error?.status||'n/a'} ms=${Date.now()-started} message=${error?.message||error}`);throw error;}}

async function callGemini(payload,reqId){let lastError=null;const plan=[{model:FALLBACK_MODELS[0],attempts:3,waits:[0,900,2200]},{model:FALLBACK_MODELS[1],attempts:2,waits:[0,1400]},{model:FALLBACK_MODELS[2],attempts:1,waits:[0]}];const controller=new AbortController();const totalTimer=setTimeout(()=>controller.abort(),60000);try{for(const step of plan){for(let attempt=1;attempt<=step.attempts;attempt++){if(step.waits[attempt-1])await sleep(jitter(step.waits[attempt-1]));try{return await callGeminiModel(step.model,payload,controller.signal,reqId,attempt);}catch(error){lastError=error;if(error?.name==='AbortError')throw error;if(!isRetryableStatus(error?.status)){if(error?.status===404)break;throw error;}}}}}finally{clearTimeout(totalTimer);}const e=lastError||new Error('Gemini no disponible');e.allModelsBusy=true;throw e;}

const server=http.createServer(async(req,res)=>{const origin=req.headers.origin||'';const reqId=requestId();if(req.method==='OPTIONS'){if(origin&&!ALLOWED_ORIGINS.has(origin))return sendJson(res,403,{error:'origin_not_allowed',request_id:reqId},origin);res.writeHead(204,{'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'});return res.end();}if(req.method==='GET'&&req.url==='/health')return sendJson(res,200,{ok:true,service:'ofreser-pest-ai',models:FALLBACK_MODELS,configured:Boolean(GEMINI_API_KEY),in_flight:inFlight},origin);if(req.method!=='POST'||req.url!=='/api/identify')return sendJson(res,404,{error:'not_found',request_id:reqId},origin);if(!origin||!ALLOWED_ORIGINS.has(origin))return sendJson(res,403,{error:'origin_not_allowed',request_id:reqId},origin);if(!GEMINI_API_KEY)return sendJson(res,503,{error:'gemini_not_configured',request_id:reqId,message:'Falta GEMINI_API_KEY.'},origin);

const ip=clientIp(req);if(bumpBucket(minuteBuckets,ip,60000,IP_MINUTE_MAX)||bumpBucket(hourBuckets,ip,3600000,IP_HOUR_MAX)||globalLimited())return sendJson(res,429,{error:'rate_limited',request_id:reqId,message:'Se alcanzó el límite temporal de análisis. Intentá nuevamente más tarde.'},origin);if(inFlight>=MAX_CONCURRENT)return sendJson(res,429,{error:'busy',request_id:reqId,message:'Hay varios análisis en curso. Intentá nuevamente en unos segundos.'},origin);

let payload;try{payload=await readBody(req);}catch(e){return sendJson(res,e.message==='payload_too_large'?413:400,{error:e.message,request_id:reqId},origin);}const mimeType=clean(payload.mimeType,40).toLowerCase();const imageBase64=typeof payload.imageBase64==='string'?payload.imageBase64:'';const locality=clean(payload.locality,120);const environment=clean(payload.environment,120);const details=clean(payload.details,300);if(!ALLOWED_MIME.has(mimeType))return sendJson(res,400,{error:'unsupported_image_type',request_id:reqId},origin);if(!imageBase64||imageBase64.length>5500000||!/^[A-Za-z0-9+/=]+$/.test(imageBase64))return sendJson(res,400,{error:'invalid_image',request_id:reqId},origin);

const cacheKey=hashPayload(imageBase64,locality,environment,details);const cached=getCached(cacheKey);if(cached){console.log(`[${reqId}] cache_hit`);return sendJson(res,200,{ok:true,result:cached,cached:true,request_id:reqId},origin);}inFlight+=1;const started=Date.now();console.log(`[${reqId}] start ip=${ip} bytes=${imageBase64.length} in_flight=${inFlight}`);try{const result=await callGemini({mimeType,imageBase64,locality,environment,details},reqId);setCached(cacheKey,result);console.log(`[${reqId}] done ms=${Date.now()-started}`);return sendJson(res,200,{ok:true,result,cached:false,request_id:reqId},origin);}catch(error){console.error(`[${reqId}] final_error status=${error?.status||'n/a'} ms=${Date.now()-started} message=${error?.message||error}`);if(error?.name==='AbortError'||error?.allModelsBusy||isRetryableStatus(error?.status))return sendJson(res,503,{error:'gemini_busy',request_id:reqId,retryable:true,message:'Gemini está temporalmente saturado. El sistema ya reintentó y probó modelos alternativos. Intentá nuevamente en unos segundos.'},origin);return sendJson(res,502,{error:'gemini_failed',request_id:reqId,retryable:false,message:'No se pudo completar el análisis con Gemini en este momento.'},origin);}finally{inFlight=Math.max(0,inFlight-1);}});

server.listen(PORT,'0.0.0.0',()=>console.log(`O.FRE.SER pest AI backend listening on ${PORT} with models ${FALLBACK_MODELS.join(' -> ')}`));
