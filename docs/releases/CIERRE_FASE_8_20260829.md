# Cierre Fase 8 — Fiscalidad avanzada España

Fecha de cierre: 29/08/2026

## Objetivo

Cerrar la capa de fiscalidad avanzada española sobre las Fases 1–7, manteniendo una única clasificación fiscal para libros de IVA, preliquidaciones informativas y SII, sin mezclar los cálculos de control con la presentación telemática definitiva de modelos tributarios.

## Alcance implementado

### Centro Fiscalidad España

- Nueva área de trabajo para fiscalidad avanzada española.
- Configuración de RECC, OSS Unión, OSS no Unión e IOSS.
- Clasificación común de operaciones:
  - nacional;
  - entrega intracomunitaria de bienes;
  - adquisición intracomunitaria de bienes;
  - prestación intracomunitaria de servicios;
  - adquisición intracomunitaria de servicios;
  - exportación;
  - importación;
  - inversión del sujeto pasivo nacional;
  - OSS;
  - IOSS.
- La clasificación se persiste también en las líneas documentales para que los informes no dependan de reinterpretar el tipo de IVA posteriormente.

### Libros y preliquidaciones

- Libro de IVA emitido ampliado.
- Libro de IVA recibido ampliado.
- Preliquidación de control del Modelo 303 con separación de IVA interior, operaciones autorrepercutidas, importaciones y operaciones exteriores.
- Predeclaración del Modelo 349 con claves E/A/S/I y control de evidencia VIES.
- Predeclaración del Modelo 347 por tercero y trimestre, aplicando el umbral de 3.005,06 euros y exclusión de la empresa cuando corresponda por SII.
- Preliquidación del Modelo 369 para operaciones OSS/IOSS agrupadas por país y tipo.
- RECC aplicado a las preliquidaciones en función del cobro/pago registrado.

Estas salidas son herramientas de conciliación y preparación. No sustituyen la presentación telemática oficial ni las validaciones finales del formulario de AEAT.

### VIES

- Estado VIES en contactos.
- Fecha de comprobación, país y NIF-IVA comprobado.
- Servicio para registrar evidencia de la comprobación utilizada por los informes intracomunitarios.

### RECC y medios de cobro/pago

- Persistencia en cobros y pagos de los códigos AEAT:
  - 01 Transferencia;
  - 02 Cheque;
  - 03 No cobrado/pagado;
  - 04 Otros medios;
  - 05 Domiciliación bancaria.
- Referencia bancaria/medio asociada al movimiento.
- Formularios de cobros y pagos adaptados para capturar estos datos.

### SII 1.1

- Módulo SII opcional por empresa.
- Exclusión operativa SII / VERI*FACTU.
- Generación de registros de facturas emitidas y recibidas.
- Generación de cobros y pagos RECC.
- Consola SII con estados, búsqueda y detalle.
- XML y payload JSON persistidos por registro.
- SHA-256 del XML generado.
- Inmutabilidad del XML desde el primer intento de transporte.
- Envío HTTPS con certificado PFX/P12 configurado en servidor.
- Respuesta XML, CSV, código y texto de error almacenados.
- Estados: generated, submitting, submitted, accepted, accepted_with_errors, rejected y failed.
- Reintento usando exactamente el mismo XML previamente generado.
- Endpoints independientes para emitidas, recibidas, cobros y pagos.

## Corrección final de conformidad SII

Durante el cierre se contrastó el generador con los XSD oficiales vigentes de SII 1.1 publicados por AEAT y se corrigieron varios puntos estructurales antes de empaquetar:

