import { Inject, Injectable } from '@nestjs/common';
import { renderInvoicePaperTemplateHtml } from '@farocapital/pdf-templates';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GetSaleInvoice } from './GetSaleInvoice.service';
import { transformInvoiceToPdfTemplate } from '../utils';
import { SaleInvoicePdfTemplate } from './SaleInvoicePdfTemplate.service';
import { ChromiumlyTenancy } from '@/modules/ChromiumlyTenancy/ChromiumlyTenancy.service';
import { SaleInvoice } from '../models/SaleInvoice';
import { PdfTemplateModel } from '@/modules/PdfTemplate/models/PdfTemplate';
import { events } from '@/common/events/events';
import { InvoicePdfTemplateAttributes } from '../SaleInvoice.types';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { Knex } from 'knex';
import { TENANCY_DB_CONNECTION } from '@/modules/Tenancy/TenancyDB/TenancyDB.constants';
import { verifactuQrSvgDataUri } from '@/modules/Verifactu/lib/VerifactuQrSvg';

@Injectable()
export class SaleInvoicePdf {
  constructor(
    private chromiumlyTenancy: ChromiumlyTenancy,
    private getInvoiceService: GetSaleInvoice,
    private invoiceBrandingTemplateService: SaleInvoicePdfTemplate,
    private eventPublisher: EventEmitter2,

    @Inject(SaleInvoice.name)
    private saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(PdfTemplateModel.name)
    private pdfTemplateModel: TenantModelProxy<typeof PdfTemplateModel>,

    @Inject(TENANCY_DB_CONNECTION)
    private readonly tenantKnex: () => Knex,
  ) {}

  /**
   * Retrieve sale invoice html content.
   * @param {ISaleInvoice} saleInvoice -
   * @returns {Promise<string>}
   */
  public async getSaleInvoiceHtml(invoiceId: number): Promise<string> {
    const brandingAttributes =
      await this.getInvoiceBrandingAttributes(invoiceId);

    return renderInvoicePaperTemplateHtml({
      ...brandingAttributes,
    });
  }

  /**
   * Retrieve sale invoice pdf content.
   * @param {ISaleInvoice} saleInvoice -
   * @returns {Promise<[Buffer, string]>}
   */
  public async getSaleInvoicePdf(invoiceId: number): Promise<[Buffer, string]> {
    const filename = await this.getInvoicePdfFilename(invoiceId);
    const htmlContent = await this.getSaleInvoiceHtml(invoiceId);

    // Converts the given html content to pdf document.
    const buffer = await this.chromiumlyTenancy.convertHtmlContent(htmlContent);
    const eventPayload = { saleInvoiceId: invoiceId };

    // Triggers the `onSaleInvoicePdfViewed` event.
    await this.eventPublisher.emitAsync(
      events.saleInvoice.onPdfViewed,
      eventPayload,
    );
    return [buffer, filename];
  }

  /**
   * Retrieves the filename pdf document of the given invoice.
   * @param {number} invoiceId
   * @returns {Promise<string>}
   */
  private async getInvoicePdfFilename(invoiceId: number): Promise<string> {
    const invoice = await this.saleInvoiceModel().query().findById(invoiceId);
    return `Invoice-${invoice.invoiceNo}`;
  }

  /**
   * Retrieves the branding attributes of the given sale invoice.
   * @param {number} invoiceId
   * @returns {Promise<InvoicePdfTemplateAttributes>}
   */
  private async getInvoiceBrandingAttributes(
    invoiceId: number,
  ): Promise<InvoicePdfTemplateAttributes> {
    const invoice = await this.getInvoiceService.getSaleInvoice(invoiceId);

    // Retrieve the invoice template id or get the default template id if not found.
    const templateId =
      invoice.pdfTemplateId ??
      (
        await this.pdfTemplateModel().query().findOne({
          resource: 'SaleInvoice',
          default: true,
        })
      )?.id;

    // Get the branding template attributes.
    const brandingTemplate =
      await this.invoiceBrandingTemplateService.getInvoicePdfTemplate(
        templateId,
      );

    let verifactuQrDataUri: string | undefined;
    try {
      const record = await this.tenantKnex()('verifactu_records')
        .where({ sale_invoice_id: invoiceId })
        .whereIn('event', ['alta', 'subsanacion'])
        .whereNotNull('qr_url')
        .orderBy('id', 'desc')
        .first('qr_url');
      if (record?.qr_url) {
        verifactuQrDataUri = verifactuQrSvgDataUri(record.qr_url);
      }
    } catch (error) {
      // Keep PDF generation compatible before the VERI*FACTU migration runs.
      // Deployment validation requires migrations before enabling the feature.
    }

    // Merge the branding template attributes with the invoice.
    return {
      ...brandingTemplate.attributes,
      ...transformInvoiceToPdfTemplate(invoice),
      ...(verifactuQrDataUri && {
        verifactuQrDataUri,
        verifactuLegend: 'Factura verificable en la sede electrónica de la AEAT',
      }),
    };
  }
}
