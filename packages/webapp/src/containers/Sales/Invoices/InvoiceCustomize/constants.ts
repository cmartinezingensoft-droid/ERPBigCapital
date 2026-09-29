export const MANAGE_LINK_URL = '/preferences/payment-methods';

export const initialValues = {
  templateName: '',

  // Colors
  primaryColor: '#F37121',
  secondaryColor: '#F37121',

  // Company logo.
  showCompanyLogo: true,
  companyLogoKey: '',
  companyLogoUri: '',

  // Top details.
  showInvoiceNumber: true,
  invoiceNumberLabel: 'Invoice number',

  // Issue date
  showDateIssue: true,
  dateIssueLabel: 'Date of Issue',

  // Due date.
  showDueFecha: true,
  dueDateLabel: 'Due Date',

  // Addresses
  showCustomerAddress: true,
  showCompanyAddress: true,
  billedToLabel: 'Billed To',

  // Entries
  itemNameLabel: 'Item',
  itemDescriptionLabel: 'Description',
  itemRateLabel: 'Rate',
  itemTotalLabel: 'Total',

  // Totals
  showSubtotal: true,
  subtotalLabel: 'Subtotal',

  // Discount
  showDiscount: true,
  discountLabel: 'Discount',

  showTaxes: true,

  showTotal: true,
  totalLabel: 'Total',

  paymentMadeLabel: 'Payment Made',
  showPaymentMade: true,

  // Due amount
  dueAmountLabel: 'Due Amount',
  showDueAmount: true,

  // Footer paragraphs.
  termsConditionsLabel: 'Terms & Conditions',
  showTermsConditions: true,

  // Statement
  statementLabel: 'Statement',
  showStatement: true,
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'invoiceNumberLabel',
        enableKey: 'showInvoiceNumber',
        label: 'N.º de factura',
      },
      {
        labelKey: 'dateIssueLabel',
        enableKey: 'showDateIssue',
        label: 'Fecha de emisión',
      },
      {
        labelKey: 'dueDateLabel',
        enableKey: 'showDueDate',
        label: 'Fecha de vencimiento',
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
      {
        labelKey: 'discountLabel',
        enableKey: 'showDiscount',
        label: 'Discount',
      },
      { enableKey: 'showTaxes', label: 'Taxes' },
      { labelKey: 'totalLabel', enableKey: 'showTotal', label: 'Total' },
      {
        labelKey: 'paymentMadeLabel',
        enableKey: 'showPaymentMade',
        label: 'Pago realizado',
      },
      {
        labelKey: 'dueAmountLabel',
        enableKey: 'showDueAmount',
        label: 'Importe pendiente',
      },
    ],
  },
  {
    label: 'Footer',
    fields: [
      {
        labelKey: 'termsConditionsLabel',
        enableKey: 'showTermsConditions',
        label: 'Terms & Conditions',
      },
      {
        labelKey: 'statementLabel',
        enableKey: 'showStatement',
        label: 'Statement',
        labelPlaceholder: 'Statement',
      },
    ],
  },
];
