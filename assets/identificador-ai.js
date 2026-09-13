/*
  O.FRE.SER — Identificador experimental de plagas por imagen.

  Objetivo de esta fase:
  - ejecutar una clasificación REAL dentro del navegador, sin una API paga;
  - limitar la búsqueda a grupos de plagas relevantes para Argentina / NOA;
  - devolver una salida conservadora: coincidencia probable o "no concluyente";
  - nunca generar dosis químicas ni reemplazar una identificación profesional.

  IMPORTANTE:
  Este motor usa TinyCLIP como prueba de concepto. Es un modelo generalista y NO
  debe considerarse el clasificador definitivo. La publicación productiva queda
  condicionada a una validación posterior con un conjunto de fotos conocidas de
  plagas de Argentina/NOA y, preferentemente, a un modelo compacto especializado.
*/
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1';

env.allowLocalModels = false;

const MODEL_ID = 'onnx-community/TinyCLIP-ViT-8M-16-Text-3M-YFCC15M-ONNX';

/*
  Las etiquetas que ve el modelo se escriben en inglés porque este tipo de modelo
  visual-textual fue entrenado principalmente con ese idioma. La interfaz pública
  traduce y agrupa esas etiquetas en categorías útiles para O.FRE.SER.
*/
const PESTS = [
  {
    id: 'cockroach',
    name: 'Cucaracha',
    prompts: ['a close-up photo of a cockroach', 'an indoor pest cockroach'],
    action: 'Reducí alimento y humedad disponibles, corregí pérdidas de agua, sellá grietas y evitá aplicar productos al azar: una inspección ayuda a localizar refugios y focos.'
  },
  {
    id: 'mosquito',
    name: 'Mosquito / Aedes',
    prompts: ['a close-up photo of a mosquito', 'an Aedes mosquito'],
    action: 'Eliminá recipientes con agua acumulada, mantené canaletas y depósitos protegidos y reforzá barreras físicas. Para control químico, respetá siempre la etiqueta del producto.'
  },
  {
    id: 'scorpion',
    name: 'Alacrán / escorpión',
    prompts: ['a close-up photo of a scorpion', 'a Tityus scorpion'],
    action: 'No lo manipules con la mano. Revisá calzado, sellá grietas y puntos de ingreso y mantené ordenados los sectores donde pueda refugiarse. Ante una picadura, concurrí con urgencia a un centro de salud.',
    safety: true
  },
  {
    id: 'kissing_bug',
    name: 'Vinchuca / triatomino',
    prompts: ['a close-up photo of a kissing bug', 'a triatomine bug insect'],
    action: 'Evitá aplastarla o manipularla con la mano desnuda. La identificación visual es sólo orientativa; ante sospecha conviene solicitar confirmación y seguir las indicaciones sanitarias locales.',
    safety: true
  },
  {
    id: 'ant',
    name: 'Hormiga',
    prompts: ['a close-up photo of an ant', 'an indoor pest ant'],
    action: 'Buscá el recorrido y el punto de ingreso, reducí fuentes de alimento y sellá accesos. Identificar el patrón de actividad ayuda a decidir el control más apropiado.'
  },
  {
    id: 'fly',
    name: 'Mosca',
    prompts: ['a close-up photo of a house fly', 'a pest fly insect'],
    action: 'Revisá residuos, materia orgánica, desagües y otros posibles focos de cría. Mejorá saneamiento y exclusión antes de depender de tratamientos puntuales.'
  },
  {
    id: 'spider',
    name: 'Araña',
    prompts: ['a close-up photo of a spider', 'an indoor spider'],
    action: 'No la manipules con la mano. Reducí refugios, sellá accesos y revisá ropa o calzado almacenado. Si existe una mordedura con síntomas importantes, buscá atención médica.',
    safety: true
  },
  {
    id: 'bed_bug',
    name: 'Chinche de cama',
    prompts: ['a close-up photo of a bed bug', 'a Cimex lectularius bed bug'],
    action: 'Revisá costuras de colchones, respaldos y muebles cercanos. Evitá trasladar objetos potencialmente infestados entre ambientes; estos casos suelen requerir un tratamiento planificado.'
  },
  {
    id: 'flea',
    name: 'Pulga',
    prompts: ['a close-up photo of a flea', 'a flea pest insect'],
    action: 'La resolución suele requerir trabajar sobre el ambiente y, cuando corresponda, sobre los animales con asesoramiento veterinario. Aspirado y limpieza ayudan a reducir estadios inmaduros.'
  },
  {
    id: 'tick',
    name: 'Garrapata',
    prompts: ['a close-up photo of a tick', 'a hard tick parasite'],
    action: 'Evitá manipularla sin protección. Revisá mascotas y ambientes y consultá al veterinario cuando corresponda. Si hubo fijación sobre una persona y aparecen síntomas, buscá orientación médica.',
    safety: true
  },
  {
    id: 'pantry_moth',
    name: 'Polilla de alimentos almacenados',
    prompts: ['a close-up photo of a pantry moth', 'an Indian meal moth pest'],
    action: 'Revisá harinas, granos, frutos secos y envases abiertos. Retirá productos infestados, limpiá el sector y controlá el ingreso y almacenamiento de mercadería.'
  },
  {
    id: 'weevil',
    name: 'Gorgojo / escarabajo de alimentos',
    prompts: ['a close-up photo of a grain weevil', 'a stored product beetle pest'],
    action: 'Inspeccioná alimentos secos y materias primas, segregá lo afectado y realizá una limpieza profunda de estantes, rincones y derrames.'
  },
  {
    id: 'wasp',
    name: 'Avispa',
    prompts: ['a close-up photo of a wasp', 'a yellow jacket wasp'],
    action: 'No golpees ni manipules nidos activos. Mantené distancia y evitá bloquear la salida de los insectos; para nidos en zonas de tránsito conviene una evaluación profesional.'
  },
  {
    id: 'termite',
    name: 'Termita',
    prompts: ['a close-up photo of a termite', 'a termite pest insect'],
    action: 'Buscá madera dañada, galerías o alas desprendidas. Antes de tratar, conviene confirmar si realmente se trata de termitas y determinar el alcance de la actividad.'
  },
  {
    id: 'rodent',
    name: 'Roedor',
    prompts: ['a close-up photo of a rat', 'a close-up photo of a mouse'],
    action: 'Reducí acceso a alimento, agua y refugio, sellá puntos de ingreso y utilizá dispositivos de control de forma segura. En empresas conviene documentar ubicación, consumo y actividad.'
  }
];

