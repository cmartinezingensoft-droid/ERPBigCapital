export const initialValues = {
  templateName: '',

  // Colors
  primaryColor: '#F37121',
  secondaryColor: '#F37121',

  // Company logo.
  showCompanyLogo: true,
  companyLogoUri: '',
  companyLogoKey: '',

  // Top details.
  showPaymentReceivedNumber: true,
  paymentReceivedNumberLabel: 'Payment number',

  // Payment number
  showPaymentReceivedFecha: true,
  paymentReceivedDateLabel: 'Date of Issue',

  // Customer address
  showCompanyAddress: true,

  // Company address
  showCustomerAddress: true,
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
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'paymentReceivedNumberLabel',
        enableKey: 'showPaymentReceivedNumber',
        label: 'N.º de pago',
      },
      {
        labelKey: 'paymentReceivedDateLabel',
        enableKey: 'showPaymentReceivedDate',
        label: 'Fecha de pago',
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
];
