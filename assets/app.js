/* O.FRE.SER — loader estable. Mantiene la lógica existente y carga mejoras visuales separadas. */
(function(){
  'use strict';
  const core=document.createElement('script');
  core.src='assets/app-core.js?v=20260914a';
  core.onload=()=>{
    const upgrades=document.createElement('script');
    upgrades.src='assets/home-upgrades.js?v=20260914a';
    document.head.appendChild(upgrades);
  };
  document.head.appendChild(core);
})();
