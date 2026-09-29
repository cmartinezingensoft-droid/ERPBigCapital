# FaroCapital — Cierre consolidado Fases 1–4

Fecha de cierre: 2026-08-29

## Estado

Las fases 1, 2, 3 y 4 quedan integradas en este árbol de fuentes.

## Fase 1 — Saneamiento técnico y coherencia funcional

- Retiradas de navegación las pantallas/rutas del módulo `Projects` que no disponían de API backend funcional.
- Mantenida compatibilidad interna con referencias históricas `projectId` para no romper datos existentes.
- Revisión de integridad de imports respecto al proyecto original: las modificaciones no introducen nuevas referencias relativas sin resolver.
- Endurecimientos transaccionales y de consistencia necesarios para las fases fiscales posteriores.

## Fase 2 — Despliegue reproducible y seguro

- Eliminado el uso de Watchtower en producción.
- Eliminadas imágenes Docker `:latest` en la configuración de despliegue modificada.
- Corregida la publicación de un 443 no servido por la aplicación.
- Migraciones ejecutables con una imagen coherente con el servidor.
- Plantillas `.env.example` revisadas para evitar secretos inseguros por defecto.

## Fase 3 — Fiscalidad española

- Perfil fiscal español para clientes y proveedores: NIF/CIF/NIE, país fiscal, régimen y datos AEAT.
- Validación y normalización de identificadores fiscales españoles.
- Tipos IVA 21 %, 10 %, 4 % y 0 %.
- Tipos específicos para Recargo de Equivalencia, sin activarlo por defecto en los tipos IVA ordinarios.
- IRPF, exentas, no sujetas e inversión del sujeto pasivo.
- Instantánea fiscal persistida por línea para conservar la interpretación fiscal histórica.
- Motor fiscal compartido entre backend/frontend/VERI*FACTU.
- Orden de cálculo unificado: cantidad × precio → descuento de línea → descuento global asignado → base → IVA → RE → IRPF.
- Distribución proporcional del descuento global entre líneas/bases.
- Corregido cálculo de IVA incluido/excluido.
- Ajustados desglose de impuestos, PDF y contabilización para partir de la misma base fiscal.

Migración principal:

- `packages/server/src/database/tenant/migrations/20260829090000_spanish_fiscal_profile.ts`

## Fase 4 — VERI*FACTU

- Registro de alta VERI*FACTU.
- Subsanación mediante nuevo registro encadenado, sin mutar el registro fiscal anterior.
- Anulación encadenada.
- Reintento de anulación rechazada con `RechazoPrevio=S`.
- Huella SHA-256 y encadenamiento fiscal.
- Generación XML AEAT.
- Validación contra esquemas XSD de los casos implementados.
- Outbox persistente en base de datos para desacoplar emisión fiscal y disponibilidad de Redis.
- Recuperación/reencolado tras caída de Redis.
- Estados de envío, CSV, respuesta AEAT, errores SOAP y control de `TiempoEsperaEnvio`.
- Consulta/reconciliación de registros presentados.
- Soporte de certificado PFX.
- QR VERI*FACTU generado localmente, sin servicios web de terceros.
- Leyenda VERI*FACTU en factura/PDF.
- Plantilla de declaración responsable del SIF.
- SDK/OpenAPI y formularios fiscales propagados.

Migración principal:

- `packages/server/src/database/tenant/migrations/20260829100000_verifactu.ts`

Documentación relacionada:

- `docs/compliance/DECLARACION_RESPONSABLE_SIF_TEMPLATE.md`
- `docs/reference-verifactu/README.md`
- `docs/third-party/QRCode-for-JavaScript-MIT.txt`

## Validaciones efectuadas durante el cierre

- Análisis sintáctico de 5.583 ficheros TypeScript/TSX: sin errores de sintaxis detectados.
- Typecheck aislado del SDK generado.
- JSON estrictos validados.
- JSONC de configuración tratado como JSONC, no como JSON estricto.
- YAML de configuración validado.
- Scripts shell revisados sintácticamente.
- Escaneo de despliegue: sin Watchtower, sin `:latest` en la configuración modificada y sin publicación del 443 inexistente.
- Casos fiscales probados: IVA incluido/excluido, 21/10/4, descuentos de línea/globales, multibase, RE, IRPF, exentas e inversión del sujeto pasivo.
- Comprobación de equilibrio de asiento en escenario fiscal complejo.
- Validación de DNI/NIE/CIF y rechazo de checksums incorrectos.
- XML representativos de alta, subsanación, anulación con rechazo previo y consulta validados contra XSD AEAT utilizados en la implementación.
- QR generado localmente, rasterizado y decodificado; la URL decodificada coincide con la URL AEAT original.

## Baseline heredado

El proyecto original contiene referencias relativas que un análisis estático simple no puede resolver. La comparación antes/después mostró el mismo conjunto de 54 referencias; las fases 1–4 no añaden nuevas incidencias de este tipo.

## Limitación de validación del entorno

No se ejecutó `pnpm build`/suite completa del monorepo porque el entorno de trabajo no disponía de `node_modules` y el acceso al registro npm falló durante la sesión. Esta limitación no se oculta ni se presenta como build superado.

Al desplegar en un entorno con acceso a dependencias, la comprobación recomendada es:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

Después deben aplicarse las migraciones tenant antes de utilizar las funciones fiscales nuevas.

## Cierre

El paquete entregado corresponde al árbol fuente consolidado con las Fases 1–4 implementadas. La adaptación VERI*FACTU debe configurarse con certificado y datos reales del productor/obligado tributario antes de su uso efectivo en producción.
