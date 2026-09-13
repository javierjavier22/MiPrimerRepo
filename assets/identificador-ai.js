/*
  O.FRE.SER — Cliente del identificador de plagas con Gemini.

  La API key NO vive en este archivo. El navegador envía la imagen comprimida al
  backend de O.FRE.SER en Render y recibe un JSON estructurado.

  Regla de negocio:
  - Gemini identifica de forma orientativa;
  - las recomendaciones se resuelven localmente desde textos revisados;
  - si el modelo duda, la interfaz muestra “No concluyente”;
  - nunca se muestran dosis químicas ni una identificación médica definitiva.
*/

const API_URL = 'https://ofreser-pest-ai.onrender.com/api/identify';

const input = document.getElementById('fileInput');
const drop = document.getElementById('dropzone');
const preview = document.getElementById('preview');
const analyze = document.getElementById('analyzeBtn');
const reset = document.getElementById('resetBtn');
const result = document.getElementById('resultPanel');
const localidad = document.getElementById('localidad');
const ambiente = document.getElementById('ambiente');
const detalle = document.getElementById('detalle');

let currentFile = null;
let currentObjectUrl = null;
let busy = false;

/*
  Recomendaciones controladas por O.FRE.SER. La IA no redacta tratamientos.
  Más adelante estos textos pueden migrarse a una biblioteca administrable.
*/
const GUIDANCE = {
  cockroach_german: {
    title: 'Cucaracha alemana / germánica',
    action: 'Revisá especialmente cocinas, motores, bajo mesadas, zonas cálidas y húmedas. Reducí alimento y agua disponibles, corregí pérdidas y evitá dispersar el foco con aplicaciones indiscriminadas.'
  },
  cockroach_american: {
    title: 'Cucaracha americana',
    action: 'Revisá desagües, cámaras, rejillas, cañerías y sectores húmedos. Mejorá sellado y saneamiento y buscá posibles vías de ingreso antes de definir el control.'
  },
  cockroach_other: {
    title: 'Cucaracha',
    action: 'Reducí alimento y humedad, corregí pérdidas de agua, sellá grietas y revisá refugios. Una inspección ayuda a determinar la especie y el foco antes de intervenir.'
  },
  rodent_house_mouse: {
    title: 'Ratón doméstico',
    action: 'Reducí acceso a alimento, agua y refugio, sellá ingresos y controlá señales como heces, roeduras y recorridos. En establecimientos conviene registrar actividad y ubicación de dispositivos.'
  },
  rodent_rat: {
    title: 'Rata',
    action: 'Revisá accesos, residuos, depósitos y fuentes de alimento. Evitá dejar cebos o dispositivos al alcance de personas o animales y priorizá un programa documentado cuando la actividad sea sostenida.'
  },
  rodent_field_or_puna: {
    title: 'Roedor de campo / ambiente natural',
    action: 'La especie exacta puede requerir confirmación. Evitá manipular ejemplares o restos sin protección y documentá el lugar de hallazgo, especialmente en operaciones remotas.'
  },
  mosquito_aedes: {
    title: 'Mosquito compatible con Aedes',
    action: 'Eliminá recipientes con agua acumulada, mantené depósitos protegidos y reforzá barreras físicas. La especie debe confirmarse si la imagen no muestra claramente los rasgos diagnósticos.'
  },
  mosquito_other: {
    title: 'Mosquito',
    action: 'Eliminá agua acumulada y revisá recipientes, canaletas, desagües y otros posibles criaderos. Mantené mosquiteros y barreras físicas en buen estado.'
  },
  fly: {
    title: 'Mosca',
    action: 'Revisá residuos, materia orgánica, desagües y fuentes de atracción. Mejorá saneamiento, exclusión y manejo de residuos antes de depender de tratamientos puntuales.'
  },
  ant: {
    title: 'Hormiga',
    action: 'Buscá recorridos, fuentes de alimento y puntos de ingreso. El patrón de actividad y la ubicación del nido ayudan a definir un control más efectivo.'
  },
  scorpion: {
    title: 'Alacrán / escorpión',
    action: 'No lo manipules con la mano. Revisá calzado, sellá grietas y accesos y reducí refugios. Ante una picadura, buscá atención médica urgente.',
    safety: true
  },
  kissing_bug: {
    title: 'Vinchuca / triatomino',
    action: 'No la aplastes ni la manipules con la mano desnuda. La identificación por foto es orientativa y conviene solicitar confirmación siguiendo las indicaciones sanitarias locales.',
    safety: true
  },
  spider: {
    title: 'Araña',
    action: 'No la manipules con la mano. Reducí refugios y sellá accesos. La identificación de especie por fotografía puede ser limitada; ante una mordedura con síntomas importantes, buscá atención médica.',
    safety: true
  },
  bed_bug: {
    title: 'Chinche de cama',
    action: 'Revisá costuras de colchones, respaldos, zócalos y muebles cercanos. Evitá trasladar objetos potencialmente infestados entre ambientes y solicitá una inspección si hay señales compatibles.'
  },
  flea: {
    title: 'Pulga',
    action: 'El control suele requerir trabajar sobre el ambiente y, cuando corresponda, sobre los animales con asesoramiento veterinario. Aspirado y limpieza ayudan a reducir estadios inmaduros.'
  },
  tick: {
    title: 'Garrapata',
    action: 'Evitá manipularla sin protección. Revisá mascotas y ambientes y consultá al veterinario cuando corresponda. Si estuvo adherida a una persona y aparecen síntomas, buscá orientación médica.',
    safety: true
  },
  pantry_moth: {
    title: 'Polilla de productos almacenados',
    action: 'Revisá harinas, granos, frutos secos y envases abiertos. Retirá productos infestados y realizá limpieza profunda del almacenamiento.'
  },
  stored_product_beetle: {
    title: 'Gorgojo / escarabajo de productos almacenados',
    action: 'Inspeccioná alimentos secos y materias primas, segregá lo afectado y limpiá estantes, rincones y derrames. Revisá también mercadería recientemente ingresada.'
  },
  wasp: {
    title: 'Avispa',
    action: 'No golpees ni manipules nidos activos. Mantené distancia y, si el nido está en una zona de tránsito, solicitá evaluación profesional.'
  },
  termite: {
    title: 'Termita',
    action: 'Buscá madera dañada, galerías o alas desprendidas. Antes de tratar, conviene confirmar la identificación y determinar el alcance de la actividad.'
  },
  other_pest: {
    title: 'Otra plaga posible',
    action: 'La imagen sugiere un organismo que no entra claramente en las categorías principales. Conviene confirmar la identificación antes de elegir una medida de control.'
  },
  not_pest: {
    title: 'No parece una plaga identificable',
    action: 'La imagen no muestra con claridad una de las plagas objetivo. Podés probar otra foto o consultarnos si el organismo está causando un problema concreto.'
  },
  inconclusive: {
    title: 'No concluyente',
    action: 'Probá otra foto más cerca, con buena luz y, si es posible, desde arriba y de costado. Preferimos no inventar una identificación cuando los rasgos no alcanzan.'
  }
};

