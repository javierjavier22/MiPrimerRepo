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
    .trustbar{padding:32px 0;background:#fff}
    .trustgrid{grid-template-columns:repeat(4,1fr);border-radius:20px;box-shadow:0 14px 36px rgba(10,34,76,.07);overflow:hidden}
    .trustitem{min-height:210px;padding:24px 26px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;text-align:center;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}
    .trustitem:hover{background:#fbfcff}
    a.trustitem:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px rgba(23,56,176,.08)}
    .trust-visual{height:88px;width:100%;display:flex;align-items:center;justify-content:center;margin-bottom:4px}
    .trust-visual img{width:auto;height:auto;object-fit:contain;display:block}
    .trust-brand .trust-visual img{max-width:245px;max-height:88px}
    .trust-cert .trust-visual{height:92px}
    .trust-cert .trust-visual img{max-width:245px;max-height:92px}
    .trustitem strong{font-size:.98rem;line-height:1.25}.trustitem span{line-height:1.45;font-size:.77rem}
    .trust-mini{font-size:.72rem!important;font-weight:800;color:var(--blue)!important;letter-spacing:.01em;margin-top:2px}
    .trust-map-visual{height:94px;width:100%;display:flex;align-items:center;justify-content:center;margin-bottom:2px}
    .trust-map-visual svg{width:122px;height:88px;display:block;filter:drop-shadow(0 8px 14px rgba(23,56,176,.10))}
    .google-proof{padding:34px 0 42px;background:#f7f9fc;border-bottom:1px solid var(--line)}
    .google-proof-card{display:grid;grid-template-columns:auto 1fr auto;gap:26px;align-items:center;padding:25px 28px;border:1px solid var(--line);border-radius:18px;background:#fff;box-shadow:0 12px 34px rgba(10,34,76,.07)}
    .google-mark{width:58px;height:58px;border-radius:15px;display:grid;place-items:center;background:#fff;border:1px solid #e5e8ee;font-size:1.9rem;font-weight:850;color:#4285f4}
    .google-proof h3{font-size:1.18rem;margin-bottom:6px}
    .google-rating{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
    .google-rating strong{font-size:2rem;color:var(--ink);line-height:1}
    .google-stars{color:#f4b400;letter-spacing:.08em;font-size:1.03rem}
    .google-proof p{font-size:.82rem;margin-top:7px}
    .google-proof .btn{white-space:nowrap}
    @media(max-width:1100px){
      .trust-brand .trust-visual img,.trust-cert .trust-visual img{max-width:210px}
    }
    @media(max-width:980px){
      .trustgrid{grid-template-columns:1fr 1fr}
      .trustitem+.trustitem{border-left:0}
      .trustitem:nth-child(even){border-left:1px solid var(--line)}
      .trustitem:nth-child(n+3){border-top:1px solid var(--line)}
      .trustitem{min-height:190px}
      .google-proof-card{grid-template-columns:auto 1fr}.google-proof .btn{grid-column:1/-1;width:100%}
    }
    @media(max-width:620px){
      .trustgrid{grid-template-columns:1fr}.trustitem{min-height:170px;padding:20px}.trustitem:nth-child(even){border-left:0}.trustitem:nth-child(n+2){border-top:1px solid var(--line)}
      .trust-visual{height:78px}.trust-brand .trust-visual img{max-width:230px;max-height:78px}.trust-cert .trust-visual{height:84px}.trust-cert .trust-visual img{max-width:235px;max-height:84px}
      .trust-map-visual{height:82px}.trust-map-visual svg{width:110px;height:80px}
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
          <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 70 42 54 69 67 96 52 128 64 101 84 70 75 41 87 12 70Z" fill="#F7FAFF" stroke="#D6E0F1" stroke-width="2"/>
            <path d="M42 54v31M69 67v8M96 52v31" stroke="#C2D1EA" stroke-width="2"/>
            <path d="m13 69 29-15 27 13 27-15 32 12" stroke="#1738B0" stroke-width="3" stroke-linecap="round"/>
            <path d="m42 85 27-10 32 9" stroke="#2F9D69" stroke-width="4" stroke-linecap="round"/>
            <path d="M76 17c-13.1 0-23.7 10.6-23.7 23.7C52.3 61 76 78 76 78s23.7-17 23.7-37.3C99.7 27.6 89.1 17 76 17Z" fill="#1738B0"/>
            <circle cx="76" cy="41" r="10" fill="white"/>
            <circle cx="76" cy="41" r="5" fill="#2F9D69"/>
          </svg>
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
        <div class="google-rating"><strong>4,5</strong><span class="google-stars" aria-label="4,5 de 5 estrellas">★★★★★</span><span>185 reseñas</span></div>
        <p>Valoración pública del perfil de O.FRE.SER en Google. Podés consultar las opiniones completas directamente en Google Maps.</p>
      </div>
      <a class="btn btn-outline" href="${mapsProfile}" target="_blank" rel="noopener noreferrer">Ver opiniones en Google</a>
    </div></div>`;
    trustbar.insertAdjacentElement('afterend',section);
  }
})();
