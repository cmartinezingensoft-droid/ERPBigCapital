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
  showEstimateNumber: true,
  estimateNumberLabel: 'Estimate number',

  estimateDateLabel: 'Date of Issue',
  showEstimateFecha: true,

  showExpirationFecha: true,
  expirationDateLabel: 'Expiration Date',

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

  // Totals
  showSubtotal: true,
  subtotalLabel: 'Subtotal',

  showTotal: true,
  totalLabel: 'Total',

  // Statements
  showCustomerNote: true,
  customerNoteLabel: 'Customer Note',

  // Terms & Conditions
  showTermsConditions: true,
  termsConditionsLabel: 'Terms & Conditions',
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'estimateNumberLabel',
        enableKey: 'showEstimateNumber',
        label: 'N.º de presupuesto',
      },
      {
        labelKey: 'estimateDateLabel',
        enableKey: 'showEstimateDate',
        label: 'Fecha de emisión',
      },
      {
        labelKey: 'expirationDateLabel',
        enableKey: 'showExpirationDate',
        label: 'Fecha de caducidad',
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
    label: 'Footer',
    fields: [
      {
        labelKey: 'termsConditionsLabel',
        enableKey: 'showTermsConditions',
        label: 'Terms & Conditions',
      },
      {
        labelKey: 'customerNoteLabel',
        enableKey: 'showCustomerNote',
        label: 'Statement',
        labelPlaceholder: 'Statement',
      },
    ],
  },
];
