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

Consulta la pantalla **Preferencias → Acerca de FaroCapital** y el archivo `LICENSE` incluido con las fuentes.
