import { chain, mapKeys } from 'lodash';

const getTransactionsLockingSettingsSchema = (modules: string[]) => {
  const moduleSchema = {
    active: { type: 'boolean' },
    lock_to_date: { type: 'date' },
    unlock_from_date: { type: 'date' },
    unlock_to_date: { type: 'date' },
    lock_reason: { type: 'string' },
    unlock_reason: { type: 'string' },
  };
  return chain(modules)
    .map((module: string) => {
      return mapKeys(moduleSchema, (value, key: string) => `${module}.${key}`);
    })
    .flattenDeep()
    .reduce((result, value) => {
      return {
        ...result,
        ...value,
      };
    }, {})
    .value();
};

export const SettingsOptions = {
  organization: {
    name: {
      type: 'string',
    },
    base_currency: {
      type: 'string',
    },
    industry: {
      type: 'string',
    },
    location: {
      type: 'string',
    },
    fiscal_year: {
      type: 'string',
    },
    financial_date_start: {
      type: 'string',
    },
    language: {
      type: 'string',
    },
    time_zone: {
      type: 'string',
    },
    date_format: {
      type: 'string',
    },
    accounting_basis: {
      type: 'string',
    },
    fiscal_country: {
      type: 'string',
    },
  },
  manual_journals: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
  },
  bill_payments: {
    withdrawal_account: {
      type: 'number',
    },
  },
  sales_estimates: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
    customer_notes: {
      type: 'string',
    },
    terms_conditions: {
      type: 'string',
    },
  },
  sales_receipts: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
    preferred_deposit_account: {
      type: 'number',
    },
    receipt_message: {
      type: 'string',
    },
    terms_conditions: {
      type: 'string',
    },
  },
  sales_invoices: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
    customer_notes: {
      type: 'string',
    },
    terms_conditions: {
      type: 'string',
    },
  },
  payment_receives: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
    preferred_deposit_account: {
      type: 'number',
    },
    preferred_advance_deposit: {
      type: 'number',
    },
  },
  items: {
    preferred_sell_account: {
      type: 'number',
    },
    preferred_cost_account: {
      type: 'number',
    },
    preferred_inventory_account: {
      type: 'number',
    },
  },
  item_categories: {
    table_size: {
      type: 'string',
    },
  },
  expenses: {
    preferred_payment_account: {
      type: 'number',
    },
  },
  inventory: {
    cost_compute_running: {
      type: 'boolean',
    },
  },
  accounts: {
    account_code_required: {
      type: 'boolean',
    },
    account_code_unique: {
      type: 'boolean',
    },
  },
  cashflow: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
  },
  credit_note: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
    customer_notes: {
      type: 'string',
    },
    terms_conditions: {
      type: 'string',
    },
  },
  vendor_credit: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
  },
  warehouse_transfers: {
    next_number: {
      type: 'string',
    },
    number_prefix: {
      type: 'string',
    },
    auto_increment: {
      type: 'boolean',
    },
  },
  'sms-notification': {
    'sms-notification-enable.sale-invoice-details': {
      type: 'boolean',
    },
    'sms-notification-enable.sale-invoice-reminder': {
      type: 'boolean',
    },
    'sms-notification-enable.sale-estimate-details': {
      type: 'boolean',
    },
    'sms-notification-enable.sale-receipt-details': {
      type: 'boolean',
    },
    'sms-notification-enable.payment-receive-details': {
      type: 'boolean',
    },
    'sms-notification-enable.customer-balance': {
      type: 'boolean',
    },
  },
  'transactions-locking': {
    'locking-type': {
      type: 'string',
    },
    ...getTransactionsLockingSettingsSchema([
      'all',
      'sales',
      'purchases',
      'financial',
    ]),
  },
  'spain-fiscal': {
    vat_periodicity: { type: 'string' },
    recc_enabled: { type: 'boolean' },
    oss_union_enabled: { type: 'boolean' },
    oss_non_union_enabled: { type: 'boolean' },
    ioss_enabled: { type: 'boolean' },
    input_vat_deductibility_percent: { type: 'number' },
  },
  sii: {
    enabled: { type: 'boolean' },
    environment: { type: 'string' },
    endpoint_issued: { type: 'string' },
    endpoint_received: { type: 'string' },
    endpoint_issued_payment: { type: 'string' },
    endpoint_received_payment: { type: 'string' },
  },
  verifactu: {
    enabled: { type: 'boolean' },
    sii_enabled: { type: 'boolean' },
    environment: { type: 'string' },
    endpoint: { type: 'string' },
    qr_endpoint: { type: 'string' },
    certificate_path: { type: 'string' },
    producer_name: { type: 'string' },
    producer_tax_number: { type: 'string' },
    system_name: { type: 'string' },
    system_id: { type: 'string' },
    system_version: { type: 'string' },
    installation_number: { type: 'string' },
    request_timeout_ms: { type: 'number' },
    default_wait_seconds: { type: 'number' },
    max_attempts: { type: 'number' },
  },
  features: {
    warehouses: {
      type: 'boolean',
    },
    branches: {
      type: 'boolean',
    },
  },
};
