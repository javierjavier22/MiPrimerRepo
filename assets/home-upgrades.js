/*
  O.FRE.SER — mejoras visuales HOME.
  Mantiene separadas las mejoras del bloque institucional y Google para que sean fáciles de editar.
*/
(function(){
  'use strict';
  if(!document.body.classList.contains('home-page')) return;

  const mapsDirections='https://www.google.com/maps/dir/?api=1&destination=Grupo+Mor%C3%B3n+O.FRE.SER+Gestion+Integral+de+Plagas+Salta&destination_place_id=ChIJT_yRt7bDG5QRQxXpXnK6bFE';
  const mapsProfile='https://www.google.com/maps/search/?api=1&query=Grupo+Mor%C3%B3n+O.FRE.SER+Gestion+Integral+de+Plagas+Salta&query_place_id=ChIJT_yRt7bDG5QRQxXpXnK6bFE';

  const style=document.createElement('style');
  style.textContent=`
    .trustbar{padding:30px 0;background:#fff}
    .trustgrid{grid-template-columns:1.15fr .92fr .92fr 1.05fr;border-radius:18px;box-shadow:0 10px 30px rgba(10,34,76,.055)}
    .trustitem{min-height:150px;padding:20px 24px;display:flex;flex-direction:column;justify-content:center;gap:7px;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
    .trustitem:hover{background:#fbfcff}
    a.trustitem:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px rgba(23,56,176,.08)}
    .trust-visual{height:52px;display:flex;align-items:center;margin-bottom:3px}
    .trust-visual img{max-width:142px;max-height:52px;width:auto;height:auto;object-fit:contain}
    .trust-cert .trust-visual img{max-width:112px;max-height:54px}
    .trustitem strong{font-size:.9rem}.trustitem span{line-height:1.45}
    .trust-mini{font-size:.68rem!important;font-weight:760;color:var(--blue)!important;letter-spacing:.02em}
    .trust-map-visual{height:52px;display:flex;align-items:center;gap:11px;color:var(--blue);margin-bottom:2px}
    .trust-map-visual svg{width:48px;height:48px;flex:0 0 auto}
    .trust-map-lines{display:grid;gap:4px;flex:1;max-width:120px}
    .trust-map-lines i{display:block;height:3px;background:#dbe3f4;border-radius:99px;transform:rotate(-7deg)}
    .trust-map-lines i:nth-child(2){width:78%;margin-left:15%;transform:rotate(7deg)}
    .trust-map-lines i:nth-child(3){width:62%;margin-left:5%}
    .google-proof{padding:34px 0 42px;background:#f7f9fc;border-bottom:1px solid var(--line)}
    .google-proof-card{display:grid;grid-template-columns:auto 1fr auto;gap:26px;align-items:center;padding:25px 28px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(10,34,76,.07)}
    .google-mark{width:58px;height:58px;border-radius:15px;display:grid;place-items:center;background:#fff;border:1px solid #e5e8ee;font-size:1.9rem;font-weight:850;color:#4285f4}
    .google-proof h3{font-size:1.18rem;margin-bottom:6px}
    .google-rating{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
    .google-rating strong{font-size:2rem;color:var(--ink);line-height:1}
    .google-stars{color:#f4b400;letter-spacing:.08em;font-size:1.03rem}
    .google-proof p{font-size:.82rem;margin-top:7px}
    .google-proof .btn{white-space:nowrap}
    @media(max-width:980px){
      .trustgrid{grid-template-columns:1fr 1fr}
      .trustitem+.trustitem{border-left:0}
      .trustitem:nth-child(even){border-left:1px solid var(--line)}
      .trustitem:nth-child(n+3){border-top:1px solid var(--line)}
      .google-proof-card{grid-template-columns:auto 1fr}.google-proof .btn{grid-column:1/-1;width:100%}
    }
    @media(max-width:620px){
      .trustgrid{grid-template-columns:1fr}.trustitem{min-height:128px;padding:18px 20px}.trustitem:nth-child(even){border-left:0}.trustitem:nth-child(n+2){border-top:1px solid var(--line)}
      .trust-visual{height:44px}.trust-visual img{max-height:44px}.trust-cert .trust-visual img{max-height:47px}
      .google-proof{padding:24px 0 30px}.google-proof-card{grid-template-columns:1fr;text-align:center;gap:15px;padding:22px 20px}.google-mark{margin:auto}.google-rating{justify-content:center}
    }
  `;
  document.head.appendChild(style);

  const trust=document.querySelector('.trustgrid');
  if(trust){
    trust.innerHTML=`
      <div class="trustitem trust-brand">
        <div class="trust-visual"><img src="assets/img/logo-ofreser.webp" alt="O.FRE.SER Grupo Morón" loading="lazy" decoding="async"></div>
        <strong>Gestión Integral de Plagas</strong>
        <span>Minería · Industria · Comercios · Hogares</span>
      </div>
      <a class="trustitem trust-cert" href="calidad-ambiente.html" aria-label="Ver certificación ISO 9001 de O.FRE.SER">
        <div class="trust-visual"><img src="assets/img/iso-9001.webp" alt="Certificación IRAM ISO 9001" loading="lazy" decoding="async"></div>
        <strong>IRAM · IQNET</strong>
        <span>ISO 9001:2015 · RI 9000-8842</span>
      </a>
      <a class="trustitem trust-cert" href="calidad-ambiente.html" aria-label="Ver certificación ISO 14001 de O.FRE.SER">
        <div class="trust-visual"><img src="assets/img/iso-14001.webp" alt="Certificación IRAM ISO 14001" loading="lazy" decoding="async"></div>
        <strong>IRAM · IQNET</strong>
        <span>ISO 14001:2015 · RI 14000-1012</span>
      </a>
      <a class="trustitem trust-location" href="${mapsDirections}" target="_blank" rel="noopener noreferrer" aria-label="Cómo llegar a O.FRE.SER en Google Maps">
        <div class="trust-map-visual" aria-hidden="true">
          <svg viewBox="0 0 64 64" fill="none"><path d="M32 57s17-15.7 17-31A17 17 0 1 0 15 26c0 15.3 17 31 17 31Z" fill="#eef3ff" stroke="#1738b0" stroke-width="2.5"/><circle cx="32" cy="26" r="6" fill="#2f9d69"/></svg>
          <div class="trust-map-lines"><i></i><i></i><i></i></div>
        </div>
        <strong>Atención en Salta</strong>
        <span>Gral. Güemes 1340 · asesoramiento y venta al público</span>
        <span class="trust-mini">Cómo llegar en Google Maps →</span>
      </a>`;
  }

  const trustbar=document.querySelector('.trustbar');
  if(trustbar&&!document.querySelector('.google-proof')){
    const section=document.createElement('section');
    section.className='google-proof';
    section.setAttribute('aria-label','Opiniones de clientes en Google');
    section.innerHTML=`<div class="container"><div class="google-proof-card">
      <div class="google-mark" aria-hidden="true">G</div>
      <div>
        <h3>Opiniones de clientes en Google</h3>
        <div class="google-rating"><strong>4,6</strong><span class="google-stars" aria-label="4,6 de 5 estrellas">★★★★★</span><span>180 reseñas</span></div>
        <p>Valoración pública del perfil de O.FRE.SER en Google. Podés consultar las opiniones completas directamente en Google Maps.</p>
      </div>
      <a class="btn btn-outline" href="${mapsProfile}" target="_blank" rel="noopener noreferrer">Ver opiniones en Google</a>
    </div></div>`;
    trustbar.insertAdjacentElement('afterend',section);
  }
})();
