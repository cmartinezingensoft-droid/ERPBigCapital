export const initialValues = {
  templateName: '',

  // Colors
  primaryColor: '#F37121',
  secondaryColor: '#F37121',

  // Company logo.
  showCompanyLogo: true,
  companyLogoKey: '',
  companyLogoUri: '',

  // Address
  showCustomerAddress: true,
  showCompanyAddress: true,
  billedToLabel: 'Billed To',

  // Entries
  itemNameLabel: 'Item',
  itemDescriptionLabel: 'Description',
  itemRateLabel: 'Rate',
  itemTotalLabel: 'Total',

  // Total
  showTotal: true,
  totalLabel: 'Total',

  // Subtotal
  showSubtotal: true,
  subtotalLabel: 'Subtotal',

  // Customer Note.
  showCustomerNote: true,
  customerNoteLabel: 'Customer Note',

  // Terms & Conditions
  showTermsConditions: true,
  termsConditionsLabel: 'Terms & Conditions',

  // Date issue.
  creditNoteDateLabel: 'Issue of Date',
  showCreditNoteFecha: true,

  // Credit Number.
  creditNoteNumberLabel: 'Credit Note #',
  showCreditNoteNumber: true,
};

export const fieldsGroups = [
  {
    label: 'Header',
    fields: [
      {
        labelKey: 'creditNoteDateLabel',
        enableKey: 'showCreditNoteDate',
        label: 'Fecha de emisión',
      },
      {
        labelKey: 'creditNoteNumberLabel',
        enableKey: 'showCreditNoteNumber',
        label: 'N.º de abono',
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
        label: 'Nota del cliente',
        labelPlaceholder: 'Customer Note',
      },
    ],
  },
];
