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

/* Video institucional: Argentina Mining en la página de Minería. Se incrusta desde Drive sólo al entrar en esa página. */
if(currentFile==='mineria.html'&&!document.querySelector('.mining-event-section')){
  const clientSection=[...document.querySelectorAll('main > section')].find(s=>s.textContent.includes('Organizaciones que confían en O.FRE.SER'));
  const html=`<section class="section soft mining-event-section"><div class="container"><div class="section-head"><div><span class="eyebrow">Presencia en el sector</span><h2>O.FRE.SER en Argentina Mining.</h2></div><p>Además del trabajo en campo, participamos en espacios que reúnen a empresas, proveedores y profesionales de la actividad minera. Son oportunidades para mostrar nuestro enfoque, intercambiar experiencia y mantenernos cerca de los desafíos reales del sector.</p></div><div class="media-split reverse"><div><span class="eyebrow">Argentina Mining</span><h3 style="font-size:1.35rem;margin:10px 0 12px">Stand, equipo y presencia institucional.</h3><p class="lead">Un registro breve de nuestra participación en el encuentro, mostrando la presencia de O.FRE.SER dentro del ecosistema minero.</p><div class="actions"><a class="btn btn-primary" href="contacto.html">Hablar con División Minería</a></div></div><iframe aria-label="Video O.FRE.SER en Argentina Mining" allow="autoplay; fullscreen" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin" src="https://drive.google.com/file/d/1MhgARtrJDiHvqrJKOU3lAcYKvpjPgftx/preview" style="width:100%;aspect-ratio:16/9;border:0;border-radius:16px;box-shadow:var(--shadow);background:#081a34"></iframe></div></div></section>`;
  if(clientSection) clientSection.insertAdjacentHTML('beforebegin',html); else document.querySelector('main')?.insertAdjacentHTML('beforeend',html);
}

