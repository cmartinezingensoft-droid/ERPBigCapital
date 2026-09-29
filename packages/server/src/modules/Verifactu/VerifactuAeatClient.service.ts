import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import { request as httpsRequest } from 'https';
import { createSecureContext } from 'tls';
import { URL } from 'url';
import { AeatQueryResult, AeatSubmissionResult } from './Verifactu.types';
import { VerifactuSettingsService } from './VerifactuSettings.service';
import { renderSoapEnvelope, renderVerifactuQueryEnvelope } from './lib/VerifactuXml';

const decodeXml = (value: string) =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const findTag = (xml: string, tag: string): string | undefined => {
  const pattern = new RegExp(
    `<(?:[A-Za-z0-9_-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[A-Za-z0-9_-]+:)?${tag}>`,
    'i',
  );
  const match = pattern.exec(xml);
  return match ? decodeXml(match[1].replace(/<[^>]+>/g, '').trim()) : undefined;
};

@Injectable()
export class VerifactuAeatClient {
  private cachedCertificate?: { key: string; pfx: Buffer };

  constructor(private readonly settings: VerifactuSettingsService) {}

  async submit(payloadXml: string): Promise<AeatSubmissionResult> {
    const responseXml = await this.requestSoap(payloadXml);
    return this.parseResponse(responseXml);
  }

  async queryRecord(input: {
    issuerName: string;
    issuerNif: string;
    invoiceNo: string;
    invoiceDate: string;
  }): Promise<AeatQueryResult> {
    const responseXml = await this.requestSoap(renderVerifactuQueryEnvelope(input));
    if (/<(?:[A-Za-z0-9_-]+:)?Fault\b/i.test(responseXml)) {
      return {
        found: false,
        status: 'SoapFault',
        errorCode: findTag(responseXml, 'faultcode') || 'SOAP_FAULT',
        errorMessage: findTag(responseXml, 'faultstring') || 'SOAP Fault returned by AEAT',
        responseXml,
        soapFault: true,
      };
    }
    const queryResult = findTag(responseXml, 'ResultadoConsulta') || 'Desconocido';
    const status = findTag(responseXml, 'EstadoRegistro') || queryResult;
    return {
      found: queryResult === 'ConDatos',
      status,
      errorCode: findTag(responseXml, 'CodigoErrorRegistro'),
      errorMessage: findTag(responseXml, 'DescripcionErrorRegistro'),
      queryResult,
      responseXml,
      soapFault: false,
    };
  }

  async validateCertificate() {
    const runtime = await this.settings.getRuntimeConfig();
    if (!runtime.certificatePath) {
      return { ok: false, configured: false, error: 'VERIFACTU_CERTIFICATE_PATH_REQUIRED' };
    }
    try {
      this.loadCertificate(runtime.certificatePath, runtime.certificatePassphrase);
      return {
        ok: true,
        configured: true,
        filename: runtime.certificateFilename,
        message: 'PKCS#12 válido y contraseña aceptada.',
      };
    } catch (error) {
      return {
        ok: false,
        configured: true,
        filename: runtime.certificateFilename,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async requestSoap(payloadXml: string): Promise<string> {
    const runtime = await this.settings.getRuntimeConfig();
    if (!runtime.effectiveEnabled) {
      throw new Error(runtime.siiEnabled ? 'VERIFACTU_BLOCKED_BY_SII' : 'VERIFACTU_DISABLED');
    }
    if (!runtime.endpoint) throw new Error('VERIFACTU_ENDPOINT_REQUIRED');
    if (!runtime.certificatePath) throw new Error('VERIFACTU_CERTIFICATE_PATH_REQUIRED');

    const pfx = this.loadCertificate(
      runtime.certificatePath,
      runtime.certificatePassphrase,
    );
    const body = renderSoapEnvelope(payloadXml);
    const url = new URL(runtime.endpoint);

    return new Promise<string>((resolve, reject) => {
      const req = httpsRequest(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? Number(url.port) : 443,
          path: `${url.pathname}${url.search}`,
          method: 'POST',
          pfx,
          passphrase: runtime.certificatePassphrase,
          rejectUnauthorized: true,
          timeout: runtime.requestTimeoutMs,
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: '""',
            'Content-Length': Buffer.byteLength(body, 'utf8'),
            'User-Agent': 'FaroCapital-VERIFACTU/1.1',
          },
        },
        (res) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            if ((res.statusCode || 500) >= 500 && !/<(?:\w+:)?Fault\b/i.test(text)) {
              reject(new Error(`AEAT_HTTP_${res.statusCode}: ${text.slice(0, 500)}`));
              return;
            }
            resolve(text);
          });
        },
      );
      req.on('timeout', () => req.destroy(new Error('VERIFACTU_AEAT_TIMEOUT')));
      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private loadCertificate(path: string, passphrase: string): Buffer {
    const cacheKey = `${path}\u0000${passphrase}`;
    if (this.cachedCertificate?.key !== cacheKey) {
      const pfx = readFileSync(path);
      createSecureContext({ pfx, passphrase });
      this.cachedCertificate = { key: cacheKey, pfx };
    }
    return this.cachedCertificate.pfx;
  }

  private async parseResponse(xml: string): Promise<AeatSubmissionResult> {
    const runtime = await this.settings.getRuntimeConfig();
    if (/<(?:[A-Za-z0-9_-]+:)?Fault\b/i.test(xml)) {
      const faultCode = findTag(xml, 'faultcode') || 'SOAP_FAULT';
      const faultString = findTag(xml, 'faultstring') || 'SOAP Fault returned by AEAT';
      return {
        ok: false,
        status: 'SoapFault',
        errorCode: faultCode,
        errorMessage: faultString,
        waitSeconds: runtime.defaultWaitSeconds,
        responseXml: xml,
        soapFault: true,
      };
    }

    const estadoRegistro = findTag(xml, 'EstadoRegistro');
    const estadoEnvio = findTag(xml, 'EstadoEnvio') || estadoRegistro || 'Desconocido';
    const csv = findTag(xml, 'CSV');
    const errorCode = findTag(xml, 'CodigoErrorRegistro');
    const errorMessage = findTag(xml, 'DescripcionErrorRegistro');
    const waitRaw = Number(findTag(xml, 'TiempoEsperaEnvio'));
    const waitSeconds = Number.isFinite(waitRaw) && waitRaw >= 0
      ? waitRaw
      : runtime.defaultWaitSeconds;
    const accepted = ['Correcto', 'AceptadoConErrores'].includes(
      estadoRegistro || estadoEnvio,
    );

    return {
      ok: accepted,
      status: estadoRegistro || estadoEnvio,
      csv,
      errorCode,
      errorMessage,
      waitSeconds,
      responseXml: xml,
      soapFault: false,
    };
  }
}
