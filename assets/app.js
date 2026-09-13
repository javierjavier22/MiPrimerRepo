/* O.FRE.SER — interacciones del mockup. Sin dependencias externas. */
/* Carga la hoja de fotografías reales del mockup. En producción puede enlazarse directamente desde <head>. */
if(!document.querySelector('link[href^="assets/photos.css"]')){
  const photos=document.createElement('link');
  photos.rel='stylesheet';
  photos.href='assets/photos.css?v=3';
  document.head.appendChild(photos);
}

/* Mejora de navegación: acceso Inicio visible además del logo. */
const currentFile=(location.pathname.split('/').pop()||'index.html');
document.querySelectorAll('.navlinks,.mobile-nav').forEach(nav=>{
  const hasInicio=[...nav.querySelectorAll('a')].some(a=>a.textContent.trim()==='Inicio');
  if(!hasInicio){
    const a=document.createElement('a');
    a.href='index.html';a.textContent='Inicio';
    if(currentFile==='index.html'||currentFile===''){a.classList.add('active');a.setAttribute('aria-current','page')}
    nav.insertBefore(a,nav.firstChild);
  }
});

/* Link del local/productos en el footer sin recargar el menú principal. */
document.querySelectorAll('.footer h4').forEach(h=>{
  if(h.textContent.trim()==='Información'){
    const col=h.parentElement;
    if(!col.querySelector('a[href="productos.html"]')){
      const a=document.createElement('a');a.href='productos.html';a.textContent='Productos y local';
      const first=col.querySelector('a');first?first.insertAdjacentElement('afterend',a):col.appendChild(a);
    }
  }
});

/* Marca HOME para aplicar estilos exclusivos sin afectar páginas internas. */
if(document.querySelector('.hero')) document.body.classList.add('home-page');

/* Sección de venta al público en HOME. */
if(document.body.classList.contains('home-page')&&!document.querySelector('.retail-section')){
  const sections=[...document.querySelectorAll('main > section')];
  const contactSection=sections.find(s=>s.textContent.includes('¿Necesitás resolver una plaga')||s.textContent.includes('Hablemos'));
  const html=`<section class="section soft retail-section"><div class="container"><div class="section-head"><div><span class="eyebrow">Venta al público</span><h2>Productos y asesoramiento en nuestro local.</h2></div><p>Además de los servicios profesionales, en Gral. Güemes 1340 contamos con productos seleccionados para prevención y control. La disponibilidad varía según stock y cada producto debe utilizarse de acuerdo con su etiqueta.</p></div><div class="media-split reverse"><div><div class="product-category-grid"><div class="product-category"><span>01</span><h3>Cebos y soluciones para roedores</h3><p>Opciones para distintos contextos, con asesoramiento sobre uso responsable.</p></div><div class="product-category"><span>02</span><h3>Trampas y estaciones</h3><p>Dispositivos para monitoreo, captura y manejo preventivo.</p></div><div class="product-category"><span>03</span><h3>Control de insectos</h3><p>Productos y alternativas para insectos rastreros y voladores.</p></div><div class="product-category"><span>04</span><h3>Accesorios y prevención</h3><p>Elementos complementarios para mantenimiento, exclusión y control.</p></div></div><div class="actions"><a class="btn btn-primary" href="productos.html">Ver productos y categorías</a><a class="btn btn-outline" href="contacto.html">Consultar stock</a></div></div><img alt="Interior del local comercial O.FRE.SER y productos disponibles para venta al público" decoding="async" height="1402" loading="lazy" src="assets/img/local-interior.webp" width="1122"></div></div></section>`;
  if(contactSection) contactSection.insertAdjacentHTML('beforebegin',html); else document.querySelector('main')?.insertAdjacentHTML('beforeend',html);
}

/* Centro de conocimiento: cada tarjeta abre su guía específica. */
if(currentFile==='aprende.html'){
  const pestMap={
    'Ratas y ratones':'roedores.html',
    'Criaderos y prevención':'mosquitos.html',
    'Hábitos y refugios':'cucarachas.html',
    'Prevención en viviendas':'alacranes.html',
    'Atracción y saneamiento':'moscas.html',
    'Plagas de productos':'plagas-almacenadas.html'
  };
  document.querySelectorAll('.card').forEach(card=>{
    const h=card.querySelector('h3'); if(!h) return;
    const href=pestMap[h.textContent.trim()]; if(!href) return;
    let link=card.querySelector('.link');
    if(!link){link=document.createElement('a');link.className='link';link.textContent='Abrir guía';card.appendChild(link)}
    link.href=href;
  });
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
