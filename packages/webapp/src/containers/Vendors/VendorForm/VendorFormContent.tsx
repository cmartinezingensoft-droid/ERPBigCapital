import { Tab, Tabs } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useState } from 'react';
import { VendorFloatingActions } from './VendorFloatingActions';
import { VendorFormSections } from './VendorFormFields';
import { Card, Group } from '@/components';

const scrollToFormSection = (sectionId: string) => {
  const section = document.querySelector(`[data-section-id="${sectionId}"]`);
  const scrollContainer = document.querySelector('.Pane.vertical.Pane2');

  if (!section || !scrollContainer) {
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  const sectionRect = section.getBoundingClientRect();
  const containerRect = scrollContainer.getBoundingClientRect();
  const top =
    scrollContainer.scrollTop + sectionRect.top - containerRect.top - 20;

  scrollContainer.scrollTo({ top, behavior: 'smooth' });
};

export function VendorFormContent({
  onCancel: _onCancel,
}: {
  onCancel?: () => void;
}) {
  const [selectedTabId, setSelectedTabId] = useState('primary');

  const handleTabChange = (tabId: string) => {
    const sectionId = String(tabId);
    setSelectedTabId(sectionId);
    scrollToFormSection(sectionId);
  };

  return (
    <Card
      className={css`
        padding-bottom: 0 !important;
      `}
    >
      <Group
        verticalAlign={'top'}
        alignItems={'flex-start'}
        flexWrap={'nowrap'}
      >
        <Tabs
          selectedTabId={selectedTabId}
          onChange={handleTabChange}
          className={css`
            position: sticky;
            top: 20px;
          `}
          vertical
        >
          <Tab id={'primary'} title={'Datos básicos'} />
          <Tab id={'financial'} title={'Financial'} />
          <Tab id={'fiscal'} title={'Fiscalidad'} />
          <Tab id={'billingAddress'} title={'Dirección de facturación'} />
          <Tab id={'shippingAddress'} title={'Dirección de envío'} />
          <Tab id={'notes'} title={'Notes'} />
        </Tabs>
        <VendorFormSections />
      </Group>
      <VendorFloatingActions />
    </Card>
  );
}
