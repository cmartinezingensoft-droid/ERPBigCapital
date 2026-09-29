import React from 'react';
import {
  SaleInvoiceAction,
  SaleEstimateAction,
  AbilitySubject,
  SaleReceiptAction,
  CustomerAction,
  PaymentReceiveAction,
  BillAction,
  VendorAction,
  PaymentMadeAction,
  AccountAction,
  ManualJournalAction,
  ExpenseAction,
  ItemAction,
  ReportsAction,
} from './abilityOption';
import type { HomepageSectionOption } from './types';
import { FormattedMessage as T } from '@/components';

export const accountsReceivable: HomepageSectionOption[] = [
  {
    sectionTitle: <T id={'accounts_receivable_a_r'} />,
    shortcuts: [
      {
        title: <T id={'sales_invoices'} />,
        description: <T id={'tracking_sales_invoices_with_your_customers'} />,
        icon: 'file-alt',
        link: '/invoices',
        subject: AbilitySubject.Invoice,
        ability: SaleInvoiceAction.View,
      },
      {
        title: <T id={'sales_estimates'} />,
        description: <T id={'manage_your_sales_estimates_to_create_quotes'} />,
        icon: 'clipboard',
        link: '/estimates',
        subject: AbilitySubject.Estimate,
        ability: SaleEstimateAction.View,
      },
      {
        title: <T id={'sales_receipts'} />,
        description: <T id={'manage_sales_receipts_for_sales_that_get_paid'} />,
        icon: 'receipt',
        link: '/receipts',
        subject: AbilitySubject.Receipt,
        ability: SaleReceiptAction.View,
      },
      {
        title: <T id={'customers'} />,
        description: <T id={'manage_the_customers_relations_with_customer'} />,
        icon: 'person',
        link: '/customers',
        subject: AbilitySubject.Customer,
        ability: CustomerAction.View,
      },
      {
        title: <T id={'customers_payments'} />,
        description: (
          <T id={'manage_payment_transactions_from_your_customers'} />
        ),
        icon: 'payments',
        link: '/payments-received',
        subject: AbilitySubject.PaymentReceive,
        ability: PaymentReceiveAction.View,
      },
    ],
  },
];

export const accountsPayable: HomepageSectionOption[] = [
  {
    sectionTitle: <T id={'accounts_payable_a_p'} />,
    shortcuts: [
      {
        title: <T id={'purchase_invoices'} />,
        description: (
          <T id={'manage_the_purchase_invoices_with_your_vendors'} />
        ),
        icon: 'file-alt',
        link: '/bills',
        subject: AbilitySubject.Bill,
        ability: BillAction.View,
      },
      {
        title: <T id={'vendors'} />,
        description: (
          <T id={'manage_the_vendors_relations_with_vendor_relations'} />
        ),
        icon: 'case-16',
        link: '/vendors',
        subject: AbilitySubject.Vendor,
        ability: VendorAction.View,
      },
      {
        title: <T id={'vendors_payments'} />,
        description: <T id={'manage_payments_transactions_to_your_vendors'} />,
        icon: 'quick-payment-16',
        link: '/payments-made',
        subject: AbilitySubject.PaymentMade,
        ability: PaymentMadeAction.View,
      },
    ],
  },
];

export const financialAccounting: HomepageSectionOption[] = [
  {
    sectionTitle: <T id={'financial_accounting'} />,
    shortcuts: [
      {
        title: <T id={'chart_of_accounts'} />,
        description: (
          <T
            id={
              'manage_your_accounts_chart_to_record_your_transactions_and_categories'
            }
          />
        ),
        icon: 'university',
        link: '/accounts',
        subject: AbilitySubject.Account,
        ability: AccountAction.View,
      },
      {
        title: <T id={'manual_journal'} />,
        description: (
          <T id={'manage_manual_journal_transactions_on_accounts'} />
        ),
        icon: 'reader-18',
        link: '/manual-journals',
        subject: AbilitySubject.ManualJournal,
        ability: ManualJournalAction.View,
      },
      {
        title: <T id={'expenses'} />,
        description: (
          <T id={'track_your_indirect_expenses_under_specific_categories'} />
        ),
        icon: 'credit-card',
        link: '/expenses',
        subject: AbilitySubject.Expense,
        ability: ExpenseAction.View,
      },
      {
        title: <T id={'financial_statements'} />,
        description: (
          <T id={'show_financial_reports_about_your_organization'} />
        ),
        icon: 'analytics',
        link: '/financial-reports',
        subject: AbilitySubject.Report,
        ability: ReportsAction.ALL,
      },
    ],
  },
];

export const productsServices: HomepageSectionOption[] = [
  {
    sectionTitle: <T id={'products_services_inventory'} />,
    shortcuts: [
      {
        title: <T id={'products_services'} />,
        description: (
          <T id={'manage_your_products_inventory_or_non_inventory'} />
        ),
        icon: 'shopping-cart',
        link: '/items',
        subject: AbilitySubject.Item,
        ability: ItemAction.View,
      },
      {
        title: <T id={'products_services_categories'} />,
        description: <T id={'group_your_products_and_service'} />,
        icon: 'tag-16',
        link: 'items/categories',
      },
      {
        title: <T id={'inventory_adjustments'} />,
        description: (
          <T id={'manage_your_inventory_adjustment_of_inventory_items'} />
        ),
        icon: 'archive',
        link: '/inventory-adjustments',
        subject: AbilitySubject.InventoryAdjustment,
        ability: SaleInvoiceAction.View,
      },
    ],
  },
];
