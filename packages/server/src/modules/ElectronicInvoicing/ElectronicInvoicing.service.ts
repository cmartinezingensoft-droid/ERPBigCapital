import { createHash } from 'crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { ElectronicInvoiceBuilderService } from './ElectronicInvoiceBuilder.service';
import {
  ElectronicInvoiceFormat,
  ElectronicInvoiceProfile,
} from './ElectronicInvoice.types';
import { renderFacturae322 } from './lib/Facturae322';
import { renderUbl21 } from './lib/Ubl21';
import {
  CreateElectronicInvoiceStatusEventDto,
  GenerateElectronicInvoiceDto,
  ImportSignedElectronicInvoiceDto,
  UpdateElectronicInvoiceDeliveryDto,
} from './dtos/ElectronicInvoice.dto';

const sha256 = (value: string) =>
  createHash('sha256').update(value, 'utf8').digest('hex');

const now = (knex: Knex) => knex.fn.now();

@Injectable()
export class ElectronicInvoicingService {
  constructor(
    private readonly builder: ElectronicInvoiceBuilderService,
    @Inject(TENANCY_DB_CONNECTION) private readonly tenantKnex: () => Knex,
  ) {}

  capabilities() {
    return {
      semanticModel: 'EN16931',
      formats: {
        facturae: { version: '3.2.2', generation: true },
        ubl: { version: '2.1', generation: true, customization: 'EN16931 baseline' },
      },
      face: {
        generation: true,
        dir3: true,
        xades: { required: true, automaticSigning: false, signedPayloadImport: true },
        automaticSubmission: false,
        note: 'La remisión automática requiere alta como integrador, autenticación y configuración específica de FACe.',
      },
      b2b: {
        rd2382026: true,
        publicSolution: {
          format: 'UBL',
          generation: true,
          automaticSubmission: false,
          technicalProfileStatus: 'pending-ministerial-order',
        },
        privatePlatforms: {
          generation: true,
          advancedSignatureRequired: true,
          transportAdapterStatus: 'adapter-ready',
        },
        statusEvents: [
          'commercial_acceptance',
          'commercial_rejection',
          'partial_acceptance',
          'partial_rejection',
          'full_payment',
          'partial_payment',
          'assignment',
        ],
      },
    };
  }

  async generate(invoiceId: number, input: GenerateElectronicInvoiceDto) {
    this.validateFormatProfile(input.format, input.profile);
    const canonical = await this.builder.build(invoiceId);
    this.validateProfileData(canonical, input.profile);
    this.validateCanonical(canonical);

    const payload = input.format === 'facturae-3.2.2'
      ? renderFacturae322(canonical)
      : renderUbl21(canonical, undefined);
    const knex = this.tenantKnex();
    const latest = await knex('electronic_invoice_documents')
      .where({ sale_invoice_id: invoiceId, format: input.format, profile: input.profile })
      .max<{ maxVersion?: number }[]>({ maxVersion: 'version' })
      .first();
    const version = Number((latest as any)?.maxVersion || 0) + 1;
    const signatureRequired = input.profile === 'face' || input.profile === 'b2b-private';
    const specVersion = input.format === 'facturae-3.2.2'
      ? 'Facturae-3.2.2'
      : input.profile === 'b2b-public'
        ? 'UBL-2.1-EN16931-baseline-pending-MO'
        : 'UBL-2.1-EN16931-baseline';

    const [id] = await knex('electronic_invoice_documents').insert({
      sale_invoice_id: invoiceId,
      format: input.format,
      profile: input.profile,
      semantic_model: 'EN16931',
      spec_version: specVersion,
      version,
      status: signatureRequired ? 'generated' : 'ready',
      signature_status: signatureRequired ? 'external_required' : 'unsigned',
      payload,
      payload_sha256: sha256(payload),
      generated_at: now(knex),
      created_at: now(knex),
    });
    return this.getDocument(Number(id));
  }

  async listByInvoice(invoiceId: number) {
    return this.tenantKnex()('electronic_invoice_documents')
      .where({ sale_invoice_id: invoiceId })
      .select(this.publicColumns())
      .orderBy('id', 'desc');
  }

