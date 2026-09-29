import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Knex } from 'knex';
import {
  ISaleInvoiceCreatedPayload,
  ISaleInvoiceCreatingPaylaod,
} from '../SaleInvoice.types';
import { ItemsEntriesService } from '@/modules/Items/ItemsEntries.service';
import { CommandSaleInvoiceValidators } from './CommandSaleInvoiceValidators.service';
import { CommandSaleInvoiceDTOTransformer } from './CommandSaleInvoiceDTOTransformer.service';
import { UnitOfWork } from '@/modules/Tenancy/TenancyDB/UnitOfWork.service';
import { SaleEstimateValidators } from '@/modules/SaleEstimates/commands/SaleEstimateValidators.service';
import { SaleInvoice } from '../models/SaleInvoice';
import { SaleEstimate } from '@/modules/SaleEstimates/models/SaleEstimate';
import { Customer } from '@/modules/Customers/models/Customer';
import { events } from '@/common/events/events';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { CreateSaleInvoiceDto } from '../dtos/SaleInvoice.dto';
import { SaleInvoiceIncrement } from './SaleInvoiceIncrement.service';
import { ServiceError } from '@/modules/Items/ServiceError';
import { ERRORS } from '../constants';

@Injectable()
export class CreateSaleInvoice {
  /**
   * @param {ItemsEntriesService} itemsEntriesService - Items entries service.
   * @param {CommandSaleInvoiceValidators} validators - Command sale invoice validators.
   * @param {CommandSaleInvoiceDTOTransformer} transformerDTO - Command sale invoice DTO transformer.
   * @param {EventEmitter2} eventPublisher - Event emitter.
   * @param {SaleEstimateValidators} commandEstimateValidators - Command sale estimate validators.
   * @param {UnitOfWork} uow - Unit of work.
   * @param {TenantModelProxy<typeof SaleInvoice>} saleInvoiceModel - Sale invoice model.
   * @param {TenantModelProxy<typeof SaleEstimate>} saleEstimateModel - Sale estimate model.
   * @param {TenantModelProxy<typeof Customer>} customerModel - Customer model.
   */
  constructor(
    private readonly itemsEntriesService: ItemsEntriesService,
    private readonly validators: CommandSaleInvoiceValidators,
    private readonly transformerDTO: CommandSaleInvoiceDTOTransformer,
    private readonly eventPublisher: EventEmitter2,
    private readonly commandEstimateValidators: SaleEstimateValidators,
    private readonly uow: UnitOfWork,
    private readonly invoiceIncrement: SaleInvoiceIncrement,

    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,

    @Inject(SaleEstimate.name)
    private readonly saleEstimateModel: TenantModelProxy<typeof SaleEstimate>,

    @Inject(Customer.name)
    private readonly customerModel: TenantModelProxy<typeof Customer>,
  ) {}

  /**
   * Creates a new sale invoices and store it to the storage
   * with associated to entries and journal transactions.
   * @async
   * @param {number} tenantId - Tenant id.
   * @param {ISaleInvoice} saleInvoiceDTO - Sale invoice object DTO.
   * @return {Promise<ISaleInvoice>}
   */
  public createSaleInvoice = async (
    saleInvoiceDTO: CreateSaleInvoiceDto,
    outerTrx?: Knex.Transaction,
  ): Promise<SaleInvoice> => {
    try {
      return await this.uow.withTransaction(async (trx: Knex.Transaction) => {
        const customer = await this.customerModel()
          .query(trx)
          .findById(saleInvoiceDTO.customerId)
          .throwIfNotFound();

        if (saleInvoiceDTO.fromEstimateId) {
          const fromEstimate = await this.saleEstimateModel()
            .query(trx)
            .findById(saleInvoiceDTO.fromEstimateId)
            .forUpdate()
            .throwIfNotFound();
          this.commandEstimateValidators.validateEstimateNotConverted(fromEstimate);
        }

        await this.itemsEntriesService.validateItemsIdsExistance(saleInvoiceDTO.entries);
        await this.itemsEntriesService.validateNonSellableEntriesItems(saleInvoiceDTO.entries);

        const reservedInvoiceNo = saleInvoiceDTO.invoiceNo
          ? undefined
          : await this.invoiceIncrement.reserveNextInvoiceNumber(trx);
        const saleInvoiceObj = await this.transformerDTO.transformDTOToModel(
          customer,
          saleInvoiceDTO,
          undefined,
          reservedInvoiceNo,
        );

        if (saleInvoiceObj.invoiceNo) {
          await this.validators.validateInvoiceNumberUnique(saleInvoiceObj.invoiceNo, undefined, trx);
        }

        await this.eventPublisher.emitAsync(events.saleInvoice.onCreating, { saleInvoiceDTO, trx } as ISaleInvoiceCreatingPaylaod);
        const saleInvoice = await this.saleInvoiceModel().query(trx).upsertGraph(saleInvoiceObj);
        await this.eventPublisher.emitAsync(events.saleInvoice.onCreated, {
          saleInvoice, saleInvoiceDTO, saleInvoiceId: saleInvoice.id, trx,
        } as ISaleInvoiceCreatedPayload);
        return saleInvoice;
      }, outerTrx);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.errno === 1062) {
        throw new ServiceError(ERRORS.INVOICE_NUMBER_NOT_UNIQUE);
      }
      throw error;
    }
  };

  /**
   * Transformes create DTO to model.
   * @param {Customer} customer -
   * @param {ISaleInvoiceCreateDTO} saleInvoiceDTO -
   */
  private transformCreateDTOToModel = async (
    customer: Customer,
    saleInvoiceDTO: CreateSaleInvoiceDto,
  ) => {
    return this.transformerDTO.transformDTOToModel(customer, saleInvoiceDTO);
  };
}
