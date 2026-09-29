import { Tab, Tabs } from '@blueprintjs/core';
import React from 'react';
import { CategorizeTransactionContent } from '../CategorizeTransaction/drawers/CategorizeTransactionDrawer/CategorizeTransactionContent';
import styles from './CategorizeTransactionTabs.module.scss';
import { MatchingBankTransaction } from './MatchingTransaction';

export function CategorizeTransactionTabs() {
  const defaultSelectedTabId = 'categorize';

  return (
    <Tabs
      large
      renderActiveTabPanelOnly
      defaultSelectedTabId={defaultSelectedTabId}
      className={styles.tabs}
    >
      <Tab
        id="categorize"
        title="Categorizar transacción"
        panel={<CategorizeTransactionContent />}
      />
      <Tab
        id="matching"
        title="Transacción coincidente"
        panel={<MatchingBankTransaction />}
      />
    </Tabs>
  );
}
