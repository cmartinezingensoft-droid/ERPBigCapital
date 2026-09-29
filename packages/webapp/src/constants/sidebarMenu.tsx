import React from 'react';
import { DialogsName } from './dialogs';
import { FormattedMessage as T } from '@/components';
import {
  ReportsAction,
  AbilitySubject,
  ItemAction,
  InventoryAdjustmentAction,
  SaleEstimateAction,
  SaleInvoiceAction,
  SaleReceiptAction,
  PaymentReceiveAction,
  BillAction,
  PaymentMadeAction,
  CustomerAction,
  VendorAction,
  AccountAction,
  ManualJournalAction,
  ExpenseAction,
  CashflowAction,
  PreferencesAbility,
  TaxRateAction,
} from '@/constants/abilityOption';
import { Features } from '@/constants/features';
import {
  ISidebarMenuItemType,
  ISidebarMenuOverlayIds,
} from '@/containers/Dashboard/Sidebar/interfaces';

export interface SidebarMenuItemPermission {
  subject: string;
  ability: string;
}

export interface SidebarMenuItem {
  text: React.ReactNode;
  type: ISidebarMenuItemType;
  icon?: string;
  iconColor?: string;
  disabled?: boolean;
  href?: string;
  matchExact?: boolean;
  overlayId?: ISidebarMenuOverlayIds;
  dialogName?: DialogsName;
  divider?: boolean;
  feature?: string;
  permission?: SidebarMenuItemPermission;
  children?: SidebarMenuItem[];
}

