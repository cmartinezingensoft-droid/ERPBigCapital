import { Inject, Injectable } from '@nestjs/common';
import { omit, sumBy } from 'lodash';
import * as moment from 'moment';
import * as R from 'ramda';
import * as composeAsync from 'async/compose';
import { BranchTransactionDTOTransformer } from '@/modules/Branches/integrations/BranchTransactionDTOTransform';
import { Expense } from '../models/Expense.model';
import { assocItemEntriesDefaultIndex } from '@/utils/associate-item-entries-index';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { CreateExpenseDto, EditExpenseDto } from '../dtos/Expense.dto';
import { TaxRateModel } from '@/modules/TaxRates/models/TaxRate.model';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { calculateSpanishFiscalLine } from '@farocapital/utils';

@Injectable()
export class ExpenseDTOTransformer {
  /**
   * @param {BranchTransactionDTOTransformer} branchDTOTransform - Branch transaction DTO transformer.
   * @param {TenancyContext} tenancyContext - Tenancy context.
   */
  constructor(
    private readonly branchDTOTransform: BranchTransactionDTOTransformer,
    private readonly tenancyContext: TenancyContext,
    @Inject(TaxRateModel.name)
    private readonly taxRateModel: TenantModelProxy<typeof TaxRateModel>,
  ) {}

  /**
   * Retrieve the expense landed cost amount.
   * @param  {IExpenseDTO} expenseDTO
   * @return {number}
   */
  private getExpenseLandedCostAmount = (
    expenseDTO: CreateExpenseDto | EditExpenseDto,
  ): number => {
    const landedCostEntries = expenseDTO.categories.filter((entry) => {
      return entry.landedCost === true;
    });
    return landedCostEntries.reduce(
      (sum, entry: any) =>
        sum +
        Number(entry.amount || 0) +
        Number(entry.equivalenceSurchargeAmount || 0),
      0,
    );
  };

  /**
   * Retrieve the given expense categories total.
   * @param   {IExpenseCategory} categories
   * @returns {number}
   */
  private getExpenseCategoriesTotal = (categories): number => {
    return sumBy(categories, 'amount');
  };

  /**
   * Mapping expense DTO to model.
   * @param {IExpenseDTO} expenseDTO
   * @param {ISystemUser} authorizedUser
   * @return {IExpense}
   */
  private async expenseDTOToModel(
    expenseDTO: CreateExpenseDto | EditExpenseDto,
  ): Promise<Expense> {
    const taxRateIds = (expenseDTO.categories || [])
      .map((category) => category.taxRateId)
      .filter(Boolean) as number[];
    const taxRates = taxRateIds.length
      ? await this.taxRateModel().query().whereIn('id', taxRateIds)
      : [];
    const taxRateById = new Map(taxRates.map((tax: any) => [Number(tax.id), tax]));

    let taxAmount = 0;
    let equivalenceSurchargeAmount = 0;
    let retentionAmount = 0;
    let totalAmount = 0;

    const fiscalCategories = (expenseDTO.categories || []).map((category: any) => {
      const tax: any = category.taxRateId
        ? taxRateById.get(Number(category.taxRateId))
        : undefined;
      const fiscal = calculateSpanishFiscalLine({
        quantity: 1,
        rate: Number(category.amount || 0),
        vatRate: Number(tax?.rate || 0),
        fiscalRegime: tax?.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(tax?.equivalenceSurchargeRate || 0),
        retentionRate: Number(tax?.retentionRate || 0),
      });
      taxAmount += fiscal.vatAmount;
      equivalenceSurchargeAmount += fiscal.equivalenceSurchargeAmount;
      retentionAmount += fiscal.retentionAmount;
      totalAmount += fiscal.total;
      return {
        ...category,
        taxRate: Number(tax?.rate || 0),
        fiscalRegime: tax?.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(tax?.equivalenceSurchargeRate || 0),
        retentionRate: Number(tax?.retentionRate || 0),
        taxTerritory: tax?.taxTerritory || 'iva',
        taxAmount: fiscal.vatAmount,
        equivalenceSurchargeAmount: fiscal.equivalenceSurchargeAmount,
        retentionAmount: fiscal.retentionAmount,
      };
    });

    const landedCostAmount = this.getExpenseLandedCostAmount({
      ...expenseDTO,
      categories: fiscalCategories,
    } as any);

    const categories = R.compose(
      assocItemEntriesDefaultIndex,
    )(fiscalCategories);

    const initialDTO = {
      ...omit(expenseDTO, ['publish', 'attachments']),
      categories,
      totalAmount,
      taxAmount,
      equivalenceSurchargeAmount,
      retentionAmount,
      landedCostAmount,
      paymentDate: moment(expenseDTO.paymentDate).toMySqlDateTime(),
      ...(expenseDTO.publish
        ? {
            publishedAt: moment().toMySqlDateTime(),
          }
        : {}),
    };
    const asyncDto = await composeAsync(
      this.branchDTOTransform.transformDTO<Expense>,
    )(initialDTO);

    return asyncDto as Expense;
  }

  /**
   * Transforms the expense create DTO.
   * @param {IExpenseCreateDTO} expenseDTO
   * @returns {Promise<Expense>}
   */
  public expenseCreateDTO = async (
    expenseDTO: CreateExpenseDto | EditExpenseDto,
  ): Promise<Partial<Expense>> => {
    const initialDTO = await this.expenseDTOToModel(expenseDTO);
    const tenant = await this.tenancyContext.getTenant(true);

    return {
      ...initialDTO,
      currencyCode: expenseDTO.currencyCode || tenant?.metadata?.baseCurrency,
      exchangeRate: expenseDTO.exchangeRate || 1,
      // ...(user
      //   ? {
      //       userId: user.id,
      //     }
      //   : {}),
    };
  };

  /**
   * Transformes the expense edit DTO.
   * @param {EditExpenseDto} expenseDTO
   * @returns {Promise<Expense>}
   */
  public expenseEditDTO = async (
    expenseDTO: EditExpenseDto,
  ): Promise<Expense> => {
    return this.expenseDTOToModel(expenseDTO);
  };
}
