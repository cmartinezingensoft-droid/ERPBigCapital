import React from 'react';
import type { PreferencesMenuItem } from './types';
import { FormattedMessage as T } from '@/components';

export const PreferencesMenu: PreferencesMenuItem[] = [
  {
    text: <T id={'general'} />,
    disabled: false,
    href: '/preferences/general',
  },
  {
    text: 'Plantillas y marca',
    disabled: false,
    href: '/preferences/branding',
  },
  // {
  //   text: 'Facturación',
  //   href: '/preferences/billing',
  // },
  {
    text: <T id={'users'} />,
    href: '/preferences/users',
  },
  {
    text: 'Métodos de pago',
    href: '/preferences/payment-methods',
  },
  {
    text: <T id={'preferences.estimates'} />,
    href: '/preferences/estimates',
  },
  {
    text: <T id={'preferences.invoices'} />,
    href: '/preferences/invoices',
  },
  {
    text: 'Fiscalidad España · VERI*FACTU',
    href: '/preferences/verifactu',
  },
  {
    text: <T id={'preferences.receipts'} />,
    href: '/preferences/receipts',
  },
  {
    text: <T id={'preferences.creditNotes'} />,
    href: '/preferences/credit-notes',
  },
  {
    text: <T id={'currencies'} />,
    href: '/preferences/currencies',
  },
  {
    text: <T id={'branches.label'} />,
    href: '/preferences/branches',
  },
  {
    text: <T id={'warehouses.label'} />,
    href: '/preferences/warehouses',
  },
  {
    text: <T id={'accountant'} />,
    disabled: false,
    href: '/preferences/accountant',
  },
  {
    text: <T id={'items'} />,
    disabled: false,
    href: '/preferences/items',
  },
  // {
  //   text: 'Integraciones',
  //   disabled: false,
  //   href: '/preferences/integrations'
  // },
  {
    text: 'Claves API',
    disabled: false,
    href: '/preferences/api-keys',
  },
  {
    text: 'Acerca de FaroCapital',
    disabled: false,
    href: '/preferences/about',
  },
  // {
  //   text: <T id={'sms_integration.label'} />,
  //   disabled: false,
  //   href: '/preferences/sms-message',
  // },
];
