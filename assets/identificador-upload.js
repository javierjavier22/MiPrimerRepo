/*
  O.FRE.SER — manejador robusto de selección de imágenes del identificador.

  Este archivo mantiene la selección/previsualización separada del motor de IA.
  Así, aunque el navegador tenga en caché una versión anterior del clasificador,
  elegir una foto debe mostrarla inmediatamente y habilitar el botón de análisis.
*/
(function(){
  const input = document.getElementById('fileInput');
  const drop = document.getElementById('dropzone');
  const preview = document.getElementById('preview');
  const analyze = document.getElementById('analyzeBtn');
  if(!input || !drop || !preview || !analyze) return;

  let previewUrl = null;

  function esImagen(file){
    if(!file) return false;
    if(typeof file.type === 'string' && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|jfif|png|webp|gif|heic|heif|avif)$/i.test(file.name || '');
  }

  function mostrar(file){
    if(!file) return;
    if(!esImagen(file)){
      alert('El archivo seleccionado no parece ser una imagen compatible. Probá con JPG, PNG, WEBP, HEIC o AVIF.');
      return;
    }
    if(file.size > 15 * 1024 * 1024){
      alert('La imagen supera 15 MB. Elegí una foto más liviana.');
      return;
    }

    if(previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    preview.src = previewUrl;
    drop.classList.add('has-image');
    analyze.disabled = false;
    analyze.textContent = 'Analizar foto con IA';

    /* Evento adicional para que el motor de IA pueda sincronizarse si lo necesita. */
    window.dispatchEvent(new CustomEvent('ofreser:pest-file-selected', { detail: { file } }));
  }

  input.addEventListener('change', function(){
    mostrar(this.files && this.files[0]);
  });

  /* Drag & drop en escritorio. */
  drop.addEventListener('dragover', function(e){ e.preventDefault(); drop.classList.add('drag'); });
  drop.addEventListener('dragleave', function(){ drop.classList.remove('drag'); });
  drop.addEventListener('drop', function(e){
    e.preventDefault();
    drop.classList.remove('drag');
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if(file){
      try{
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
      }catch(_){ /* Algunos navegadores no permiten reasignar FileList; igual mostramos la vista previa. */ }
      mostrar(file);
    }
  });
})();
