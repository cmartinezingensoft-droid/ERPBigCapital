# FaroCapital — Cierre Fase 5 (España)

Fecha de cierre: 2026-08-29

## Objetivo

Cerrar el circuito fiscal español de extremo a extremo partiendo de las Fases 1–4, extendiendo el motor fiscal compartido a compras, gastos y rectificativas, mejorando la contabilización española y dejando una primera salida para libros de IVA y preliquidación de control del Modelo 303.

## Cambios realizados

### 1. Compras / Bills
- Persistencia de `equivalence_surcharge_amount` y `retention_amount`.
- Cálculo mediante el motor fiscal español compartido.
- Contabilización de IVA soportado en PGC 472.
- Contabilización de retenciones practicadas en PGC 4751.
- Tratamiento del recargo de equivalencia soportado como mayor coste/no deducible.
- Descuentos y ajustes globales repartidos por línea para conservar la base fiscal por tipo.

### 2. Abonos de venta / Credit Notes
- Conversión funcional a factura rectificativa española.
- Campos de trazabilidad: `original_sale_invoice_id`, `rectification_reason` y `rectification_method`.
- IVA, recargo y retención calculados con el mismo motor que las facturas de venta.
- Contabilización inversa de IVA repercutido y retenciones soportadas.
- Saldo disponible calculado sobre el total fiscal real de la rectificativa.
- PDF de rectificativa ampliado con información fiscal y referencia a la factura original.

### 3. Abonos de proveedor / Vendor Credits
- IVA soportado, recargo y retenciones con snapshot fiscal por línea.
- Asiento inverso coherente con Bills.
- Saldo disponible calculado sobre el total fiscal completo.

### 4. Gastos
- Cada categoría/línea de gasto puede seleccionar un tipo fiscal español mediante `tax_rate_id`.
- Snapshot de tipo de IVA, régimen, recargo y retención.
- Persistencia de IVA, recargo y retención por línea y total del gasto.
- Contabilización: base/gasto, IVA soportado 472, recargo no deducible y retención 4751.

### 5. Cuentas PGC auxiliares
- Garantizado el acceso/creación de PGC 472 (IVA soportado).
- Garantizado el acceso/creación de PGC 4751 (retenciones practicadas).

### 6. Informes fiscales
Se incorpora `SpainFiscalReports` con endpoints protegidos por el permiso existente de informe de impuestos:

- `GET /spain/fiscal/vat-books`
  - Libro de IVA emitido: facturas de venta y rectificativas.
  - Libro de IVA recibido: Bills, Vendor Credits y gastos publicados.
  - Bases, cuotas, recargo y retenciones por línea/tipo.
  - Filtros `fromDate` y `toDate`.

- `GET /spain/fiscal/model-303-preview`
  - Preliquidación de control del Modelo 303.
  - Desglose por tipos.
  - IVA devengado, recargo, IVA soportado deducible y diferencia.
  - Separación de bases exentas, no sujetas e inversión del sujeto pasivo.
  - Se marca expresamente como PREVIEW: no sustituye la declaración oficial y no aplica por sí sola prorrata, importaciones, adquisiciones intracomunitarias, sectores diferenciados ni regularizaciones.

### 7. Informes genéricos de impuestos
- Corregido el informe `SalesTaxLiabilitySummary` para que aplique realmente `fromDate` / `toDate` a las transacciones contables consultadas.

### 8. PDF e identificación fiscal
- Incorporación de `fiscalNumber` en el formato de dirección fiscal de organización/contraparte cuando existe.
- Plantilla de Credit Note ampliada con datos de rectificación y desglose fiscal.

## Migración de base de datos

Nueva migración:

`packages/server/src/database/tenant/migrations/20260829110000_spanish_fiscal_phase5.ts`

Añade:
- Totales fiscales a `bills`, `credit_notes` y `vendor_credits`.
- Totales fiscales a `expenses_transactions`.
- Campos fiscales por línea a `expense_transaction_categories`.
- Metadatos de rectificación a `credit_notes`.
- Cuentas PGC 472 y 4751 si no existen.

## Validaciones ejecutadas

1. Comparación estructural Fase 4 → Fase 5: 55 ficheros TypeScript/TSX modificados o añadidos.
2. Parser TypeScript 5.8.3 sobre los 55 ficheros: **0 errores sintácticos**.
3. Comprobación de imports locales/alias de esos ficheros: **0 rutas locales inexistentes**.
4. Tests dirigidos del motor fiscal compartido:
   - IVA 21 %.
   - Recargo de equivalencia 5,2 %.
   - Retención 15 %.
   - Precio con IVA incluido.
   - Descuento global repartido entre tipos 21 % y 10 %.
   - Inversión del sujeto pasivo.
   Resultado: **OK**.
5. Integridad del ZIP final: se valida después del empaquetado mediante `unzip -t` y SHA-256.

## Limitación de validación del entorno

El paquete fuente original no incluye `node_modules`. El entorno de cierre dispone de Node 22, mientras el monorepo declara Node 16/17/18, y no se ha realizado una instalación de dependencias desde Internet. Por ello no se certifica en este cierre un `pnpm build` completo ni la suite E2E. La Fase 5 queda cerrada a nivel de código, migración y validaciones estáticas/dirigidas; el pipeline de implantación debe ejecutar con Node 18:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
pnpm test:e2e
pnpm tenants:migrate:latest
```

## Siguiente fase recomendada

Fase 6: consola operativa VERI*FACTU en interfaz (configuración AEAT, certificados, estado de envíos, CSV, errores, reintentos, subsanación/anulación, tipos F1/F2/rectificativas y exclusión SII/VERI*FACTU).