function setButton(text, disabled = false) {
  analyze.textContent = text;
  analyze.disabled = disabled;
}

function showPreview(file) {
  currentFile = file;
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
  currentObjectUrl = URL.createObjectURL(file);
  preview.src = currentObjectUrl;
  drop.classList.add('has-image');
  result.classList.remove('show');
  setButton('Analizar foto con IA', false);
}

function loadFile(file) {
  if (!file || !file.type.startsWith('image/')) return;
  if (file.size > 15 * 1024 * 1024) {
    showError('La imagen es demasiado pesada. Elegí una foto de menos de 15 MB.');
    return;
  }
  showPreview(file);
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/*
  Reduce tamaño y costo de transferencia. Para identificación de plagas no hace falta
  enviar una foto de 12 megapíxeles: 1600 px de lado mayor conserva suficiente detalle.
*/
async function prepareImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
    return {
      mimeType: 'image/jpeg',
      imageBase64: dataUrl.split(',')[1]
    };
  } catch {
    /* HEIC u otros formatos pueden no decodificarse en todos los navegadores. */
    if (file.size > 4 * 1024 * 1024) {
      throw new Error('Tu navegador no pudo comprimir esta imagen. Probá con una captura de pantalla o una foto JPG/PNG más liviana.');
    }
    const dataUrl = await fileToDataUrl(file);
    return {
      mimeType: file.type || 'image/jpeg',
      imageBase64: dataUrl.split(',')[1]
    };
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function whatsappButton(resultName) {
  const text = [
    'Hola O.FRE.SER, usé el identificador orientativo de plagas.',
    `Resultado orientativo: ${resultName}.`,
    localidad.value ? `Localidad: ${localidad.value}.` : '',
    ambiente.value ? `Lugar donde apareció: ${ambiente.value}.` : '',
    detalle.value ? `Detalle: ${detalle.value}.` : '',
    'Quiero confirmar la identificación y saber cómo proceder. Puedo adjuntar la foto en este chat.'
  ].filter(Boolean).join('\n');
  return `<div class="actions"><a class="btn btn-green" href="https://wa.me/5493875286093?text=${encodeURIComponent(text)}" target="_blank" rel="noopener noreferrer">Confirmar con O.FRE.SER por WhatsApp</a></div>`;
}

function renderResult(data) {
  const head = result.querySelector('.result-head');
  const body = result.querySelector('.result-body');
  const key = data.category_key || 'inconclusive';
  const guide = GUIDANCE[key] || GUIDANCE.inconclusive;
  const confidenceLabel = {
    high: 'Confianza visual alta',
    medium: 'Confianza visual moderada',
    low: 'Confianza visual baja'
  }[data.confidence] || 'Confianza no determinada';

  if (data.status === 'uncertain' || key === 'inconclusive') {
    head.innerHTML = '<span>Resultado con Gemini · Beta</span><h3>No concluyente</h3>';
    const alternatives = Array.isArray(data.alternatives) && data.alternatives.length
      ? data.alternatives.map(a => `<li><strong>${escapeHtml(a.name)}</strong>: ${escapeHtml(a.reason)}</li>`).join('')
      : '<li>No hay alternativas suficientemente claras.</li>';
    body.innerHTML = `
      <span class="demo-tag">IA multimodal · resultado orientativo</span>
      <p style="margin-top:10px">${escapeHtml(data.explanation || guide.action)}</p>
      <div class="result-grid">
        <div class="result-mini"><strong>Estado</strong><p>${confidenceLabel}. Preferimos no forzar una especie.</p></div>
        <div class="result-mini"><strong>Posibles alternativas</strong><ul style="margin:7px 0 0;padding-left:18px;font-size:.78rem">${alternatives}</ul></div>
        <div class="result-mini"><strong>Qué hacer</strong><p>${escapeHtml(guide.action)}</p></div>
        <div class="result-mini"><strong>Siguiente paso</strong><p>Probá una segunda foto o confirmá con nuestro equipo técnico.</p></div>
      </div>
      ${whatsappButton('No concluyente')}
    `;
    return;
  }

  const visibleTraits = Array.isArray(data.visible_traits) && data.visible_traits.length
    ? `<ul style="margin:7px 0 0;padding-left:18px;font-size:.78rem">${data.visible_traits.map(t => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`
    : '<p>No se informaron rasgos visibles específicos.</p>';
  const alternatives = Array.isArray(data.alternatives) && data.alternatives.length
    ? data.alternatives.map(a => escapeHtml(a.name)).join(' · ')
    : 'Sin alternativas relevantes informadas.';
  const species = data.likely_species ? escapeHtml(data.likely_species) : 'No determinada con suficiente evidencia';
  const safety = guide.safety
    ? '<p style="margin-top:12px;padding:10px 12px;border-radius:10px;background:#fff7e8;color:#7a5108;font-weight:700">Categoría potencialmente sensible: este resultado no reemplaza una confirmación profesional ni atención médica cuando corresponda.</p>'
    : '';

  head.innerHTML = `<span>Resultado con Gemini · Beta</span><h3>${escapeHtml(guide.title || data.group_name)}</h3>`;
  body.innerHTML = `
    <span class="demo-tag">IA multimodal · resultado orientativo</span>
    <p style="margin-top:10px"><strong>${confidenceLabel}.</strong> ${escapeHtml(data.explanation || '')}</p>
    ${safety}
    <div class="result-grid">
      <div class="result-mini"><strong>Grupo probable</strong><p>${escapeHtml(data.group_name || guide.title)}</p></div>
      <div class="result-mini"><strong>Especie probable</strong><p>${species}</p></div>
      <div class="result-mini"><strong>Rasgos que la IA observó</strong>${visibleTraits}</div>
      <div class="result-mini"><strong>Otras posibilidades</strong><p>${alternatives}</p></div>
      <div class="result-mini"><strong>Qué hacer ahora</strong><p>${escapeHtml(guide.action)}</p></div>
      <div class="result-mini"><strong>Importante</strong><p>La identificación sigue siendo orientativa y puede requerir confirmación.</p></div>
    </div>
    ${whatsappButton(guide.title || data.group_name)}
  `;
}

function showError(message) {
  result.classList.add('show');
  result.querySelector('.result-head').innerHTML = '<span>Identificador</span><h3>No se pudo completar el análisis</h3>';
  result.querySelector('.result-body').innerHTML = `<p>${escapeHtml(message)}</p>${whatsappButton('No se pudo completar el análisis')}`;
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

analyze.addEventListener('click', async e => {
  e.preventDefault();
  if (!currentFile || busy) return;
  busy = true;
  setButton('Preparando imagen…', true);
  result.classList.add('show');
  result.querySelector('.result-head').innerHTML = '<span>Análisis con Gemini</span><h3>Analizando la imagen…</h3>';
  result.querySelector('.result-body').innerHTML = '<p>Estamos comparando los rasgos visibles con plagas plausibles de Argentina y del NOA. Esto puede demorar unos segundos.</p>';
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const prepared = await prepareImage(currentFile);
    setButton('Consultando IA…', true);
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mimeType: prepared.mimeType,
        imageBase64: prepared.imageBase64,
        locality: localidad.value,
        environment: ambiente.value,
        details: detalle.value
      })
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (payload.error === 'gemini_not_configured') {
        throw new Error('El sistema ya está instalado, pero falta activar la clave de Gemini en el servidor.');
      }
      if (payload.error === 'rate_limited') {
        throw new Error('Se alcanzó el límite temporal de pruebas. Intentá nuevamente más tarde.');
      }
      throw new Error(payload.message || 'No se pudo obtener una respuesta del servicio de identificación.');
    }
    renderResult(payload.result || {});
    setButton('Analizar de nuevo', false);
  } catch (error) {
    console.error('O.FRE.SER Gemini identifier:', error);
    showError(error?.message || 'Ocurrió un error inesperado durante el análisis.');
    setButton('Reintentar análisis', false);
  } finally {
    busy = false;
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
  setButton('Analizar foto con IA', true);
});
