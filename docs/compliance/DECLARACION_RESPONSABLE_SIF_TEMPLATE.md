# Declaración responsable del sistema informático de facturación — plantilla FaroCapital

> **Plantilla de despliegue. No firmar ni publicar con marcadores pendientes.**

## 1. Productor

- Nombre / razón social: `[PRODUCTOR_RAZON_SOCIAL]`
- NIF: `[PRODUCTOR_NIF]`
- Domicilio: `[PRODUCTOR_DOMICILIO]`

## 2. Sistema informático

- Nombre: **FaroCapital**
- Identificador: **BC**
- Versión: `[VERSION_DISTRIBUIDA]`
- Modalidad implementada: **VERI*FACTU**

## 3. Manifestación

El productor declara, bajo su responsabilidad, que la versión identificada del sistema
informático de facturación ha sido diseñada para cumplir los requisitos aplicables de
integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de
los registros de facturación y que, cuando se configura en modalidad VERI*FACTU, remite
los registros a la Agencia Estatal de Administración Tributaria mediante los servicios
y formatos oficiales configurados para dicha modalidad.

La aplicación genera registros de alta, subsanación y anulación; calcula la huella
SHA-256 conforme a la cadena de campos de la especificación; encadena cada nuevo registro
con el anterior; conserva de forma inmutable la instantánea fiscal generada; mantiene una
cola persistente de envío; y conserva el resultado/CSV devuelto por la AEAT.

## 4. Identificación de la versión

- Fecha de liberación: `[FECHA]`
- Hash SHA-256 del paquete distribuido: `[SHA256_PAQUETE]`
- URL o medio de acceso a esta declaración: `[URL_DECLARACION]`

## 5. Firma

En `[LUGAR]`, a `[FECHA]`.

`[NOMBRE_Y_CARGO_FIRMANTE]`

---

Antes de cada release fiscal debe generarse una declaración final específica para la
versión realmente distribuida y sustituir todos los marcadores anteriores.
