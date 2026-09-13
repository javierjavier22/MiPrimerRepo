/* O.FRE.SER — interacciones del mockup. Sin dependencias externas. */
/* Carga la hoja de fotografías reales del mockup. En producción puede enlazarse directamente desde <head>. */
if(!document.querySelector('link[href^="assets/photos.css"]')){
  const photos=document.createElement('link');
  photos.rel='stylesheet';
  photos.href='assets/photos.css?v=4';
  document.head.appendChild(photos);
}

const currentFile=(location.pathname.split('/').pop()||'index.html');

/* Navegación principal: orden comercial definido para el mockup. */
const navItems=[
  ['index.html','Inicio'],
  ['mineria.html','Minería'],
  ['industria.html','Industria'],
  ['hogares.html','Hogares y comercios'],
  ['calidad-ambiente.html','Calidad y ambiente'],
  ['aprende.html','Aprendé sobre plagas'],
  ['productos.html','Venta al público'],
  ['nosotros.html','Nosotros']
];
function rebuildNav(nav,isMobile=false){
  if(!nav) return;
  const cta=isMobile?nav.querySelector('.btn'):null;
  [...nav.querySelectorAll('a:not(.btn)')].forEach(a=>a.remove());
  navItems.forEach(([href,label])=>{
    const a=document.createElement('a');
    a.href=href;a.textContent=label;
    const active=(currentFile===href)||(currentFile===''&&href==='index.html');
    if(active){a.classList.add('active');a.setAttribute('aria-current','page')}
    if(cta) nav.insertBefore(a,cta); else nav.appendChild(a);
  });
}
rebuildNav(document.querySelector('.navlinks'));
rebuildNav(document.querySelector('.mobile-nav'),true);

/* Link del local/productos también en el footer. */
document.querySelectorAll('.footer h4').forEach(h=>{
  if(h.textContent.trim()==='Información'){
    const col=h.parentElement;
    if(!col.querySelector('a[href="productos.html"]')){
      const a=document.createElement('a');a.href='productos.html';a.textContent='Venta al público';
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

const knowledgeCards=[
  ['Roedores','Ratas y ratones','Señales de actividad, especies urbanas frecuentes, prevención y monitoreo.','roedores.html'],
  ['Mosquitos','Criaderos y prevención','Aedes aegypti, agua acumulada, prevención y control.','mosquitos.html'],
  ['Cucarachas','Hábitos y refugios','Identificación, saneamiento, exclusión y Manejo Integrado.','cucarachas.html'],
  ['Alacranes','Prevención y seguridad','Cómo reducir refugios e ingresos y qué hacer ante una picadura.','alacranes.html'],
  ['Moscas','Saneamiento y exclusión','Fuentes de atracción, protección de alimentos y monitoreo.','moscas.html'],
  ['Almacenadas','Productos almacenados','Polillas y escarabajos asociados a alimentos secos y depósitos.','plagas-almacenadas.html']
];
const cardMarkup=knowledgeCards.map(([k,t,d,h])=>`<article class="card pest-card"><span class="kicker">${k}</span><h3>${t}</h3><p>${d}</p><a class="link" href="${h}">Abrir guía</a></article>`).join('');

/* HOME: mostrar todas las guías, no sólo un teaser. */
if(document.body.classList.contains('home-page')){
  const learnSection=[...document.querySelectorAll('main > section')].find(s=>s.textContent.includes('Entender el problema es el primer paso'));
  const cards=learnSection?.querySelector('.cards');
  if(cards) cards.innerHTML=cardMarkup;
}

/* Centro de conocimiento: cada tarjeta abre su guía específica y el texto refleja el estado real. */
if(currentFile==='aprende.html'){
  const cards=document.querySelector('.cards');
  if(cards) cards.innerHTML=cardMarkup;
  const headP=document.querySelector('.section-head > p');
  if(headP) headP.textContent='Guías prácticas basadas en fuentes sanitarias oficiales, organismos técnicos y universidades. Cada ficha separa identificación, prevención y cuándo conviene recurrir a un profesional.';
}

/* Marquesina continua de clientes en HOME. */
if(document.body.classList.contains('home-page')){
  const logoGrid=document.querySelector('.client-logo-grid');
  if(logoGrid){
    const logos=[
      ['cliente-posco-argentina.webp','POSCO Argentina'],
      ['cliente-rio-tinto.webp','Rio Tinto'],
      ['cliente-ganfeng.webp','Ganfeng Lithium'],
      ['cliente-mansfield.webp','Mansfield Minera'],
      ['cliente-pampa-energia.webp','Pampa Energía'],
      ['cliente-ingenio-san-isidro.webp','Ingenio San Isidro'],
      ['cliente-philips-morris-massalin.webp','Philip Morris Argentina'],
      ['cliente-snacko.webp','Snacko'],
      ['cliente-coprotab.webp','COPROTAB'],
      ['cliente-grupo-agv.webp','Grupo AGV'],
      ['cliente-grupo-ruiz-de-los-llanos.webp','Grupo Ruiz de los Llanos'],
      ['cliente-high-luck.webp','High Luck'],
      ['cliente-molino-pampa-blanca.webp','Molino Pampa Blanca'],
      ['cliente-puna-mining.webp','Puna Mining'],
      ['cliente-catering-de-altura.webp','Catering de Altura']
    ];
    const makeSet=(hidden=false)=>{
      const set=document.createElement('div');set.className='logo-marquee-set';
      if(hidden) set.setAttribute('aria-hidden','true');
      logos.forEach(([src,alt])=>{
        const item=document.createElement('div');item.className='logo-marquee-item';
        const img=document.createElement('img');img.src='assets/img/'+src;img.alt=hidden?'':alt;img.loading='lazy';img.decoding='async';
        item.appendChild(img);set.appendChild(item);
      });
      return set;
    };
    const viewport=document.createElement('div');viewport.className='logo-marquee';viewport.setAttribute('aria-label','Empresas que confían en O.FRE.SER');
    const track=document.createElement('div');track.className='logo-marquee-track';
    track.append(makeSet(false),makeSet(true));viewport.appendChild(track);
    logoGrid.replaceWith(viewport);
  }
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
