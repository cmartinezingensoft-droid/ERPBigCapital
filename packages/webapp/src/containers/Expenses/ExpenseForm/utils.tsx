import { Intent } from '@blueprintjs/core';
import { useFormikContext } from 'formik';
import { first, sumBy } from 'lodash';
import moment from 'moment';
import * as R from 'ramda';
import React from 'react';
import intl from 'react-intl-universal';
import type { Expense } from '@farocapital/sdk-ts';
import { calculateSpanishFiscalLine } from '@farocapital/utils';
import { useExpenseFormContext } from './ExpenseFormPageProvider';
import type {
  ExpenseEntry,
  ExpenseErrorResponse,
  ExpenseFormValues,
} from './types';
import { AppToaster } from '@/components';
import {
  transformAttachmentsToForm,
  transformAttachmentsToRequest,
} from '@/containers/Attachments/utils';
import { useCurrentOrganizationBaseCurrency } from '@/hooks/query';
import {
  defaultFastFieldShouldUpdate,
  transformToForm,
  repeatValue,
  ensureEntriesHasEmptyLine,
  orderingLinesIndexes,
  formattedAmount,
} from '@/utils';

const ERROR = {
  EXPENSE_ALREADY_PUBLISHED: 'EXPENSE.ALREADY.PUBLISHED',
  ENTRIES_ALLOCATED_COST_COULD_NOT_DELETED:
    'ENTRIES_ALLOCATED_COST_COULD_NOT_DELETED',
};

export const MIN_LINES_NUMBER = 1;

export const defaultExpenseEntry: ExpenseEntry = {
  amount: '',
  expenseAccountId: '',
  description: '',
  landedCost: 0,
  projectId: '',
  taxRateId: '',
};

export const defaultExpense: ExpenseFormValues = {
  paymentAccountId: '',
  beneficiary: '',
  paymentFecha: moment(new Date()).format('YYYY-MM-DD'),
  description: '',
  referenceNo: '',
  currencyCode: '',
  publish: '',
  branchId: '',
  exchangeRate: 1,
  categories: [...repeatValue(defaultExpenseEntry, MIN_LINES_NUMBER)],
  attachments: [],
};

/**
 * Transform API errors in toasts messages.
 */
export const transformErrors = (
  errors: ExpenseErrorResponse[],
  { setErrors }: { setErrors: (errors: any) => void },
) => {
  const hasError = (errorType: string) =>
    errors.some((e) => e.type === errorType);

  if (hasError(ERROR.EXPENSE_ALREADY_PUBLISHED)) {
    setErrors(
      AppToaster.show({
        message: intl.get('the_expense_is_already_published'),
      }),
    );
  }
  if (hasError(ERROR.ENTRIES_ALLOCATED_COST_COULD_NOT_DELETED)) {
    setErrors(
      AppToaster.show({
        intent: Intent.DANGER,
        message: 'ENTRIES_ALLOCATED_COST_COULD_NOT_DELETED',
      }),
    );
  }
};

/**
 * Transformes the expense to form initial values in edit mode.
 */
export const transformToEditForm = (
  expense: Expense,
  defaultValues: ExpenseFormValues,
  linesNumber = 4,
): ExpenseFormValues => {
  const expenseEntry = defaultValues.categories[0];
  const initialEntries = [
    ...expense.categories.map((category) => ({
      ...transformToForm(category, expenseEntry),
    })),
    ...repeatValue(
      expenseEntry,
      Math.max(linesNumber - expense.categories.length, 0),
    ),
  ];
  const categories = R.compose(
    ensureEntriesHasEmptyLine(MIN_LINES_NUMBER, expenseEntry),
  )(initialEntries) as unknown as ExpenseEntry[];

  const attachments = transformAttachmentsToForm(expense);

  return {
    ...transformToForm(expense, defaultValues),
    categories,
    attachments,
  } as ExpenseFormValues;
};

/**
 * Detarmine cusotmers fast-field should update.
 */
