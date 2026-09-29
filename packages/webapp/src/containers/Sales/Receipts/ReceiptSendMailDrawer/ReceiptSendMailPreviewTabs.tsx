import { Tab } from '@blueprintjs/core';
import { lazy, Suspense } from 'react';
import { SendMailViewPreviewTabs } from '../../Estimates/SendMailViewDrawer/SendMailViewPreviewTabs';

const ReceiptSendMailPreview = lazy(() =>
  import('./ReceiptSendMailPreview').then((module) => ({
    default: module.ReceiptSendMailPreview,
  })),
);
const ReceiptSendMailPdfPreview = lazy(() =>
  import('./ReceiptSendMailPdfPreview').then((module) => ({
    default: module.ReceiptSendMailPdfPreview,
  })),
);

export function ReceiptSendMailPreviewTabs() {
  return (
    <SendMailViewPreviewTabs>
      <Tab
        id={'payment-page'}
        title={'Página de pago'}
        panel={
          <Suspense>
            <ReceiptSendMailPreview />
          </Suspense>
        }
      />
      <Tab
        id="pdf-document"
        title={'Documento PDF'}
        panel={
          <Suspense>
            <ReceiptSendMailPdfPreview />
          </Suspense>
        }
      />
    </SendMailViewPreviewTabs>
  );
}
