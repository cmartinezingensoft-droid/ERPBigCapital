# FaroCapital

FaroCapital es un ERP de código abierto adaptado para empresas españolas, con módulos de contabilidad, ventas, compras, inventario y funcionalidades fiscales incorporadas en las fases de adaptación del proyecto.

## Puesta en marcha

1. Copia `.env.example` a `.env` y revisa las credenciales y parámetros de despliegue.
2. Instala las dependencias con `pnpm install`.
3. Para desarrollo, inicia la infraestructura local con Docker y usa los scripts de `package.json`.
4. Para producción, construye imágenes propias de `packages/server` y `packages/webapp` y configura `FAROCAPITAL_SERVER_IMAGE` y `FAROCAPITAL_WEBAPP_IMAGE`.

## Idioma y marca

La interfaz está configurada por defecto en castellano. La identidad visual utiliza el logotipo FaroCapital y el naranja `#F37121` como color primario.

## Licencia

FaroCapital es una obra modificada basada en Bigcapital:

- Proyecto original: https://github.com/bigcapitalhq/bigcapital
- Licencia del proyecto original: GNU Affero General Public License v3 (AGPLv3)
- Licencia de esta distribución: GNU Affero General Public License v3 o, cuando el titular correspondiente lo permita, cualquier versión posterior

El texto completo de la licencia se incluye en `LICENSE`. Los avisos de origen, cambios y atribución se incluyen en `NOTICE`.

Si ejecutas una versión modificada de FaroCapital para usuarios a través de una red, la AGPL exige ofrecer a esos usuarios el código fuente correspondiente de la versión que están usando, sin coste, mediante un medio estándar o habitual.