export const customersFieldShouldUpdate = (newProps: any, oldProps: any) => {
  return (
    newProps.shouldUpdateDeps.items !== oldProps.shouldUpdateDeps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Detarmine accounts fast-field should update.
 */
export const accountsFieldShouldUpdate = (newProps: any, oldProps: any) => {
  return (
    newProps.items !== oldProps.items ||
    defaultFastFieldShouldUpdate(newProps, oldProps)
  );
};

/**
 * Filter expense entries that has no amount or expense account.
 */
export const filterNonZeroEntries = (categories: ExpenseEntry[]) => {
  return categories.filter(
    (category) => category.amount && category.expenseAccountId,
  );
};

/**
 * Transformes the form values to request body.
 */
export const transformFormValuesToRequest = (values: ExpenseFormValues) => {
  const categories = filterNonZeroEntries(values.categories);
  const attachments = transformAttachmentsToRequest(values);

  return {
    ...values,
    categories: R.compose(orderingLinesIndexes)(categories),
    attachments,
  };
};

export const useSetPrimaryBranchToForm = () => {
  const { setFieldValue } = useFormikContext<ExpenseFormValues>();
  const { branches, isBranchesSuccess, isNewMode } = useExpenseFormContext();

  React.useEffect(() => {
    if (isBranchesSuccess && isNewMode) {
      const primaryBranch = branches.find((b) => b.primary) || first(branches);

      if (primaryBranch) {
        setFieldValue('branchId', primaryBranch.id);
      }
    }
  }, [isBranchesSuccess, setFieldValue, branches, isNewMode]);
};

/**
 * Retrieves the expense subtotal.
 * @returns {number}
 */
export const useExpenseSubtotal = () => {
  const {
    values: { categories },
  } = useFormikContext<ExpenseFormValues>();

  return React.useMemo(() => sumBy(categories, 'amount'), [categories]);
};

/**
 * Retrieves the expense subtotal formatted.
 * @returns {string}
 */
export const useExpenseSubtotalFormatted = () => {
  const subtotal = useExpenseSubtotal();
  const {
    values: { currencyCode },
  } = useFormikContext<ExpenseFormValues>();

  return formattedAmount(subtotal, currencyCode);
};

/**
 * Retrieves the expense total.
 * @returns {number}
 */
export const useExpenseTotal = () => {
  const { values } = useFormikContext<ExpenseFormValues>();
  const { taxRates } = useExpenseFormContext();

  return React.useMemo(() => {
    const taxRateById = new Map(
      (taxRates || []).map((taxRate: any) => [Number(taxRate.id), taxRate]),
    );
    return (values.categories || []).reduce((sum, category) => {
      const taxRate: any = category.taxRateId
        ? taxRateById.get(Number(category.taxRateId))
        : undefined;
      const fiscal = calculateSpanishFiscalLine({
        quantity: 1,
        rate: Number(category.amount || 0),
        vatRate: Number(taxRate?.rate || 0),
        fiscalRegime: taxRate?.fiscalRegime || 'standard',
        equivalenceSurchargeRate: Number(
          taxRate?.equivalenceSurchargeRate || 0,
        ),
        retentionRate: Number(taxRate?.retentionRate || 0),
      });
      return sum + fiscal.total;
    }, 0);
  }, [values.categories, taxRates]);
};

/**
 * Retrieves the expense total formatted.
 * @returns {string}
 */
export const useExpenseTotalFormatted = () => {
  const total = useExpenseTotal();
  const {
    values: { currencyCode },
  } = useFormikContext<ExpenseFormValues>();

  return formattedAmount(total, currencyCode);
};

/**
 * Detarmines whether the expenses has foreign .
 * @returns {boolean}
 */
export const useExpensesIsForeign = () => {
  const { values } = useFormikContext<ExpenseFormValues>();
  const baseCurrency = useCurrentOrganizationBaseCurrency();

  const isForeignExpenses = React.useMemo(
    () => values.currencyCode !== baseCurrency,
    [values.currencyCode, baseCurrency],
  );
  return isForeignExpenses;
};
