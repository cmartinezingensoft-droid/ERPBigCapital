# Cierre Fase 7 — Facturación electrónica España

Fecha de cierre: 2026-08-29  
Base: `FaroCapital-Fases-1-6-FINAL-20260829.zip`

## Objetivo

Incorporar a FaroCapital una base auditable de facturación electrónica española, separada del flujo VERI*FACTU y preparada para:

- Facturae 3.2.2 / FACe en relaciones con Administraciones Públicas;
- modelo semántico EN16931;
- UBL 2.1 como formato estructurado B2B;
- futura solución pública española de facturación electrónica;
- plataformas privadas B2B;
- registro de estados comerciales y de pago.

La fase evita simular conectores externos todavía no configurables de forma universal. La generación documental, versionado, trazabilidad y preparación del transporte quedan implementados; firma criptográfica y envío automático se mantienen desacoplados.

## Implementado

### 1. Modelo electrónico canónico

Se introduce un modelo interno `ElectronicInvoiceCanonical` basado en conceptos EN16931 y desacoplado de cualquier XML concreto.

Incluye:

- emisor y receptor fiscal;
- NIF/VAT ID;
- domicilio y país;
- fecha de expedición, operación y vencimiento;
- referencias de pedido, contrato, transacción y referencia general;
- líneas con precio neto de impuestos;
- descuentos y cargos;
- categoría fiscal;
- IVA;
- recargo de equivalencia;
- retenciones;
- bases, impuestos y total pagadero.

Antes de almacenar un documento se verifica la coherencia entre:

- suma de líneas y total de líneas;
- base + IVA + recargo de equivalencia - retención y total pagadero.

La tolerancia de control es de 0,02 EUR/unidades monetarias por redondeos.

### 2. Facturae 3.2.2

Se incorpora un generador de Facturae 3.2.2 con:

- `SchemaVersion=3.2.2`;
- modalidad individual;
- identificación fiscal de emisor y receptor;
- persona jurídica/física;
- dirección española o extranjera;
- líneas, cantidades y precio unitario sin impuestos;
- IVA repercutido;
- recargo de equivalencia con tipo y cuota;
- IRPF/retenciones como impuestos retenidos;
- fecha de operación;
- referencias `ReceiverTransactionReference`, `FileReference` y `ReceiverContractReference`;
- vencimiento y medio de pago base;
- DIR3 en `BuyerParty/AdministrativeCentres`.

Los roles DIR3 implementados son:

- `01`: Oficina Contable;
- `02`: Órgano Gestor;
- `03`: Unidad Tramitadora;
- `04`: Órgano Proponente, opcional.

Para el perfil FACe se exige disponer de los roles 01, 02 y 03 antes de generar.

### 3. UBL 2.1 / EN16931

Se incorpora un generador UBL 2.1 con `CustomizationID` EN16931.

Incluye:

- proveedor y cliente;
- `OrderReference`, contrato y referencias adicionales;
- líneas con `AllowanceCharge` a nivel de línea;
- bases e IVA por categoría;
- categorías estándar, exentas, inversión del sujeto pasivo y no sujetas;
- motivo de exención/no sujeción/ISP cuando procede;
- recargo de equivalencia como `TaxTotal` separado con esquema `RE`;
- retención mediante `WithholdingTaxTotal`/esquema IRPF;
- totales legales sin duplicar descuentos o cargos de línea;
- fecha de operación y vencimiento.

El perfil `b2b-public` se identifica expresamente como **baseline pendiente de la orden ministerial técnica**. No se presenta como perfil definitivo de la futura solución pública.

### 4. Precios con IVA incluido y redondeos

Cuando la tarifa comercial incluye IVA, el generador calcula el precio unitario sin impuesto antes de construir Facturae/UBL.

El precio unitario admite hasta 8 decimales en el XML para reducir diferencias de redondeo. Los importes monetarios finales se expresan con 2 decimales.

Los descuentos globales prorrateados y ajustes ya incorporados a las líneas no se vuelven a restar/sumar en los totales XML.

