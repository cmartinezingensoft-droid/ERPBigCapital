# Cierre Fase 9 — PGC, SEPA y fiscalidad territorial España

Fecha: 2026-08-29
Paquete base: FaroCapital Fases 1–8

## Objetivo

Cerrar la capa financiera española del ERP sobre tres ejes: estructura contable PGC/PGC-PYMES, operativa bancaria SEPA y separación fiscal territorial IVA/IGIC/IPSI.

## 1. PGC / PGC-PYMES

Se incorpora el módulo `SpainFinance` con:

- Configuración por empresa entre `PGC-PYMES` y `PGC`.
- Catálogo operativo de cuentas españolas de uso habitual en los circuitos actualmente implementados por FaroCapital.
- Reutilización y mapeo de cuentas existentes por código, sin crear duplicados deliberadamente.
- Las subcuentas (p. ej. 4300001/5720002) heredan la clasificación de la cuenta PGC por prefijo más largo.
- Diagnóstico de cuentas sin mapear, códigos no numéricos y códigos duplicados.
- Inicialización controlada de las cuentas operativas ausentes.
- Balance de situación por fecha.
- Cuenta de pérdidas y ganancias por período.
- Balance de sumas y saldos por período, con saldo inicial, movimientos y saldo final.
- Incorporación provisional del resultado corriente al patrimonio neto del balance mientras no exista el asiento de regularización/cierre en 129.

El catálogo incluido es un catálogo operativo para los procesos de FaroCapital, no pretende sustituir por sí solo el cuadro completo y la parametrización de una asesoría para sectores con cuentas especiales.

## 2. SEPA

Se incorpora gestión bancaria SEPA por cuenta contable bancaria:

- IBAN con validación MOD-97.
- BIC/SWIFT con validación formal.
- Titular, banco y país.
- Identificador de acreedor SEPA con validación formal antes de permitir SDD.
- Activación expresa de la cuenta para remesas.

### SCT

Generación de transferencias SEPA mediante ISO 20022:

- `pain.001.001.09`.
- `ChrgBr=SLEV` y nivel de servicio `SEPA`.
- Message ID único.
- fecha solicitada de ejecución.
- múltiples operaciones por remesa en el modelo de servidor.
- EndToEndId.
- información de remesa.
- suma de control y número de transacciones.

### SDD CORE / B2B

Se incorpora:

- mandatos por cliente.
- referencia única de mandato.
- fecha de firma.
- esquema CORE o B2B.
- estados activo/suspendido/cancelado.
- secuencias FRST/RCUR/OOFF/FNAL.
- última fecha de cobro para inferir FRST/RCUR.
- generación `pain.008.001.08`.
- identificador de acreedor obligatorio para SDD.

### Inmutabilidad y auditoría

Las remesas pasan por `draft -> generated -> exported`.

Al generar:

- se conserva el XML.
- se calcula SHA-256.
- una remesa generada/exportada no se regenera silenciosamente.
- al marcar un SDD como exportado se actualiza la última fecha de cobro de sus mandatos.

La aplicación queda preparada para direcciones estructuradas/híbridas. La fecha de corte incluida en configuración es `2026-11-15`, a partir de la cual el EPC deja de admitir direcciones no estructuradas en los mensajes afectados.

## 3. Territorios fiscales especiales

Se añade `fiscal_territory` a terceros:

- `common`: Península/Baleares — IVA.
- `canary`: Canarias — IGIC.
- `ceuta`: Ceuta — IPSI.
- `melilla`: Melilla — IPSI.

Se añade `tax_territory` a maestros y snapshots fiscales de líneas:

- `iva`
- `igic`
- `ipsi`

Esto impide que un cambio posterior del maestro altere la naturaleza territorial histórica de una línea ya grabada.

### IGIC

Se crean maestros diferenciados para 0 %, 1 %, 3 %, 5 %, 7 %, 9,5 %, 15 %, 20 % y exento. La selección sigue dependiendo de la naturaleza concreta del bien/servicio y de la normativa aplicable. Los maestros IGIC se etiquetan con código fiscal `03`, no como IVA.

### IPSI

Se crea únicamente un maestro `IPSI configurable`, inactivo y al 0 %. No se impone un porcentaje genérico porque el tipo depende del territorio y de la operación y debe parametrizarse conforme a la ordenanza/normativa aplicable. El maestro IPSI usa código fiscal `02` y no fuerza una clave de régimen de IVA/IGIC.

### Separación de IVA estatal

- Los libros avanzados conservan el territorio fiscal de la línea.
- Modelo 303/349/369 sólo consumen territorio `iva`.
- SII AEAT de IVA excluye automáticamente líneas IGIC/IPSI.
- La pantalla territorial permite revisar maestros y distribución de terceros por territorio.

## 4. Interfaz

Nueva ruta:

`/spain-finance`

Nuevo menú:

`Contabilidad -> Finanzas España · PGC / SEPA`

Pestañas:

1. Contabilidad PGC.
2. SEPA y remesas.
3. Canarias / Ceuta / Melilla.

Los formularios de cliente y proveedor incorporan el territorio fiscal. El maestro de tipos impositivos incorpora el territorio IVA/IGIC/IPSI.

## 5. API

Base:

`/api/spain/finance`

Principales endpoints:

- `GET/PUT /config`
- `GET /pgc/catalog`
- `POST /pgc/initialize`
- `GET /pgc/diagnostics`
- `GET /pgc/balance-sheet`
- `GET /pgc/profit-loss`
- `GET /pgc/trial-balance`
- `GET/PUT /bank-accounts`
- `GET/PUT /contacts/.../sepa`
- `GET /sepa/validate`
- `GET/POST/PUT /sepa/mandates`
- `GET/POST /sepa/remittances`
- `POST /sepa/remittances/:id/generate`
- `POST /sepa/remittances/:id/exported`
- `GET /territory`

Se añade SDK compartido y hooks React Query para estos servicios.

## 6. Migración

`20260829150000_spain_finance_phase9.ts`

Crea/amplía:

- metadatos PGC y SEPA en `accounts`.
- territorio y datos SEPA en `contacts`.
- territorio en `tax_rates`.
- snapshot territorial en `items_entries`.
- territorio en categorías fiscales de gastos.
- `spain_pgc_catalog`.
- `sepa_mandates`.
- `sepa_remittances`.
- `sepa_remittance_entries`.

## 7. Validaciones de cierre realizadas

- Comparación completa contra el ZIP de Fase 8.
- Comprobación sintáctica TypeScript/TSX mediante TypeScript 5.8.3 sobre **44 archivos TS/TSX** modificados/nuevos: 0 errores.
- Resolución de imports relativos y alias internos de los archivos afectados: 0 imports rotos.
- Verificación de prefijos únicos de las migraciones del 2026-08-29.
- Prueba dirigida de IBAN español válido/inválido.
- Prueba dirigida de BIC válido/inválido.
- Generación SCT de prueba y parse XML, incluyendo `ChrgBr=SLEV` y escape de caracteres XML.
- Generación SDD CORE de prueba y parse XML, incluyendo identificador de acreedor, mandato y `ChrgBr=SLEV`.
- Comprobación de namespaces `pain.001.001.09` y `pain.008.001.08`.
- Comprobación SHA-256.
- Prueba de rechazo de SDD sin mandato.
- Validación formal del identificador de acreedor SEPA.
- Comprobación de mapeo fiscal territorial AEAT: IGIC=`03`, IPSI=`02`.
- Comparación contra Fase 8: 0 archivos eliminados accidentalmente.
- Búsqueda de TODO/FIXME en el módulo nuevo.

## 8. Referencias normativas/técnicas contrastadas

- Real Decreto 1515/2007, PGC de Pequeñas y Medianas Empresas, texto consolidado BOE.
- European Payments Council, 2025 SCT Rulebook v1.1 e Implementation Guidelines Customer-to-PSP.
- European Payments Council, 2025 SDD Core Rulebook v1.1 e Implementation Guidelines Customer-to-PSP.
- Agencia Tributaria Canaria, información de tipos IGIC vigente en 2026.

## 9. Limitaciones deliberadas

- No se transmite una remesa directamente a una entidad bancaria: se genera el fichero SEPA para su banca electrónica/conector bancario posterior.
- No se considera que el catálogo operativo incluido sustituya el diseño contable específico de una empresa/sector por su asesoría.
- No se implementa en esta fase SII-IGIC canario; el SII existente es el SII estatal de IVA y excluye IGIC/IPSI.
- IPSI debe parametrizarse según operación y territorio; no se fuerza un tipo genérico.
- La generación usa direcciones estructuradas mínimas por país; antes del 15/11/2026 conviene completar todos los campos postales estructurados requeridos por cada banco/PSP y validar contra su implementación concreta.

## 10. Despliegue recomendado

1. Node 18.
2. Instalar dependencias exactamente desde `pnpm-lock.yaml`.
3. `pnpm typecheck`.
4. `pnpm build`.
5. Ejecutar tests Jest/E2E.
6. Copia de seguridad de base de datos.
7. Aplicar migraciones tenant hasta `20260829150000_spain_finance_phase9.ts`.
8. Abrir `Finanzas España` y ejecutar diagnóstico PGC antes de inicializar cuentas.
9. Revisar cuentas bancarias, IBAN/BIC e identificador de acreedor.
10. Generar SCT/SDD de prueba y validarlo/importarlo en el portal de pruebas de la entidad bancaria antes de producción.
11. Revisar territorio fiscal de empresa, clientes, proveedores y maestros de impuesto.

## Estado

**FASE 9 CERRADA a nivel de fuentes y validación estática/dirigida.**

La certificación de producción exige el build completo del monorepo y pruebas con la entidad bancaria/asesoría y bases de datos reales.