  async console(query: Record<string, string>) {
    const knex = this.tenantKnex();
    const page = Math.max(1, Number.parseInt(query.page || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(10, Number.parseInt(query.pageSize || '25', 10) || 25));
    const base = knex('electronic_invoice_documents as d')
      .leftJoin('sales_invoices as i', 'i.id', 'd.sale_invoice_id')
      .leftJoin('contacts as c', 'c.id', 'i.customer_id');
    if (query.status) base.where('d.status', query.status);
    if (query.format) base.where('d.format', query.format);
    if (query.profile) base.where('d.profile', query.profile);
    if (query.search) {
      base.where((qb) => qb
        .where('i.invoice_no', 'like', `%${query.search}%`)
        .orWhere('c.display_name', 'like', `%${query.search}%`)
        .orWhere('d.external_reference', 'like', `%${query.search}%`));
    }
    const countRow = await base.clone().clearSelect().clearOrder().count<{ count: number }[]>({ count: '*' }).first();
    const data = await base
      .select([
        'd.id', 'd.sale_invoice_id', 'd.format', 'd.profile', 'd.spec_version', 'd.version',
        'd.status', 'd.signature_status', 'd.payload_sha256', 'd.signed_payload_sha256',
        'd.external_reference', 'd.error_code', 'd.error_message', 'd.generated_at', 'd.signed_at',
        'd.submitted_at', 'd.accepted_at', 'd.rejected_at', 'i.invoice_no', 'i.invoice_date',
        'i.currency_code', 'c.display_name as customer_name', 'c.fiscal_number as customer_fiscal_number',
      ])
      .orderBy('d.id', 'desc')
      .limit(pageSize)
      .offset((page - 1) * pageSize);
    const total = Number((countRow as any)?.count || 0);
    return { data, pagination: { page, pageSize, total, pages: Math.max(1, Math.ceil(total / pageSize)) } };
  }

  async getDocument(id: number, includePayload = true) {
    const columns = includePayload
      ? ['*']
      : this.publicColumns();
    const document = await this.tenantKnex()('electronic_invoice_documents')
      .where({ id })
      .first(columns as any);
    if (!document) throw new Error('EINVOICE_DOCUMENT_NOT_FOUND');
    const events = await this.tenantKnex()('electronic_invoice_status_events')
      .where({ document_id: id })
      .orderBy('event_date', 'desc');
    return { ...document, events };
  }

  async importSigned(id: number, input: ImportSignedElectronicInvoiceDto) {
    const knex = this.tenantKnex();
    const document = await knex('electronic_invoice_documents').where({ id }).first();
    if (!document) throw new Error('EINVOICE_DOCUMENT_NOT_FOUND');
    if (input.signedPayload.length > 10_000_000) {
      throw new Error('EINVOICE_SIGNED_PAYLOAD_TOO_LARGE');
    }
    if (!String(input.signedPayload || '').includes('Signature')) {
      throw new Error('EINVOICE_SIGNATURE_ELEMENT_REQUIRED');
    }
    if (document.format === 'facturae-3.2.2' && !input.signedPayload.includes('Facturae')) {
      throw new Error('EINVOICE_SIGNED_PAYLOAD_FORMAT_MISMATCH');
    }
    if (document.format === 'ubl-2.1' && !input.signedPayload.includes('Invoice')) {
      throw new Error('EINVOICE_SIGNED_PAYLOAD_FORMAT_MISMATCH');
    }
    await knex('electronic_invoice_documents').where({ id }).update({
      signed_payload: input.signedPayload,
      signed_payload_sha256: sha256(input.signedPayload),
      signature_status: 'signed',
      status: 'ready',
      signed_at: now(knex),
      updated_at: now(knex),
      error_code: null,
      error_message: null,
    });
    return this.getDocument(id);
  }

  async updateDelivery(id: number, input: UpdateElectronicInvoiceDeliveryDto) {
    const knex = this.tenantKnex();
    const document = await knex('electronic_invoice_documents').where({ id }).first();
    if (!document) throw new Error('EINVOICE_DOCUMENT_NOT_FOUND');
    if ((document.profile === 'face' || document.profile === 'b2b-private') &&
        input.status === 'submitted' && document.signature_status !== 'signed') {
      throw new Error('EINVOICE_SIGNATURE_REQUIRED_BEFORE_SUBMISSION');
    }
    const dateColumns: Record<string, object> = {
      submitted: { submitted_at: now(knex) },
      accepted: { accepted_at: now(knex) },
      rejected: { rejected_at: now(knex) },
      failed: {},
    };
    await knex('electronic_invoice_documents').where({ id }).update({
      status: input.status,
      external_reference: input.externalReference ?? document.external_reference,
      response_payload: input.responsePayload ?? document.response_payload,
      error_code: input.errorCode ?? null,
      error_message: input.errorMessage ?? null,
      updated_at: now(knex),
      ...dateColumns[input.status],
    });
    return this.getDocument(id);
  }

  async createStatusEvent(id: number, input: CreateElectronicInvoiceStatusEventDto) {
    const knex = this.tenantKnex();
    const document = await knex('electronic_invoice_documents').where({ id }).first();
    if (!document) throw new Error('EINVOICE_DOCUMENT_NOT_FOUND');
    if (['partial_payment', 'partial_acceptance', 'partial_rejection'].includes(input.eventType) && input.amount === undefined) {
      throw new Error('EINVOICE_STATUS_EVENT_AMOUNT_REQUIRED');
    }
    if (input.eventType === 'assignment' && !input.assigneeTaxNumber) {
      throw new Error('EINVOICE_ASSIGNMENT_TAX_NUMBER_REQUIRED');
    }
    const [eventId] = await knex('electronic_invoice_status_events').insert({
      document_id: id,
      event_type: input.eventType,
      event_date: input.eventDate,
      amount: input.amount ?? null,
      currency_code: input.currencyCode || null,
      assignee_tax_number: input.assigneeTaxNumber || null,
      assignee_name: input.assigneeName || null,
      state: 'recorded',
      payload: input.payload || null,
      created_at: now(knex),
    });
    return knex('electronic_invoice_status_events').where({ id: eventId }).first();
  }

  async getDownload(id: number, variant: 'original' | 'signed') {
    const document = await this.tenantKnex()('electronic_invoice_documents').where({ id }).first();
    if (!document) throw new Error('EINVOICE_DOCUMENT_NOT_FOUND');
    const content = variant === 'signed' ? document.signed_payload : document.payload;
    if (!content) throw new Error('EINVOICE_SIGNED_PAYLOAD_NOT_AVAILABLE');
    const ext = variant === 'signed' && document.format === 'facturae-3.2.2' ? 'xsig' : 'xml';
    return {
      content: String(content),
      contentType: 'application/xml; charset=utf-8',
      filename: `factura-${document.sale_invoice_id}-${document.format}-v${document.version}.${ext}`,
    };
  }

  private validateFormatProfile(format: ElectronicInvoiceFormat, profile: ElectronicInvoiceProfile) {
    if (profile === 'face' && format !== 'facturae-3.2.2') {
      throw new Error('EINVOICE_FACE_REQUIRES_FACTURAE_322');
    }
    if (profile === 'b2b-public' && format !== 'ubl-2.1') {
      throw new Error('EINVOICE_PUBLIC_B2B_REQUIRES_UBL');
    }
  }

  private validateProfileData(canonical: any, profile: ElectronicInvoiceProfile) {
    if (profile === 'face') {
      const dir3 = canonical.dir3 || {};
      if (!dir3.accountingOffice || !dir3.managementBody || !dir3.processingUnit) {
        throw new Error('EINVOICE_FACE_DIR3_REQUIRED');
      }
    }
  }

  private validateCanonical(canonical: any) {
    if (!canonical.lines?.length) {
      throw new Error('EINVOICE_LINES_REQUIRED');
    }

    const tolerance = 0.02;
    const lineExtension = canonical.lines.reduce((sum: number, line: any) => sum + Number(line.netAmount || 0), 0);
    const taxEquation = Number(canonical.totals.taxExclusiveAmount || 0)
      + Number(canonical.totals.vatAmount || 0)
      + Number(canonical.totals.equivalenceSurchargeAmount || 0)
      - Number(canonical.totals.retentionAmount || 0);

    if (Math.abs(lineExtension - Number(canonical.totals.lineExtensionAmount || 0)) > tolerance) {
      throw new Error('EINVOICE_LINE_TOTALS_INCONSISTENT');
    }
    if (Math.abs(taxEquation - Number(canonical.totals.payableAmount || 0)) > tolerance) {
      throw new Error('EINVOICE_TAX_TOTALS_INCONSISTENT');
    }
  }

  private publicColumns() {
    return [
      'id', 'sale_invoice_id', 'format', 'profile', 'semantic_model', 'spec_version', 'version',
      'status', 'signature_status', 'payload_sha256', 'signed_payload_sha256', 'external_reference',
      'error_code', 'error_message', 'generated_at', 'signed_at', 'submitted_at', 'accepted_at',
      'rejected_at', 'created_at', 'updated_at',
    ];
  }
}
