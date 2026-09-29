import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { Knex } from 'knex';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { ViesCheckDto } from './dtos/ViesCheck.dto';

const ENDPOINT = 'https://ec.europa.eu/taxation_customs/vies/services/checkVatService';
const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const read = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'i'));
  return match ? match[1].replace(/<!\[CDATA\[|\]\]>/g, '').trim() : '';
};

@Injectable()
export class SpanishViesService {
  constructor(
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
  ) {}

  async check(input: ViesCheckDto) {
    const countryCode = String(input.countryCode || '').trim().toUpperCase();
    const vatNumber = String(input.vatNumber || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .replace(new RegExp(`^${countryCode}`), '');
    if (!/^[A-Z]{2}$/.test(countryCode) || !vatNumber) throw new Error('VIES_INVALID_INPUT');

    const body = `<?xml version="1.0" encoding="UTF-8"?>` +
      `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ec.europa.eu:taxud:vies:services:checkVat:types">` +
      `<soap:Body><urn:checkVat><urn:countryCode>${escapeXml(countryCode)}</urn:countryCode>` +
      `<urn:vatNumber>${escapeXml(vatNumber)}</urn:vatNumber></urn:checkVat></soap:Body></soap:Envelope>`;

    const response = await axios.post(ENDPOINT, body, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '' },
      timeout: 15000,
      responseType: 'text',
      validateStatus: (status) => status >= 200 && status < 500,
    });
    const xml = String(response.data || '');
    if (response.status >= 400 || /<faultcode/i.test(xml)) {
      throw new Error(`VIES_SERVICE_ERROR:${read(xml, 'faultstring') || response.status}`);
    }
    const valid = read(xml, 'valid').toLowerCase() === 'true';
    const result = {
      countryCode,
      vatNumber,
      valid,
      requestDate: read(xml, 'requestDate'),
      name: read(xml, 'name'),
      address: read(xml, 'address'),
      checkedAt: new Date().toISOString(),
      evidence: 'VIES-European-Commission',
    };

    if (input.contactId) {
      await this.tenantKnex()('contacts').where({ id: input.contactId }).update({
        vies_status: valid ? 'valid' : 'invalid',
        vies_checked_at: this.tenantKnex().fn.now(),
        vies_country_code: countryCode,
        vies_vat_number: vatNumber,
      });
    }
    return result;
  }
}
