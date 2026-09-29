// @ts-nocheck
import { Alert, Intent } from '@blueprintjs/core';
import React from 'react';
import intl from 'react-intl-universal';
import { AppToaster } from '@/components';
import { withAlertActions } from '@/containers/Alert/withAlertActions';
import { withAlertStoreConnect } from '@/containers/Alert/withAlertStoreConnect';
import { useAssignPdfTemplateAsDefault } from '@/hooks/query/pdf-templates';
import { compose } from '@/utils';

/**
 * Mark default branding template alert.
 */
function MarkDefaultBrandingTemplateAlertInner({
  // #ownProps
  name,

  // #withAlertStoreConnect
  isOpen,
  payload: { templateId },

  // #withAlertActions
  closeAlert,
}) {
  const { mutateAsync: assignPdfTemplateAsDefault } =
    useAssignPdfTemplateAsDefault();

  const handleConfirmDelete = () => {
    assignPdfTemplateAsDefault({ templateId })
      .then(() => {
        AppToaster.show({
          message:
            'La plantilla de marca se ha marcado como predeterminada.',
          intent: Intent.SUCCESS,
        });
        closeAlert(name);
      })
      .catch((error) => {
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.DANGER,
        });
        closeAlert(name);
      });
  };

  const handleCancel = () => {
    closeAlert(name);
  };

  return (
    <Alert
      cancelButtonText={intl.get('cancel')}
      confirmButtonText={'Marcar como predeterminada'}
      intent={Intent.WARNING}
      isOpen={isOpen}
      onCancel={handleCancel}
      onConfirm={handleConfirmDelete}
    >
      <p>
        ¿Seguro que quieres marcar esta plantilla de marca como predeterminada?
      </p>
    </Alert>
  );
}

export const MarkDefaultBrandingTemplateAlert = compose(
  withAlertStoreConnect(),
  withAlertActions,
)(MarkDefaultBrandingTemplateAlertInner);
