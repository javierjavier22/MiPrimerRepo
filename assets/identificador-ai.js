/*
  O.FRE.SER — Identificador de plagas con Gemini.
  La selección y previsualización de la foto se resuelven sin dependencias externas.
  La API key vive únicamente en el backend de Render.
*/
(function () {
  'use strict';

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

  if (!input || !drop || !preview || !analyze || !reset || !result) {
    console.error('O.FRE.SER identificador: faltan elementos de la interfaz.');
    return;
  }

  let currentFile = null;
  let busy = false;

  const GUIDANCE = {
    cockroach_german: ['Cucaracha alemana / germánica','Revisá cocinas, motores, bajo mesadas y zonas cálidas y húmedas. Reducí alimento y agua disponibles y corregí pérdidas.'],
    cockroach_american: ['Cucaracha americana','Revisá desagües, cámaras, rejillas, cañerías y sectores húmedos. Mejorá sellado y saneamiento.'],
    cockroach_other: ['Cucaracha','Reducí alimento y humedad, corregí pérdidas y sellá grietas. Una inspección ayuda a ubicar refugios y focos.'],
    rodent_house_mouse: ['Ratón doméstico','Reducí acceso a alimento, agua y refugio y sellá puntos de ingreso.'],
    rodent_rat: ['Rata','Revisá accesos, residuos, depósitos y fuentes de alimento. En establecimientos conviene un programa documentado.'],
    rodent_field_or_puna: ['Roedor de campo / ambiente natural','La especie exacta puede requerir confirmación. Evitá manipular ejemplares o restos sin protección.'],
    mosquito_aedes: ['Mosquito compatible con Aedes','Eliminá recipientes con agua acumulada y mantené depósitos protegidos. La especie debe confirmarse si no se ven rasgos diagnósticos.'],
    mosquito_other: ['Mosquito','Eliminá agua acumulada y revisá recipientes, canaletas, desagües y otros criaderos.'],
    fly: ['Mosca','Revisá residuos, materia orgánica, desagües y fuentes de atracción.'],
    ant: ['Hormiga','Buscá recorridos, fuentes de alimento y puntos de ingreso.'],
    scorpion: ['Alacrán / escorpión','No lo manipules con la mano. Ante una picadura, buscá atención médica urgente.'],
    kissing_bug: ['Vinchuca / triatomino','No la aplastes ni la manipules con la mano desnuda. Conviene solicitar confirmación.'],
    spider: ['Araña','No la manipules con la mano. La identificación de especie por fotografía puede ser limitada.'],
    bed_bug: ['Chinche de cama','Revisá costuras de colchones, respaldos, zócalos y muebles cercanos.'],
    flea: ['Pulga','El control suele requerir trabajar sobre el ambiente y, cuando corresponda, sobre los animales con asesoramiento veterinario.'],
    tick: ['Garrapata','Evitá manipularla sin protección. Revisá mascotas y ambientes.'],
    pantry_moth: ['Polilla de productos almacenados','Revisá harinas, granos, frutos secos y envases abiertos.'],
    stored_product_beetle: ['Gorgojo / escarabajo de productos almacenados','Inspeccioná alimentos secos y materias primas y limpiá profundamente el almacenamiento.'],
    wasp: ['Avispa','No golpees ni manipules nidos activos.'],
    termite: ['Termita','Buscá madera dañada, galerías o alas desprendidas y confirmá la identificación antes de tratar.'],
    other_pest: ['Otra plaga posible','Conviene confirmar la identificación antes de elegir una medida de control.'],
    not_pest: ['No parece una plaga identificable','Probá otra foto o consultanos si el organismo está causando un problema concreto.'],
    inconclusive: ['No concluyente','Probá otra foto más cerca, con buena luz y, si es posible, desde arriba y de costado.']
  };

  function setButton(text, disabled) {
    analyze.textContent = text;
    analyze.disabled = Boolean(disabled);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function isImage(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf('image/') === 0) return true;
    return /\.(jpe?g|jfif|png|webp|gif|heic|heif|avif)$/i.test(file.name || '');
  }

  function showInterfaceError(message) {
    result.classList.add('show');
    result.querySelector('.result-head').innerHTML = '<span>Identificador</span><h3>No se pudo completar la acción</h3>';
    result.querySelector('.result-body').innerHTML = '<p>' + escapeHtml(message) + '</p>';
  }

  function previewFile(file) {
    if (!file) return;
    if (!isImage(file)) {
      showInterfaceError('El archivo seleccionado no parece ser una imagen compatible. Probá con JPG, PNG, WEBP, HEIC o AVIF.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      showInterfaceError('La imagen supera 15 MB. Elegí una foto más liviana.');
      return;
    }

    currentFile = file;
    const reader = new FileReader();
    reader.onload = function () {
      preview.src = String(reader.result || '');
      drop.classList.add('has-image');
      result.classList.remove('show');
      setButton('Analizar foto con IA', false);
    };
    reader.onerror = function () {
      showInterfaceError('El navegador no pudo leer la imagen seleccionada. Probá con otra foto.');
    };
    reader.readAsDataURL(file);
  }

  /* Handler principal: una sola escucha de change, compatible con desktop y móvil. */
  input.addEventListener('change', function () {
    const file = input.files && input.files.length ? input.files[0] : null;
    previewFile(file);
  });

  /* Drag & drop para escritorio. */
  drop.addEventListener('dragover', function (e) {
    e.preventDefault();
    drop.classList.add('drag');
  });
  drop.addEventListener('dragleave', function () {
    drop.classList.remove('drag');
  });
  drop.addEventListener('drop', function (e) {
    e.preventDefault();
    drop.classList.remove('drag');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) previewFile(file);
  });

  function imageToPayload(file) {
    return new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function () {
        const img = new Image();
        img.onerror = function () {
          /* Fallback para formatos que el navegador no puede rasterizar. */
          const raw = String(reader.result || '');
          const comma = raw.indexOf(',');
          if (comma < 0) return reject(new Error('No se pudo leer la imagen.'));
          resolve({ mimeType: file.type || 'image/jpeg', imageBase64: raw.slice(comma + 1) });
        };
        img.onload = function () {
          const maxSide = 1600;
          const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.84);
          resolve({ mimeType: 'image/jpeg', imageBase64: dataUrl.split(',')[1] });
        };
        img.src = String(reader.result || '');
      };
      reader.readAsDataURL(file);
    });
  }

  function whatsappButton(resultName) {
    const parts = [
      'Hola O.FRE.SER, usé el identificador orientativo de plagas.',
      'Resultado orientativo: ' + resultName + '.',
      localidad && localidad.value ? 'Localidad: ' + localidad.value + '.' : '',
      ambiente && ambiente.value ? 'Lugar donde apareció: ' + ambiente.value + '.' : '',
      detalle && detalle.value ? 'Detalle: ' + detalle.value + '.' : '',
      'Quiero confirmar la identificación y saber cómo proceder. Puedo adjuntar la foto en este chat.'
    ].filter(Boolean).join('\n');
    return '<div class="actions"><a class="btn btn-green" href="https://wa.me/5493875286093?text=' + encodeURIComponent(parts) + '" target="_blank" rel="noopener noreferrer">Confirmar con O.FRE.SER por WhatsApp</a></div>';
  }

  function renderResult(data) {
    const head = result.querySelector('.result-head');
    const body = result.querySelector('.result-body');
    const key = data.category_key || 'inconclusive';
    const guide = GUIDANCE[key] || GUIDANCE.inconclusive;
    const title = guide[0];
    const action = guide[1];
    const confidence = data.confidence === 'high' ? 'Confianza visual alta' : data.confidence === 'medium' ? 'Confianza visual moderada' : 'Confianza visual baja';

    if (data.status === 'uncertain' || key === 'inconclusive') {
      head.innerHTML = '<span>Resultado con Gemini · Beta</span><h3>No concluyente</h3>';
      body.innerHTML = '<p><strong>' + confidence + '.</strong> ' + escapeHtml(data.explanation || action) + '</p>' +
        '<div class="result-grid"><div class="result-mini"><strong>Qué hacer</strong><p>' + escapeHtml(action) + '</p></div><div class="result-mini"><strong>Siguiente paso</strong><p>Probá una segunda foto o confirmá con nuestro equipo técnico.</p></div></div>' +
        whatsappButton('No concluyente');
      return;
    }

    const species = data.likely_species ? escapeHtml(data.likely_species) : 'No determinada con suficiente evidencia';
    const traits = Array.isArray(data.visible_traits) && data.visible_traits.length ? data.visible_traits.map(function(t){ return '<li>' + escapeHtml(t) + '</li>'; }).join('') : '<li>No se informaron rasgos específicos.</li>';
    const alternatives = Array.isArray(data.alternatives) && data.alternatives.length ? data.alternatives.map(function(a){ return escapeHtml(a.name); }).join(' · ') : 'Sin alternativas relevantes informadas.';

    head.innerHTML = '<span>Resultado con Gemini · Beta</span><h3>' + escapeHtml(title) + '</h3>';
    body.innerHTML = '<p><strong>' + confidence + '.</strong> ' + escapeHtml(data.explanation || '') + '</p>' +
      '<div class="result-grid">' +
      '<div class="result-mini"><strong>Grupo probable</strong><p>' + escapeHtml(data.group_name || title) + '</p></div>' +
      '<div class="result-mini"><strong>Especie probable</strong><p>' + species + '</p></div>' +
      '<div class="result-mini"><strong>Rasgos visibles</strong><ul style="margin:7px 0 0;padding-left:18px;font-size:.78rem">' + traits + '</ul></div>' +
      '<div class="result-mini"><strong>Otras posibilidades</strong><p>' + alternatives + '</p></div>' +
      '<div class="result-mini"><strong>Qué hacer ahora</strong><p>' + escapeHtml(action) + '</p></div>' +
      '<div class="result-mini"><strong>Importante</strong><p>La identificación sigue siendo orientativa y puede requerir confirmación.</p></div>' +
      '</div>' + whatsappButton(title);
  }

  analyze.addEventListener('click', async function (e) {
    e.preventDefault();
    const selected = currentFile || (input.files && input.files[0]);
    if (!selected || busy) return;
    currentFile = selected;
    busy = true;
    setButton('Preparando imagen…', true);
    result.classList.add('show');
    result.querySelector('.result-head').innerHTML = '<span>Análisis con Gemini</span><h3>Analizando la imagen…</h3>';
    result.querySelector('.result-body').innerHTML = '<p>Esto puede demorar unos segundos.</p>';

    try {
      const prepared = await imageToPayload(currentFile);
      setButton('Consultando IA…', true);
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mimeType: prepared.mimeType,
          imageBase64: prepared.imageBase64,
          locality: localidad ? localidad.value : '',
          environment: ambiente ? ambiente.value : '',
          details: detalle ? detalle.value : ''
        })
      });
      const payload = await response.json().catch(function(){ return {}; });
      if (!response.ok) throw new Error(payload.message || 'No se pudo obtener una respuesta del servicio de identificación.');
      renderResult(payload.result || {});
      setButton('Analizar de nuevo', false);
    } catch (error) {
      console.error('O.FRE.SER Gemini identifier:', error);
      showInterfaceError(error && error.message ? error.message : 'Ocurrió un error durante el análisis.');
      setButton('Reintentar análisis', false);
    } finally {
      busy = false;
    }
  });

  reset.addEventListener('click', function () {
    input.value = '';
    currentFile = null;
    preview.removeAttribute('src');
    drop.classList.remove('has-image');
    result.classList.remove('show');
    if (localidad) localidad.value = '';
    if (ambiente) ambiente.value = '';
    if (detalle) detalle.value = '';
    setButton('Analizar foto con IA', true);
  });

  console.info('O.FRE.SER identificador Gemini: interfaz lista.');
})();