export const SidebarMenu: SidebarMenuItem[] = [
  // ---------------
  // # Homepage
  // ---------------
  {
    text: <T id={'sidebar.homepage'} />,
    icon: 'analytics',
    iconColor: '#9bbcff',
    type: ISidebarMenuItemType.Link,
    disabled: false,
    href: '/',
    matchExact: true,
  },
  // ---------------
  // # Sales & Inventory
  // ---------------
  {
    text: <T id={'sidebar.sales_inventory'} />,
    type: ISidebarMenuItemType.Group,
    children: [
      {
        text: <T id={'sidebar.items'} />,
        icon: 'shopping-cart',
        iconColor: '#7dd3fc',
        type: ISidebarMenuItemType.Overlay,
        overlayId: ISidebarMenuOverlayIds.Items,
        children: [
          {
            text: <T id={'sidebar.items'} />,
            type: ISidebarMenuItemType.Group,
            children: [
              {
                text: <T id={'sidebar.items'} />,
                icon: 'shopping-cart',
                href: '/items',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Item,
                  ability: ItemAction.View,
                },
              },
              {
                text: <T id={'sidebar.inventory_adjustments'} />,
                icon: 'archive',
                href: '/inventory-adjustments',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.InventoryAdjustment,
                  ability: InventoryAdjustmentAction.View,
                },
              },
              {
                text: <T id={'categories_list'} />,
                icon: 'tag-16',
                href: '/items/categories',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Item,
                  ability: ItemAction.View,
                },
              },
              {
                text: <T id={'sidebar.warehouse_transfer'} />,
                icon: 'warehouse-16',
                href: '/warehouses-transfers',
                type: ISidebarMenuItemType.Link,
                feature: Features.Warehouses,
              },
            ],
          },
          {
            text: <T id={'sidebar.new_tasks'} />,
            type: ISidebarMenuItemType.Group,
            children: [
              {
                text: <T id={'sidebar.new_inventory_item'} />,
                icon: 'plus-24',
                href: '/items/new',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Item,
                  ability: ItemAction.Create,
                },
              },
              {
                text: <T id={'sidebar.new_service'} />,
                icon: 'plus-24',
                href: '/items/new',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Item,
                  ability: ItemAction.Create,
                },
              },
              {
                text: <T id={'sidebar.new_item_category'} />,
                icon: 'tag-16',
                href: '/items/categories/new',
                type: ISidebarMenuItemType.Dialog,
                dialogName: DialogsName.ItemCategoryForm,
                permission: {
                  subject: AbilitySubject.Item,
                  ability: ItemAction.Create,
                },
              },
              {
                text: <T id={'sidebar.new_warehouse_transfer'} />,
                icon: 'warehouse-16',
                href: '/warehouses-transfers/new',
                type: ISidebarMenuItemType.Link,
                feature: Features.Warehouses,
              },
            ],
          },
        ],
      },
    ],
  },
  // ---------------
  // # Sales
  // ---------------
  {
    text: <T id={'sidebar.sales'} />,
    icon: 'receipt',
    iconColor: '#60a5fa',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Sales,
    children: [
      {
        text: <T id={'sidebar.sales'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.estimates'} />,
            icon: 'clipboard',
            href: '/estimates',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Estimate,
              ability: SaleEstimateAction.View,
            },
          },
          {
            text: <T id={'sidebar.invoices'} />,
            icon: 'file-alt',
            href: '/invoices',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Invoice,
              ability: SaleInvoiceAction.View,
            },
          },
          {
            text: 'VERI*FACTU',
            icon: 'checkmark-16',
            href: '/verifactu',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Invoice,
              ability: SaleInvoiceAction.View,
            },
          },
          {
            text: 'Factura electrónica',
            icon: 'send',
            href: '/electronic-invoicing',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Invoice,
              ability: SaleInvoiceAction.View,
            },
          },
          {
            text: 'Fiscalidad España',
            icon: 'balance-scale',
            href: '/spain-fiscal',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY,
            },
          },
          {
            text: 'SII',
            icon: 'file-export-16',
            href: '/sii',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY,
            },
          },
          {
            text: <T id={'sidebar.receipts'} />,
            icon: 'receipt',
            href: '/receipts',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Receipt,
              ability: SaleReceiptAction.View,
            },
          },
          {
            text: <T id={'sidebar.credit_notes'} />,
            icon: 'credit-card',
            href: '/credit-notes',
            type: ISidebarMenuItemType.Link,
          },
          {
            text: <T id={'sidebar.payments_received'} />,
            icon: 'payments',
            href: '/payments-received',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.PaymentReceive,
              ability: PaymentReceiveAction.View,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.new_tasks'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.new_estimate'} />,
            icon: 'plus-24',
            href: '/estimates/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Estimate,
              ability: SaleEstimateAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_invoice'} />,
            icon: 'plus-24',
            href: '/invoices/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Invoice,
              ability: SaleInvoiceAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_receipt'} />,
            icon: 'plus-24',
            href: '/receipts/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Receipt,
              ability: SaleReceiptAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_credit_note'} />,
            icon: 'plus-24',
            href: '/credit-notes/new',
            type: ISidebarMenuItemType.Link,
          },
          {
            text: <T id={'sidebar.new_payment_received'} />,
            icon: 'quick-payment-16',
            href: '/payment-received/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.PaymentReceive,
              ability: PaymentReceiveAction.Create,
            },
          },
        ],
      },
    ],
  },
  // ---------------
  // # Purchases
  // ---------------
  {
    text: <T id={'sidebar.purchases'} />,
    icon: 'shopping-cart',
    iconColor: '#f59e0b',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Purchases,
    children: [
      {
        text: <T id={'sidebar.purchases'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'bills'} />,
            icon: 'file-alt',
            href: '/bills',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Bill,
              ability: BillAction.View,
            },
          },
          {
            text: <T id={'sidebar_vendor_credits'} />,
            icon: 'credit-card',
            href: '/vendor-credits',
            type: ISidebarMenuItemType.Link,
          },
          {
            text: <T id={'payments_made'} />,
            icon: 'quick-payment-16',
            href: '/payments-made',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.PaymentMade,
              ability: PaymentMadeAction.View,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.new_tasks'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.new_purchase_invoice'} />,
            icon: 'plus-24',
            href: '/bills/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Bill,
              ability: BillAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_vendor_credit'} />,
            icon: 'plus-24',
            href: '/vendor-credits/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Bill,
              ability: BillAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_payment_made'} />,
            icon: 'quick-payment-16',
            href: '/payments-made/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.PaymentMade,
              ability: PaymentMadeAction.Create,
            },
          },
        ],
      },
    ],
  },
  // ---------------
  // # Contacts
  // ---------------
  {
    text: <T id={'sidebar.contacts'} />,
    icon: 'person',
    iconColor: '#34d399',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Contacts,
    children: [
      {
        text: <T id={'sidebar.contacts'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.customers'} />,
            icon: 'person',
            href: '/customers',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Customer,
              ability: CustomerAction.View,
            },
          },
          {
            text: <T id={'sidebar.vendors'} />,
            icon: 'case-16',
            href: '/vendors',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Vendor,
              ability: VendorAction.Create,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.new_tasks'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.new_customer'} />,
            icon: 'plus-24',
            href: '/customers/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Customer,
              ability: CustomerAction.Create,
            },
          },
          {
            text: <T id={'sidebar.new_vendor'} />,
            icon: 'plus-24',
            href: '/vendors/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Vendor,
              ability: VendorAction.Create,
            },
          },
        ],
      },
    ],
  },
  // ---------------
  // # Accounting
  // ---------------
  {
    text: <T id={'sidebar.accounting'} />,
    type: ISidebarMenuItemType.Group,
    children: [
      {
        text: <T id={'sidebar.financial'} />,
        icon: 'university',
        iconColor: '#a78bfa',
        type: ISidebarMenuItemType.Overlay,
        overlayId: ISidebarMenuOverlayIds.Financial,
        children: [
          {
            text: <T id={'sidebar.financial'} />,
            type: ISidebarMenuItemType.Group,
            children: [
              {
                text: <T id={'sidebar.accounts_chart'} />,
                icon: 'university',
                href: '/accounts',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Account,
                  ability: AccountAction.View,
                },
              },
              {
                text: 'Finanzas España · PGC / SEPA',
                icon: 'balance-scale',
                href: '/spain-finance',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.Report,
                  ability: ReportsAction.READ_BALANCE_SHEET,
                },
              },
              {
                text: <T id={'sidebar.manual_journals'} />,
                icon: 'reader-18',
                href: '/manual-journals',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.ManualJournal,
                  ability: ManualJournalAction.View,
                },
              },
              {
                text: <T id={'sidebar.transactions_locaking'} />,
                icon: 'lock',
                href: '/transactions-locking',
                type: ISidebarMenuItemType.Link,
              },
              {
                text: 'Tipos impositivos',
                icon: 'tag-16',
                href: '/tax-rates',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.TaxRate,
                  ability: TaxRateAction.View,
                },
              },
            ],
          },
          {
            text: <T id={'sidebar.new_tasks'} />,
            type: ISidebarMenuItemType.Group,
            children: [
              {
                text: <T id={'sidebar.make_journal_entry'} />,
                icon: 'plus-24',
                href: '/make-journal-entry',
                type: ISidebarMenuItemType.Link,
                permission: {
                  subject: AbilitySubject.ManualJournal,
                  ability: ManualJournalAction.Create,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  // ---------------
  // # Cashflow
  // ---------------
  {
    text: <T id={'sidebar.banking'} />,
    icon: 'account-balance',
    iconColor: '#22c55e',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Cashflow,
    children: [
      {
        text: <T id={'sidebar.banking'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.cash_bank_accounts'} />,
            icon: 'account-balance',
            href: '/cashflow-accounts',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Cashflow,
              ability: CashflowAction.View,
            },
          },
          {
            text: 'Reglas',
            icon: 'settings-18',
            href: '/bank-rules',
            type: ISidebarMenuItemType.Link,
          },
        ],
      },
      {
        text: <T id={'sidebar.new_tasks'} />,
        type: ISidebarMenuItemType.Group,
        divider: true,
        children: [
          {
            text: <T id={'sidebar.add_money_in'} />,
            icon: 'arrow-downward',
            href: '/cashflow-accounts',
            type: ISidebarMenuItemType.Dialog,
            dialogName: DialogsName.MoneyInForm,
            permission: {
              subject: AbilitySubject.Cashflow,
              ability: CashflowAction.Create,
            },
          },
          {
            text: <T id={'sidebar.add_money_out'} />,
            icon: 'arrow-upward',
            href: '/cashflow-accounts',
            type: ISidebarMenuItemType.Dialog,
            dialogName: DialogsName.MoneyOutForm,
            permission: {
              subject: AbilitySubject.Cashflow,
              ability: CashflowAction.Create,
            },
          },
          {
            text: <T id={'sidebar.add_cash_account'} />,
            icon: 'payments',
            href: '/cashflow-accounts',
            type: ISidebarMenuItemType.Dialog,
            dialogName: DialogsName.AccountForm,
            permission: {
              subject: AbilitySubject.Cashflow,
              ability: CashflowAction.Create,
            },
          },
          {
            text: <T id={'sidebar.add_bank_account'} />,
            icon: 'university',
            href: '/cashflow-accounts',
            type: ISidebarMenuItemType.Dialog,
            dialogName: DialogsName.AccountForm,
            permission: {
              subject: AbilitySubject.Cashflow,
              ability: CashflowAction.Create,
            },
          },
        ],
      },
    ],
  },
  // ---------------
  // # Expenses
  // ---------------
  {
    text: <T id={'sidebar.expenses'} />,
    icon: 'credit-card',
    iconColor: '#fb7185',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Expenses,
    children: [
      {
        text: <T id={'sidebar.expenses'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.expenses'} />,
            icon: 'credit-card',
            href: '/expenses',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Expense,
              ability: ExpenseAction.View,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.new_tasks'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.new_expense'} />,
            icon: 'plus-24',
            href: '/expenses/new',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Expense,
              ability: ExpenseAction.Create,
            },
          },
        ],
      },
    ],
  },
  // ---------------
  // # Reports
  // ---------------
  {
    text: <T id={'sidebar.reports'} />,
    icon: 'analytics',
    iconColor: '#38bdf8',
    type: ISidebarMenuItemType.Overlay,
    overlayId: ISidebarMenuOverlayIds.Reports,
    children: [
      {
        text: <T id={'sidebar.reports'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.balance_sheet'} />,
            icon: 'balance-scale',
            href: '/financial-reports/balance-sheet',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_BALANCE_SHEET,
            },
          },
          {
            text: <T id={'sidebar.trial_balance_sheet'} />,
            icon: 'check',
            href: '/financial-reports/trial-balance-sheet',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_TRIAL_BALANCE_SHEET,
            },
          },
          {
            text: <T id={'sidebar.journal'} />,
            icon: 'reader-18',
            href: '/financial-reports/journal-sheet',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_JOURNAL,
            },
          },
          {
            text: <T id={'sidebar.general_ledger'} />,
            icon: 'file-alt',
            href: '/financial-reports/general-ledger',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_GENERAL_LEDGET,
            },
          },
          {
            text: <T id={'sidebar.profit_loss_sheet'} />,
            icon: 'analytics',
            href: '/financial-reports/profit-loss-sheet',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_PROFIT_LOSS,
            },
          },
          {
            text: <T id={'sidebar.cash_flow_statement'} />,
            icon: 'account-balance',
            href: '/financial-reports/cash-flow',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_CASHFLOW_ACCOUNT_TRANSACTION,
            },
          },
          {
            text: <T id={'sidebar.ar_aging_Summary'} />,
            icon: 'time-24',
            href: '/financial-reports/receivable-aging-summary',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_AR_AGING_SUMMARY,
            },
          },
          {
            text: <T id={'sidebar.ap_aging_summary'} />,
            icon: 'time-24',
            href: '/financial-reports/payable-aging-summary',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_AP_AGING_SUMMARY,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.sales_purchases'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.purchases_by_items'} />,
            icon: 'shopping-cart',
            type: ISidebarMenuItemType.Link,
            href: '/financial-reports/purchases-by-items',
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_PURCHASES_BY_ITEMS,
            },
          },
          {
            text: <T id={'sidebar.sales_by_items'} />,
            icon: 'receipt',
            href: '/financial-reports/sales-by-items',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_SALES_BY_ITEMS,
            },
          },
          {
            text: <T id={'sidebar.customers_transactions'} />,
            icon: 'person',
            href: '/financial-reports/transactions-by-customers',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_CUSTOMERS_TRANSACTIONS,
            },
          },
          {
            text: <T id={'sidebar.vendors_transactions'} />,
            icon: 'case-16',
            href: '/financial-reports/transactions-by-vendors',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_VENDORS_TRANSACTIONS,
            },
          },
          {
            text: <T id={'sidebar.customers_balance_summary'} />,
            icon: 'analytics',
            href: '/financial-reports/customers-balance-summary',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_CUSTOMERS_SUMMARY_BALANCE,
            },
          },
          {
            text: <T id={'sidebar.vendors_balance_summary'} />,
            icon: 'analytics',
            href: '/financial-reports/vendors-balance-summary',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_VENDORS_SUMMARY_BALANCE,
            },
          },
        ],
      },
      {
        text: 'Impuestos',
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: 'Resumen de impuestos de ventas',
            icon: 'tag-16',
            href: '/financial-reports/sales-tax-liability-summary',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_SALES_TAX_LIABILITY_SUMMARY,
            },
          },
        ],
      },
      {
        text: <T id={'sidebar.inventory'} />,
        type: ISidebarMenuItemType.Group,
        children: [
          {
            text: <T id={'sidebar.inventory_item_details'} />,
            icon: 'archive',
            href: '/financial-reports/inventory-item-details',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_INVENTORY_ITEM_DETAILS,
            },
          },
          {
            text: <T id={'sidebar.inventory_valuation'} />,
            icon: 'analytics',
            href: '/financial-reports/inventory-valuation',
            type: ISidebarMenuItemType.Link,
            permission: {
              subject: AbilitySubject.Report,
              ability: ReportsAction.READ_INVENTORY_VALUATION_SUMMARY,
            },
          },
        ],
      },
    ],
  },
  {
    text: <T id={'sidebar.system'} />,
    type: ISidebarMenuItemType.Group,
    children: [
      {
        text: <T id={'sidebar.preferences'} />,
        icon: 'settings-18',
        iconColor: '#cbd5e1',
        href: '/preferences',
        type: ISidebarMenuItemType.Link,
        permission: {
          subject: AbilitySubject.Preferences,
          ability: PreferencesAbility.Mutate,
        },
      },
    ],
  },
];
