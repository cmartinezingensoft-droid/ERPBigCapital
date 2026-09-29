import { Tab } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import styled from 'styled-components';
import { InvoiceDetailActionsBar } from './InvoiceDetailActionsBar';
import { InvoiceDetailTab } from './InvoiceDetailTab';
import { InvoiceGLEntriesTable } from './InvoiceGLEntriesTable';
import { InvoicePaymentTransactionsTable } from './InvoicePaymentTransactions/InvoicePaymentTransactionsTable';
import { InvoiceVerifactuTab } from './InvoiceVerifactuTab';
import { InvoiceElectronicInvoicingTab } from './InvoiceElectronicInvoicingTab';
import { DrawerMainTabs } from '@/components';
import {
  PaymentReceiveAction,
  AbilitySubject,
} from '@/constants/abilityOption';
import { useAbilityContext } from '@/hooks/utils';

/**
 * Invoice details tabs.
 * @returns {React.JSX}
 */
function InvoiceDetailsTabs() {
  const ability = useAbilityContext();

  return (
    <DrawerMainTabs
      renderActiveTabPanelOnly={true}
      defaultSelectedTabId="details"
    >
      <Tab
        title={intl.get('overview')}
        id={'details'}
        panel={<InvoiceDetailTab />}
      />
      <Tab
        title={intl.get('journal_entries')}
        id={'journal_entries'}
        panel={<InvoiceGLEntriesTable />}
      />
      <Tab
        title={'VERI*FACTU'}
        id={'verifactu'}
        panel={<InvoiceVerifactuTab />}
      />
      <Tab
        title={'Factura electrónica'}
        id={'electronic_invoicing'}
        panel={<InvoiceElectronicInvoicingTab />}
      />
      {ability.can(
        PaymentReceiveAction.View,
        AbilitySubject.PaymentReceive,
      ) && (
        <Tab
          title={intl.get('payment_transactions')}
          id={'payment_transactions'}
          panel={<InvoicePaymentTransactionsTable />}
        />
      )}
    </DrawerMainTabs>
  );
}

/**
 * Invoice view detail.
 * @returns {React.JSX}
 */
export function InvoiceDetail() {
  return (
    <InvoiceDetailsRoot>
      <InvoiceDetailActionsBar />
      <InvoiceDetailsTabs />
    </InvoiceDetailsRoot>
  );
}

export const InvoiceDetailsRoot = styled.div``;
