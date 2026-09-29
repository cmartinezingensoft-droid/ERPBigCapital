/*
 * Local QR rendering for VERI*FACTU invoice PDFs.
 * The matrix encoder is the MIT-licensed "QRCode for JavaScript" by
 * Kazuhiko Arase, vendored under ./qrcode-vendor. No fiscal data is sent to
 * third-party QR services.
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRCode = require('./qrcode-vendor');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const QRErrorCorrectLevel = require('./qrcode-vendor/QRErrorCorrectLevel');

const escapeXmlAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * Encodes a URL as a standards-compliant QR and returns an SVG data URI.
 * A four-module quiet zone is mandatory for reliable reading from printed PDFs.
 */
export function verifactuQrSvgDataUri(value: string): string {
  const text = String(value || '').trim();
  if (!text) throw new Error('VERIFACTU_QR_URL_REQUIRED');

  const qr = new QRCode(-1, QRErrorCorrectLevel.M);
  qr.addData(text);
  qr.make();

  const moduleCount = Number(qr.getModuleCount());
  const quietZone = 4;
  const size = moduleCount + quietZone * 2;
  const commands: string[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (qr.isDark(row, col)) {
        commands.push(`M${col + quietZone} ${row + quietZone}h1v1h-1z`);
      }
    }
  }

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" ` +
    `shape-rendering="crispEdges" role="img" aria-label="${escapeXmlAttribute('QR VERI*FACTU')}">` +
    `<rect width="100%" height="100%" fill="white"/>` +
    `<path d="${commands.join('')}" fill="black"/>` +
    `</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
