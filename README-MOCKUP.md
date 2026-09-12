# O.FRE.SER — Mockup web auditado

Versión de demostración para revisión con proveedor de desarrollo web.

## Estado intencional del mockup
- `noindex,nofollow,noarchive` y `robots.txt` bloqueado para evitar competir con ofreser.com.ar.
- Fotografías reales servidas como assets individuales WebP.
- HTML semántico, un H1 por página, metadata Open Graph/Twitter, JSON-LD y breadcrumbs.
- Navegación responsive y accesible, con foco visible y menú móvil con `aria-expanded`.
- Imágenes bajo el pliegue con `loading=lazy`; imagen principal con preload/fetchpriority.

## Antes de publicar en producción
1. Quitar `noindex,nofollow,noarchive` y habilitar robots.
2. Migrar a URLs limpias (ej. `/mineria/control-de-plagas/`) y definir redirecciones 301 desde URLs antiguas.
3. Generar `sitemap.xml` real y dar de alta Google Search Console/Bing Webmaster.
4. Sustituir canonicals del dominio demo por `https://www.ofreser.com.ar/...`.
5. Confirmar autorización de uso de logos de clientes y testimonios.
6. Implementar analytics/consentimiento según la política definida por la empresa.
7. Ejecutar Lighthouse/Core Web Vitals en la infraestructura final y ajustar caché/compresión/CDN.
8. Mantener cada guía de plagas con bibliografía y revisión técnica antes de indexarla.
