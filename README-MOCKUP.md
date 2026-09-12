# O.FRE.SER — Mockup web auditado

Versión de demostración para revisión con proveedor de desarrollo web.

## Estado intencional del mockup
- Todas las páginas usan `noindex,nofollow,noarchive` para evitar competir con ofreser.com.ar.
- `robots.txt` permite rastreo únicamente para que los buscadores puedan leer y respetar el `noindex`.
- Fotografías reales servidas como assets individuales WebP.
- HTML semántico, un H1 por página, metadata Open Graph/Twitter, JSON-LD y breadcrumbs.
- Navegación responsive y accesible, con foco visible, skip link y menú móvil con `aria-expanded`.
- Imágenes bajo el pliegue con `loading=lazy`; imágenes principales con preload/fetchpriority y dimensiones explícitas para reducir CLS.

## Antes de publicar en producción
1. Quitar `noindex,nofollow,noarchive` de todas las páginas.
2. Mantener `robots.txt` rastreable y publicar un `sitemap.xml` real.
3. Migrar a URLs limpias (ej. `/mineria/control-de-plagas/`) y definir redirecciones 301 desde URLs antiguas.
4. Sustituir canonicals del dominio demo por `https://www.ofreser.com.ar/...`.
5. Dar de alta Google Search Console/Bing Webmaster y validar datos estructurados.
6. Confirmar autorización de uso de logos de clientes y testimonios.
7. Implementar analytics/consentimiento según la política definida por la empresa.
8. Ejecutar Lighthouse/Core Web Vitals en la infraestructura final y ajustar caché, compresión, CDN, `srcset` y AVIF cuando corresponda.
9. Mantener cada guía de plagas con bibliografía y revisión técnica antes de indexarla.
10. Crear imagen social dedicada 1200×630 para Open Graph/Twitter en producción.
