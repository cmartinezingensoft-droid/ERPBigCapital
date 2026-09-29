export const initialValues = {
  templateName: '',

  // Colors
  primaryColor: '#F37121',
  secondaryColor: '#F37121',

  // Company logo.
  showCompanyLogo: true,
  companyLogoKey: '',
  companyLogoUri: '',

  // Receipt Number
  showReceiptNumber: true,
  receiptNumberLabel: 'Receipt number',

  // Receipt Date
  showReceiptFecha: true,
  receiptDateLabel: 'Date of Issue',

  // Customer address
  showCustomerAddress: true,

  // Company address
  showCompanyAddress: true,
  billedToLabel: 'Billed To',

  // Entries
  itemNameLabel: 'Item',
  itemDescriptionLabel: 'Description',
  itemRateLabel: 'Rate',
  itemTotalLabel: 'Total',

  // Subtotal
  showSubtotal: true,
  subtotalLabel: 'Subtotal',

  // Total
  showTotal: true,
  totalLabel: 'Total',

  // Terms & Conditions
  termsConditionsLabel: 'Terms & Conditions',
  showTermsConditions: true,

  // Customer Note
  customerNoteLabel: 'Customer Note',
  showCustomerNote: true,
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'receiptNumberLabel',
        enableKey: 'showReceiptNumber',
        label: 'N.º de recibo',
      },
      {
        labelKey: 'receiptDateLabel',
        enableKey: 'showReceiptDate',
        label: 'Fecha del recibo',
      },
      {
        enableKey: 'showCustomerAddress',
        labelKey: 'billedToLabel',
        label: 'Facturar a',
      },
      {
        enableKey: 'showCompanyAddress',
        label: 'Facturado por',
      },
    ],
  },
  {
    label: 'Totals',
    fields: [
      {
        labelKey: 'subtotalLabel',
        enableKey: 'showSubtotal',
        label: 'Subtotal',
      },
      { labelKey: 'totalLabel', enableKey: 'showTotal', label: 'Total' },
    ],
  },
  {
    label: 'Statements',
    fields: [
      {
        enableKey: 'showCustomerNote',
        labelKey: 'customerNoteLabel',
        label: 'Nota del cliente',
      },
      {
        enableKey: 'showTermsConditions',
        labelKey: 'termsConditionsLabel',
        label: 'Terms & Conditions',
      },
    ],
  },
];
