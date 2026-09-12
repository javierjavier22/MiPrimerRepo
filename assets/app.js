/* O.FRE.SER — interacciones del mockup. Sin dependencias externas. */
/* Carga la hoja de fotografías reales del mockup. En producción puede enlazarse directamente desde <head>. */
if(!document.querySelector('link[href^="assets/photos.css"]')){
  const photos=document.createElement('link');
  photos.rel='stylesheet';
  photos.href='assets/photos.css?v=2';
  document.head.appendChild(photos);
}

const menuBtn=document.querySelector('.menu-btn');
const mobileNav=document.querySelector('.mobile-nav');
if(menuBtn&&mobileNav){
  if(!mobileNav.id) mobileNav.id='mobileNav';
  menuBtn.setAttribute('aria-controls',mobileNav.id);
  menuBtn.setAttribute('aria-expanded','false');
  menuBtn.type='button';
  const closeMenu=()=>{mobileNav.classList.remove('open');menuBtn.setAttribute('aria-expanded','false')};
  menuBtn.addEventListener('click',()=>{
    const open=mobileNav.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded',String(open));
  });
  mobileNav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeMenu()});
}

/* Formulario comercial: prepara la consulta en WhatsApp. El mockup no persiste datos. */
const form=document.querySelector('#contactForm');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const data=new FormData(form);
    const lines=[
      'Hola O.FRE.SER, quiero realizar una consulta.',
      `Nombre: ${data.get('nombre')||''}`,
      `Empresa/establecimiento: ${data.get('empresa')||''}`,
      `Tipo de consulta: ${data.get('tipo')||''}`,
      `Localidad: ${data.get('localidad')||''}`,
      `Teléfono: ${data.get('telefono')||''}`,
      `Mensaje: ${data.get('mensaje')||''}`
    ];
    const url='https://wa.me/5493875286093?text='+encodeURIComponent(lines.join('\n'));
    window.open(url,'_blank','noopener,noreferrer');
  });
}