- Uso de los namespaces estables oficiales `/aeat/ssii/fact/ws/...`; las rutas `ssii_1_1` / `ssii_1_1_bis` son ubicaciones de los esquemas y no el `targetNamespace`.
- Facturas recibidas usan `CuotaSoportada`, `FechaRegContable` y `CuotaDeducible`.
- La inversión del sujeto pasivo nacional se separa en `InversionSujetoPasivo`.
- Adquisiciones intracomunitarias no se clasifican automáticamente como inversión del sujeto pasivo nacional.
- En operaciones no sujetas se diferencia N1 de N2 en el campo XML correspondiente.
- Cobros RECC utilizan `RegistroLRCobros` y `sii:Cobro`.
- Pagos RECC utilizan `RegistroLRPagos` y `sii:Pago`.
- Los suministros de cobros/pagos no incluyen `PeriodoLiquidacion` ni `TipoComunicacion`, coherente con `SuministroInformacionCobrosPagos`.
- Los pagos de facturas recibidas incorporan la identificación del proveedor exigida por el tipo de identificación de factura recibida.
- `ImporteTotal` SII no se reduce por retenciones, ya que éstas no forman parte del IVA objeto del SII.

Se añadió `SiiXml.spec.ts` como prueba de regresión estructural.

## Migración

`packages/server/src/database/tenant/migrations/20260829140000_spain_advanced_fiscal_phase8.ts`

Añade, entre otros:

- `spanish_operation_type` y `oss_scheme` en tipos de IVA y líneas;
- evidencia VIES en contactos;
- medio/referencia AEAT en cobros y pagos;
- tabla `sii_records`;
- plantillas fiscales avanzadas españolas.

Las plantillas de importación genérica y OSS/IOSS con tipo destino no definido se crean inactivas para impedir su uso accidental con IVA 0 %.

## Configuración de servidor SII

Variables incorporadas a `.env.example`:

- `SII_CERTIFICATE_PATH`
- `SII_CERTIFICATE_PASSPHRASE`
- `SII_ENDPOINT_ISSUED`
- `SII_ENDPOINT_RECEIVED`
- `SII_ENDPOINT_ISSUED_PAYMENT`
- `SII_ENDPOINT_RECEIVED_PAYMENT`

Los endpoints se dejan expresamente configurables. Antes de producción deben obtenerse de los WSDL vigentes de AEAT correspondientes al entorno que se vaya a utilizar.

## Validaciones de cierre

- Documento histórico de Fase 7 restaurado desde el paquete final de Fase 7.
- Test `ElectronicInvoiceXml.spec.ts` de Fase 7 restaurado.
- Directorio temporal `packages/server/dist` eliminado.
- 54 ficheros TS/TSX modificados o añadidos respecto de Fase 7 tras añadir la prueba SII final.
- 0 errores sintácticos en esos ficheros mediante TypeScript 5.8.3 `transpileModule`.
- 0 imports locales o alias `@/` rotos en los ficheros afectados.
- 4 XML de prueba (emitida, recibida, cobro RECC y pago RECC) generados y parseados como XML bien formado.
- Comprobaciones estructurales específicas SII: PASS.
- No quedan `TODO`/`FIXME` introducidos por Fase 8 en los ficheros modificados.

## Validaciones pendientes de entorno

El paquete fuente no contiene `node_modules`. El entorno de cierre dispone de Node 22, mientras el proyecto declara Node 16/17/18, por lo que no se certifica aquí un build completo del monorepo.

Antes de implantación:

1. utilizar Node 18;
2. instalar dependencias desde `pnpm-lock.yaml`;
3. ejecutar `pnpm typecheck`;
4. ejecutar `pnpm build`;
5. ejecutar la suite Jest/E2E;
6. aplicar las migraciones de tenant;
7. validar casos SII reales contra el portal de pruebas externas de AEAT con certificado válido;
8. comprobar que los endpoints configurados corresponden a los WSDL vigentes del entorno de pruebas/producción;
9. conciliar 303/349/347/369 con la asesoría fiscal antes de usar las preliquidaciones como base de presentación.

## Fuera de alcance deliberado

- Presentación telemática automática de Modelos 303, 349, 347 o 369.
- Automatización de altas/bajas censales OSS/IOSS.
- Gestión completa de DUA y casuística aduanera avanzada.
- Todos los libros SII especiales (bienes de inversión, determinadas operaciones intracomunitarias, bienes en consigna, etc.).
- Sustitución del criterio de la asesoría fiscal en reglas específicas de deducibilidad.

La Fase 8 deja preparada la infraestructura para ampliar estos casos sin duplicar la clasificación fiscal de documentos.