### 5. Versionado documental inmutable

Se crea `electronic_invoice_documents`.

Cada generación crea una versión nueva por combinación:

- factura;
- formato;
- perfil.

Se conservan:

- XML original;
- versión;
- perfil y especificación;
- SHA-256 del XML;
- XML firmado importado, si existe;
- SHA-256 del XML firmado;
- estado de firma;
- estado de entrega;
- referencia externa;
- respuesta externa;
- errores;
- fechas de generación, firma, envío, aceptación y rechazo.

Un XML ya generado no se sobrescribe al regenerar: se crea una nueva versión.

### 6. Firma externa

Para FACe y plataformas B2B privadas el documento queda en estado de firma externa requerida.

La API permite importar posteriormente el XML firmado y registra su SHA-256.

**Importante:** FaroCapital Fase 7 no realiza todavía una validación criptográfica XAdES de la firma importada. Se comprueba estructura/formato básico y se conserva la huella. La verificación criptográfica debe incorporarse junto al módulo de firma/certificados o delegarse en un proveedor de firma validado.

Se limita el payload firmado importado a 10 MB.

### 7. FACe / AAPP

Se añade soporte de datos maestros para:

- canal de factura electrónica;
- endpoint electrónico;
- identificador Peppol/EDI;
- Oficina Contable DIR3;
- Órgano Gestor DIR3;
- Unidad Tramitadora DIR3;
- Órgano Proponente DIR3.

El flujo permite generar Facturae 3.2.2 preparado para firma XAdES y registrar posteriormente el estado/referencia de entrega.

**No se simula un envío automático a FACe.** La remisión automática se reserva para un adaptador específico con alta/autenticación de integrador y configuración real del cliente.

### 8. B2B español

Se incorporan dos perfiles UBL:

- `b2b-public`;
- `b2b-private`.

El perfil privado queda preparado para firma avanzada y adaptador de transporte.

El perfil público queda versionado como baseline pendiente de la orden ministerial que concrete el perfil y los servicios técnicos de la solución pública.

### 9. Estados B2B

Se crea `electronic_invoice_status_events` con historial independiente de:

- aceptación comercial;
- rechazo comercial;
- aceptación parcial;
- rechazo parcial;
- pago completo;
- pago parcial;
- cesión.

Los eventos incluyen fecha, importe cuando procede, moneda, cesionario y payload/referencia externa para futuros conectores.

La fecha se valida como ISO y los eventos parciales requieren un importe positivo.

### 10. Interfaz de usuario

Se incorpora:

#### Ventas > Factura electrónica

Consola global con:

- búsqueda;
- filtros por formato, perfil y estado;
- paginación;
- factura y cliente;
- versión;
- estado documental y firma;
- SHA-256;
- referencia externa;
- errores;
- detalle del XML y respuestas.

Desde el detalle se puede:

- descargar XML;
- importar XML firmado;
- registrar enviado;
- registrar aceptado/rechazado;
- registrar eventos B2B.

#### Pestaña Factura electrónica en factura

Permite generar directamente:

- Facturae 3.2.2 / FACe;
- UBL B2B público;
- UBL B2B privado.

Muestra versiones y huellas y enlaza con la consola global.

#### Clientes y proveedores

Los formularios fiscales incluyen canal, endpoint/EDI y códigos DIR3.

#### Factura de venta

Se añaden:

- fecha de operación;
- referencia de pedido del cliente;
- referencia de contrato;
- referencia de transacción del receptor.

## Migración

La Fase 7 añade exactamente:

`20260829130000_electronic_invoicing_phase7.ts`

Añade campos a `contacts` y `sales_invoices` y crea:

- `electronic_invoice_documents`;
- `electronic_invoice_status_events`.

## API añadida

- `GET /api/electronic-invoices/capabilities`
- `GET /api/electronic-invoices/console`
- `GET /api/electronic-invoices/invoices/:id/documents`
- `POST /api/electronic-invoices/invoices/:id/generate`
- `GET /api/electronic-invoices/documents/:id`
- `GET /api/electronic-invoices/documents/:id/download`
- `POST /api/electronic-invoices/documents/:id/signed`
- `POST /api/electronic-invoices/documents/:id/delivery`
- `POST /api/electronic-invoices/documents/:id/status-events`

