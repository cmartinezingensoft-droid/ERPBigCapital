# Cierre Fase 6 — Consola operativa VERI*FACTU

Fecha de cierre: 2026-08-29
Base: `FaroCapital-Fases-1-5-FINAL-20260829.zip`

## Objetivo

Convertir la infraestructura VERI*FACTU incorporada en fases anteriores en una función operable desde la aplicación, manteniendo la inmutabilidad del registro fiscal y separando claramente los errores fiscales de los errores técnicos de transporte.

## Implementado

### 1. Consola global VERI*FACTU

Se incorpora la ruta `/verifactu` y una pantalla de seguimiento con:

- estadísticas de registros totales, aceptados, pendientes, rechazados y fallos técnicos;
- filtros por estado AEAT, evento, estado de cola, fechas y búsqueda;
- paginación;
- visualización de factura, evento, versión, tipo AEAT, importes, CSV, hash y hash anterior;
- detalle del snapshot JSON, XML enviado, respuesta AEAT y respuesta de conciliación;
- acceso a configuración fiscal;
- procesamiento manual de la cola.

### 2. Estado VERI*FACTU dentro de la factura

El detalle de factura incorpora una pestaña VERI*FACTU con:

- último estado AEAT;
- estado de la cola;
- CSV;
- intentos totales;
- historial de registros encadenados;
- consulta/reconciliación con AEAT;
- reintento técnico cuando corresponde;
- creación de subsanación para registros rechazados;
- creación de anulación para registros aceptados;
- acceso directo a la consola global.

### 3. Configuración por empresa

Se incorpora `Preferencias > VERI*FACTU` con:

- activación/desactivación por empresa;
- entorno de pruebas/producción;
- indicador de empresa bajo SII;
- datos del productor del sistema;
- identificador, versión e instalación del sistema;
- estado del certificado PKCS#12;
- comprobación de que el fichero de certificado existe en el servidor;
- validación de PKCS#12 y contraseña.

La contraseña del certificado no se almacena en la base de datos del tenant. Se mantiene en el entorno del servidor mediante `VERIFACTU_CERTIFICATE_PASSPHRASE`. La ruta puede configurarse en servidor y tiene prioridad sobre la configuración de empresa.

### 4. Exclusión SII / VERI*FACTU

Se introduce un bloqueo operativo para evitar que una empresa marcada como SII active envíos VERI*FACTU. La habilitación efectiva requiere simultáneamente:

- interruptor maestro del servidor activo;
- VERI*FACTU activo para la empresa;
- SII desactivado.

### 5. F1 y F2

Las facturas de venta incorporan `aeatInvoiceType` con los valores:

- `F1`: factura completa;
- `F2`: factura simplificada.

El valor se persiste en `sales_invoices.aeat_invoice_type` y forma parte del snapshot fiscal inmutable. En F2 el generador no exige destinatario fiscal para generar el registro, mientras F1 conserva las validaciones de identificación del destinatario.

### 6. Reintentos auditables

La cola conserva dos niveles de seguimiento:

- `attempts`: intentos del ciclo actual;
- `total_attempts`: contador acumulado que no se reinicia.

También se incorporan:

- `manual_retry_count`;
- `last_manual_retry_at`.

Un reintento manual devuelve el registro técnico a la cola, pero no modifica el snapshot fiscal ni elimina el historial de intentos.

### 7. Separación error fiscal / error técnico

- Un error técnico puede reintentarse sin recrear el registro fiscal.
- Un registro `Incorrecto` no se reenvía como si fuera un fallo de red: requiere un nuevo registro encadenado de subsanación.
- Un registro aceptado no puede reintentarse.
- La anulación crea un nuevo registro encadenado y no modifica el alta previa.

## Migraciones

La Fase 6 añade exactamente estas migraciones:

1. `20260829120000_verifactu_invoice_type_phase6.ts`
   - añade `sales_invoices.aeat_invoice_type`;
   - valor por defecto `F1`.

2. `20260829121000_verifactu_console_phase6.ts`
   - añade `verifactu_dispatch.total_attempts`;
   - añade `verifactu_dispatch.manual_retry_count`;
   - añade `verifactu_dispatch.last_manual_retry_at`;
   - inicializa `total_attempts` desde los intentos preexistentes.

## API añadida/ampliada

- `GET /api/verifactu/config`
- `PUT /api/verifactu/config`
- `POST /api/verifactu/config/validate-certificate`
- `GET /api/verifactu/stats`
- `GET /api/verifactu/console`
- `GET /api/verifactu/records`
- `GET /api/verifactu/records/:id`
- `POST /api/verifactu/records/:id/retry`
- `POST /api/verifactu/dispatch`
- `POST /api/verifactu/invoices/:id/reconcile`
- `POST /api/verifactu/invoices/:id/subsanacion`
- `POST /api/verifactu/invoices/:id/anulacion`

## Validaciones realizadas para el cierre

Se ha comparado el árbol de Fase 6 contra la Fase 5 cerrada.

Resultado:

- 35 ficheros TypeScript/TSX modificados o añadidos;
- 0 errores sintácticos detectados mediante TypeScript `transpileModule`;
- 0 imports locales o alias internos sin resolver en los ficheros modificados;
- rutas de consola y preferencias conectadas;
- migraciones Fase 6 con sellos únicos entre sí;
- ausencia de artefactos temporales de compilación en el paquete final.

## Limitación de validación del entorno

El paquete fuente no contiene `node_modules`. El entorno disponible durante el cierre usa Node `v22.16.0`, mientras el proyecto declara `16.x || 17.x || 18.x`, y no se dispone de una instalación de dependencias reproducible en este entorno.

Por ese motivo no se certifican aquí:

- `pnpm typecheck` completo del monorepo;
- `pnpm build` completo;
- tests E2E con servicios reales;
- conexión real a AEAT con certificado del cliente.

Antes de producción se debe ejecutar con Node 18 y dependencias bloqueadas por `pnpm-lock.yaml`:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm tenants:migrate:latest
```

Después deben probarse, en entorno AEAT de pruebas, al menos:

1. alta F1;
2. alta F2;
3. aceptación con CSV;
4. rechazo fiscal y subsanación;
5. fallo técnico y reintento;
6. consulta/reconciliación;
7. anulación;
8. reinicio de servidor con registros pendientes en outbox;
9. bloqueo por SII;
10. certificado inexistente, contraseña incorrecta y certificado válido.

## Decisión de alcance

Las notas de crédito/facturas rectificativas de la Fase 5 continúan funcionando comercial y contablemente, pero no se conectan todavía a un envío VERI*FACTU R1-R5 parcial. Se ha preferido no introducir un circuito fiscal incompleto. La futura fase de rectificativas VERI*FACTU deberá implementar de forma conjunta la clasificación R1-R5, referencia a las facturas rectificadas y reglas XML correspondientes.

## Estado de cierre

**FASE 6 CERRADA A NIVEL DE FUENTES Y EMPAQUETADO.**

La puesta en producción queda condicionada a las validaciones de build, migración y E2E descritas anteriormente en un entorno compatible con Node 18 y con credenciales/certificado reales o de pruebas.