const promptToPest = new Map();
const candidateLabels = [];
PESTS.forEach(pest => pest.prompts.forEach(prompt => {
  promptToPest.set(prompt, pest);
  candidateLabels.push(prompt);
}));

const input = document.getElementById('fileInput');
const drop = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const analyze = document.getElementById('analyzeBtn');
const reset = document.getElementById('resetBtn');
const result = document.getElementById('resultPanel');
const localidad = document.getElementById('localidad');
const ambiente = document.getElementById('ambiente');
const detalle = document.getElementById('detalle');

let classifier = null;
let currentFile = null;
let currentObjectUrl = null;
let loadingModel = false;

function setButton(text, disabled = false) {
  analyze.textContent = text;
  analyze.disabled = disabled;
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  currentFile = file;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  preview.src = currentObjectUrl;
  drop.classList.add('has-image');
  result.classList.remove('show');
  setButton('Analizar foto', false);
}

input.addEventListener('change', () => loadFile(input.files[0]));
['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault();
  drop.classList.add('drag');
}));
['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => {
  e.preventDefault();
  drop.classList.remove('drag');
}));
drop.addEventListener('drop', e => loadFile(e.dataTransfer.files[0]));

function updateProgress(info) {
  if (!loadingModel || !info) return;
  if (typeof info.progress === 'number') {
    setButton(`Cargando modelo ${Math.round(info.progress)}%`, true);
  } else if (info.status === 'ready') {
    setButton('Analizando imagen…', true);
  } else {
    setButton('Cargando modelo…', true);
  }
}

async function getClassifier() {
  if (classifier) return classifier;
  loadingModel = true;
  setButton('Cargando modelo…', true);
  classifier = await pipeline(
    'zero-shot-image-classification',
    MODEL_ID,
    {
      dtype: 'q8',
      progress_callback: updateProgress
    }
  );
  loadingModel = false;
  return classifier;
}

/*
  Cada plaga usa más de un prompt textual. El clasificador reparte el puntaje entre
  esos prompts, por lo que hay que SUMARLOS por categoría. Tomar sólo el máximo
  penalizaba precisamente a las categorías mejor reconocidas y podía producir un
  falso "no concluyente" incluso en imágenes evidentes.
*/
function aggregate(raw) {
  const grouped = new Map();
  raw.forEach(item => {
    const pest = promptToPest.get(item.label);
    if (!pest) return;
    const previous = grouped.get(pest.id);
    if (previous) previous.score += item.score;
    else grouped.set(pest.id, { pest, score: item.score });
  });
  return [...grouped.values()].sort((a, b) => b.score - a.score);
}

/*
  Con 15 categorías, una distribución completamente uniforme ronda 6,7% por grupo.
  Por eso no usamos un umbral absoluto de 22% como antes: además del puntaje superior,
  medimos cuánto se separa de la segunda opción. Las categorías sensibles siguen
  mostrándose siempre como orientativas y nunca como confirmación de especie.
*/
function confidence(top, second) {
  if (!top) return 'none';
  const secondScore = second?.score || 0;
  const margin = top.score - secondScore;
  const ratio = secondScore > 0 ? top.score / secondScore : 99;
  if (top.score >= 0.30 && margin >= 0.10) return 'high';
  if (top.score >= 0.16 && margin >= 0.045) return 'medium';
  if (top.score >= 0.12 && margin >= 0.035 && ratio >= 1.6) return 'medium';
  return 'low';
}

function pct(score) {
  return `${Math.round(score * 100)}%`;
}