/* Carrusel del equipo en Nosotros: automático, manual, accesible y con swipe en móvil. */
if(currentFile==='nosotros.html'&&!document.querySelector('.team-photo-carousel')){
  const teamSection=[...document.querySelectorAll('main > section')].find(s=>s.textContent.includes('El servicio se construye entre áreas'));
  const originalImage=teamSection?.querySelector('.container > img');
  if(teamSection&&originalImage){
    const carouselPhotos=[
      ['equipo-ofreser.webp','Equipo O.FRE.SER','Equipo O.FRE.SER'],
      ['equipo-directivo-banner.webp','Equipo O.FRE.SER en actividad institucional','Equipo y presencia institucional'],
      ['equipo-directivo-local.webp','Equipo O.FRE.SER en el local comercial','Equipo y atención en Salta'],
      ['mineria-equipo.webp','Equipo O.FRE.SER en operación minera','Trabajo en operaciones de alta exigencia'],
      ['mineria-operarios.webp','Operarios O.FRE.SER en campo','Nuestro equipo técnico en campo']
    ];
    const style=document.createElement('style');
    style.textContent=`
      .team-photo-carousel{position:relative;border-radius:18px;overflow:hidden;background:#081a34;box-shadow:var(--shadow);outline:none}
      .team-carousel-stage{position:relative;aspect-ratio:16/8.7;min-height:360px;background:#081a34}
      .team-carousel-slide{position:absolute;inset:0;opacity:0;visibility:hidden;transition:opacity .55s ease;display:grid;grid-template-rows:1fr auto;background:#081a34}
      .team-carousel-slide.is-active{opacity:1;visibility:visible;z-index:1}
      .team-carousel-slide img{width:100%;height:100%;min-height:0;object-fit:contain;object-position:center;background:#081a34}
      .team-carousel-caption{position:absolute;left:18px;bottom:18px;z-index:2;background:rgba(8,26,52,.86);color:#fff;padding:9px 13px;border-radius:9px;font-size:.78rem;font-weight:760;backdrop-filter:blur(8px)}
      .team-carousel-btn{position:absolute;top:50%;z-index:4;transform:translateY(-50%);width:46px;height:46px;border:1px solid rgba(255,255,255,.32);border-radius:50%;background:rgba(8,26,52,.74);color:#fff;font-size:1.7rem;line-height:1;display:grid;place-items:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,0,0,.18)}
      .team-carousel-btn:hover{background:rgba(23,56,176,.92)}
      .team-carousel-prev{left:16px}.team-carousel-next{right:16px}
      .team-carousel-dots{display:flex;justify-content:center;gap:8px;padding:14px 16px;background:#fff;border:1px solid var(--line);border-top:0;border-radius:0 0 18px 18px}
      .team-carousel-dot{width:10px;height:10px;border:0;border-radius:50%;padding:0;background:#c7cfdb;cursor:pointer}
      .team-carousel-dot.is-active{background:var(--blue);transform:scale(1.18)}
      @media(max-width:720px){
        .team-carousel-stage{aspect-ratio:4/3;min-height:250px}
        .team-carousel-slide img{object-fit:contain}
        .team-carousel-btn{width:42px;height:42px;font-size:1.5rem}
        .team-carousel-prev{left:10px}.team-carousel-next{right:10px}
        .team-carousel-caption{left:12px;right:12px;bottom:12px;font-size:.72rem;text-align:center}
      }
      @media(prefers-reduced-motion:reduce){.team-carousel-slide{transition:none}}
    `;
    document.head.appendChild(style);

    const carousel=document.createElement('div');
    carousel.className='team-photo-carousel';
    carousel.setAttribute('role','region');
    carousel.setAttribute('aria-label','Galería de fotos del equipo O.FRE.SER');
    carousel.setAttribute('tabindex','0');

    const stage=document.createElement('div');stage.className='team-carousel-stage';
    const slides=carouselPhotos.map(([src,alt,caption],i)=>{
      const figure=document.createElement('figure');figure.className='team-carousel-slide'+(i===0?' is-active':'');figure.setAttribute('aria-hidden',i===0?'false':'true');
      const img=document.createElement('img');img.src='assets/img/'+src;img.alt=alt;img.loading=i===0?'eager':'lazy';img.decoding='async';
      const figcaption=document.createElement('figcaption');figcaption.className='team-carousel-caption';figcaption.textContent=caption;
      figure.append(img,figcaption);stage.appendChild(figure);return figure;
    });

    const prev=document.createElement('button');prev.type='button';prev.className='team-carousel-btn team-carousel-prev';prev.setAttribute('aria-label','Foto anterior');prev.textContent='‹';
    const next=document.createElement('button');next.type='button';next.className='team-carousel-btn team-carousel-next';next.setAttribute('aria-label','Foto siguiente');next.textContent='›';
    stage.append(prev,next);

    const dots=document.createElement('div');dots.className='team-carousel-dots';
    const dotButtons=carouselPhotos.map((_,i)=>{
      const dot=document.createElement('button');dot.type='button';dot.className='team-carousel-dot'+(i===0?' is-active':'');dot.setAttribute('aria-label',`Ir a la foto ${i+1} de ${carouselPhotos.length}`);dot.setAttribute('aria-pressed',i===0?'true':'false');dots.appendChild(dot);return dot;
    });
    carousel.append(stage,dots);originalImage.replaceWith(carousel);

    let activeIndex=0;let timer=null;let touchStartX=0;
    const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const showSlide=index=>{
      activeIndex=(index+slides.length)%slides.length;
      slides.forEach((slide,i)=>{const active=i===activeIndex;slide.classList.toggle('is-active',active);slide.setAttribute('aria-hidden',active?'false':'true')});
      dotButtons.forEach((dot,i)=>{const active=i===activeIndex;dot.classList.toggle('is-active',active);dot.setAttribute('aria-pressed',active?'true':'false')});
    };
    const stopAuto=()=>{if(timer){clearInterval(timer);timer=null}};
    const startAuto=()=>{if(!reducedMotion&&!timer) timer=setInterval(()=>showSlide(activeIndex+1),5000)};
    prev.addEventListener('click',()=>{showSlide(activeIndex-1);stopAuto();startAuto()});
    next.addEventListener('click',()=>{showSlide(activeIndex+1);stopAuto();startAuto()});
    dotButtons.forEach((dot,i)=>dot.addEventListener('click',()=>{showSlide(i);stopAuto();startAuto()}));
    carousel.addEventListener('mouseenter',stopAuto);carousel.addEventListener('mouseleave',startAuto);
    carousel.addEventListener('focusin',stopAuto);carousel.addEventListener('focusout',startAuto);
    carousel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();showSlide(activeIndex-1)}if(e.key==='ArrowRight'){e.preventDefault();showSlide(activeIndex+1)}});
    carousel.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX;stopAuto()},{passive:true});
    carousel.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>45) showSlide(activeIndex+(dx<0?1:-1));startAuto()},{passive:true});
    document.addEventListener('visibilitychange',()=>document.hidden?stopAuto():startAuto());
    startAuto();
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