Los permisos se apoyan en las capacidades View/Edit de factura de venta.

## Base normativa/técnica contrastada

Fuentes oficiales consultadas durante la fase:

1. Portal Facturae — última versión:
   https://www.facturae.gob.es/formato/ultima-version
2. Portal Facturae — información general sobre Facturae 3.2.x y XAdES en AAPP:
   https://www.facturae.gob.es/formato
3. Real Decreto 238/2026, de 25 de marzo:
   https://www.boe.es/eli/es/rd/2026/03/25/238/con
4. Portal FACe:
   https://face.gob.es/

Criterios aplicados:

- Facturae 3.2.2 como versión actual del formato Facturae;
- Facturae 3.2.x con XAdES para facturas dirigidas a AAPP;
- modelo semántico EN16931 para B2B;
- sintaxis admitidas B2B: CII, UBL, EDIFACT y Facturae;
- solución pública basada en UBL en los términos de la futura orden ministerial;
- firma electrónica avanzada para facturas emitidas mediante plataformas privadas;
- arquitectura preparada para estados comerciales/pago.

## Validaciones de cierre

Se compara la Fase 7 contra el ZIP cerrado de Fase 6.

Validaciones realizadas:

- comprobación sintáctica TypeScript/TSX mediante `transpileModule`;
- resolución de imports locales y alias internos en ficheros afectados;
- generación real de un Facturae de muestra;
- generación real de un UBL de muestra;
- parseo XML de ambos documentos para comprobar XML bien formado;
- comprobaciones de Facturae 3.2.2, DIR3, referencias y recargo de equivalencia;
- comprobaciones de UBL EN16931 baseline, RE y motivos de exención/no sujeción;
- test Jest fuente `ElectronicInvoiceXml.spec.ts` incorporado para futura CI.

### Validaciones no certificadas en este entorno

El ZIP original no contiene `node_modules`. El entorno de cierre utiliza Node `v22.16.0`, mientras el proyecto declara `16.x || 17.x || 18.x`, y no dispone de `pnpm`/dependencias reproducibles con acceso a npm.

Por tanto no se certifican aquí:

- `pnpm typecheck` completo;
- `pnpm build` completo;
- ejecución Jest del monorepo;
- validación de Facturae contra el XSD oficial;
- validación EN16931/UBL mediante Schematron oficial;
- firma XAdES criptográfica;
- envío real FACe;
- envío real a la futura solución pública B2B;
- interoperabilidad con una plataforma privada concreta.

Antes de producción debe ejecutarse con Node 18:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
pnpm test
pnpm tenants:migrate:latest
```

Después se debe validar Facturae contra el XSD oficial y ejecutar pruebas integradas con certificado/credenciales reales o de preproducción.

## Límites deliberados de la Fase 7

Quedan fuera para evitar implementaciones parciales o dependientes de especificaciones/credenciales no disponibles:

1. Firma XAdES automática dentro de FaroCapital.
2. Verificación criptográfica de firmas importadas.
3. Conector FACe automático.
4. Perfil final y conector de la solución pública B2B mientras dependa de la orden técnica correspondiente.
5. Adaptadores concretos de plataformas privadas/Peppol.
6. Recepción/importación automática de facturas electrónicas de proveedor.
7. Facturas electrónicas rectificativas/UBL CreditNote conectadas a Credit Notes.

Estas funciones deben construirse sobre las tablas/versionado de esta fase, sin modificar los XML históricos ya generados.

## Estado de cierre

**FASE 7 CERRADA A NIVEL DE FUENTES.**

El empaquetado final debe conservar este documento, la migración y los nuevos módulos. La puesta en producción queda condicionada a `typecheck`, `build`, migraciones, validación XSD/Schematron y pruebas E2E en un entorno compatible con Node 18.