function renderResult(ranked) {
  const top = ranked[0];
  const second = ranked[1];
  const third = ranked[2];
  const level = confidence(top, second);
  const head = result.querySelector('.result-head');
  const body = result.querySelector('.result-body');

  if (!top || level === 'low') {
    head.innerHTML = '<span>Resultado experimental</span><h3>No concluyente</h3>';
    body.innerHTML = `
      <span class="demo-tag">Motor real · Beta</span>
      <p style="margin-top:10px">La imagen no separa con suficiente claridad una categoría de las demás. Preferimos no inventar una identificación. Probá con otra foto más cerca, con buena luz y el ejemplar ocupando una parte mayor de la imagen.</p>
      ${ranked.length ? `<div class="result-grid"><div class="result-mini"><strong>Primeras coincidencias del modelo</strong><p>${ranked.slice(0,3).map(x => `${x.pest.name} (${pct(x.score)})`).join(' · ')}</p></div><div class="result-mini"><strong>Qué hacer</strong><p>Volvé a fotografiar el ejemplar desde arriba o de costado y, si necesitás resolverlo ahora, consultanos.</p></div></div>` : ''}
      ${whatsappButton('Plaga no identificada con suficiente confianza')}
    `;
    return;
  }

  const label = level === 'high' ? 'Compatibilidad visual alta' : 'Compatibilidad visual moderada';
  const alternatives = [second, third].filter(Boolean).map(x => `${x.pest.name} (${pct(x.score)})`).join(' · ');
  const safety = top.pest.safety
    ? '<p style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff7e8;color:#7a5108;font-weight:700">Por tratarse de una categoría potencialmente sensible, no tomes este resultado como confirmación de especie ni como indicación médica.</p>'
    : '';

  head.innerHTML = `<span>Resultado experimental</span><h3>${top.pest.name}</h3>`;
  body.innerHTML = `
    <span class="demo-tag">Motor real · Beta</span>
    <p style="margin-top:10px"><strong>${label}</strong>. Puntaje relativo del modelo: ${pct(top.score)}. Este valor sirve para comparar las opciones de esta prueba; no equivale a una probabilidad científica de especie.</p>
    ${safety}
    <div class="result-grid">
      <div class="result-mini"><strong>Coincidencia principal</strong><p>${top.pest.name}</p></div>
      <div class="result-mini"><strong>Otras posibilidades</strong><p>${alternatives || 'Sin alternativas cercanas en esta clasificación.'}</p></div>
      <div class="result-mini"><strong>Qué hacer ahora</strong><p>${top.pest.action}</p></div>
      <div class="result-mini"><strong>Estado de esta herramienta</strong><p>Clasificador experimental pendiente de validación con fotos conocidas de Argentina/NOA.</p></div>
    </div>
    ${whatsappButton(top.pest.name)}
  `;
}

function whatsappButton(resultName) {
  const text = [
    'Hola O.FRE.SER, usé el identificador experimental de plagas.',
    `Resultado orientativo: ${resultName}.`,
    localidad.value ? `Localidad: ${localidad.value}.` : '',
    ambiente.value ? `Lugar donde apareció: ${ambiente.value}.` : '',
    detalle.value ? `Detalle: ${detalle.value}.` : '',
    'Quiero confirmar la identificación y saber cómo proceder. Puedo adjuntar la foto en este chat.'
  ].filter(Boolean).join('\n');
  return `<div class="actions"><a class="btn btn-green" href="https://wa.me/5493875286093?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">Confirmar con O.FRE.SER por WhatsApp</a></div>`;
}

analyze.addEventListener('click', async e => {
  e.preventDefault();
  if (!currentFile || !currentObjectUrl || loadingModel) return;
  result.classList.add('show');
  result.querySelector('.result-head').innerHTML = '<span>Análisis local</span><h3>Preparando el modelo…</h3>';
  result.querySelector('.result-body').innerHTML = '<p>La primera vez puede demorar porque el navegador debe descargar y guardar el modelo. Las siguientes pruebas deberían ser más rápidas.</p>';
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const model = await getClassifier();
    setButton('Analizando imagen…', true);
    const raw = await model(currentObjectUrl, candidateLabels);
    const ranked = aggregate(raw);
    renderResult(ranked);
    setButton('Analizar de nuevo', false);
  } catch (error) {
    console.error('O.FRE.SER identificador:', error);
    result.querySelector('.result-head').innerHTML = '<span>Motor experimental</span><h3>No se pudo ejecutar el análisis</h3>';
    result.querySelector('.result-body').innerHTML = `<p>Este navegador no pudo cargar o ejecutar el modelo en esta prueba. La foto no se perdió ni se publicó. Podés intentar nuevamente con conexión estable o consultarnos directamente.</p>${whatsappButton('No se pudo ejecutar el clasificador')}`;
    classifier = null;
    loadingModel = false;
    setButton('Reintentar análisis', false);
  }
});

reset.addEventListener('click', () => {
  input.value = '';
  currentFile = null;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = null;
  preview.removeAttribute('src');
  drop.classList.remove('has-image');
  result.classList.remove('show');
  localidad.value = '';
  ambiente.value = '';
  detalle.value = '';
  setButton('Analizar foto', true);
});