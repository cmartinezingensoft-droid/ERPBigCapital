import {
  Button,
  Classes,
  Intent,
  Menu,
  MenuItem,
  NavbarDivider,
  NavbarGroup,
  Popover,
  PopoverInteractionKind,
  Position,
} from '@blueprintjs/core';
import { useTaxRateDetailsContext } from './TaxRateDetailsContentBoot';
import { AppToaster, Can, DrawerActionsBar, Icon } from '@/components';
import { AbilitySubject, TaxRateAction } from '@/constants/abilityOption';
import { DialogsName } from '@/constants/dialogs';
import {
  withAlertActions,
  WithAlertActionsProps,
} from '@/containers/Alert/withAlertActions';
import {
  withDialogActions,
  WithDialogActionsProps,
} from '@/containers/Dialog/withDialogActions';
import { withDrawerActions } from '@/containers/Drawer/withDrawerActions';
import {
  useActivateTaxRate,
  useInactivateTaxRate,
} from '@/hooks/query/tax-rates';
import { compose } from '@/utils';

interface TaxRateDetailsContentActionsBarInnerProps
  extends Pick<WithDialogActionsProps, 'openDialog'>,
    Pick<WithAlertActionsProps, 'openAlert'> {}

/**
 * Tax rate details content actions bar.
 * @returns {JSX.Element}
 */
function TaxRateDetailsContentActionsBarInner({
  openDialog,
  openAlert,
}: TaxRateDetailsContentActionsBarInnerProps) {
  const { taxRateId, taxRate } = useTaxRateDetailsContext();

  const { mutateAsync: activateTaxRateMutate } = useActivateTaxRate();
  const { mutateAsync: inactivateTaxRateMutate } = useInactivateTaxRate();

  // Handle edit tax rate.
  const handleEditTaxRate = () => {
    openDialog(DialogsName.TaxRateForm, { id: taxRateId });
  };
  // Handle delete tax rate.
  const handleDeleteTaxRate = () => {
    openAlert('tax-rate-delete', { taxRateId });
  };
  // Handle activate tax rate.
  const handleActivateTaxRate = () => {
    activateTaxRateMutate(taxRateId)
      .then(() => {
        AppToaster.show({
          message: 'El tipo impositivo se ha activado correctamente.',
          intent: Intent.SUCCESS,
        });
      })
      .catch(() => {
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.DANGER,
        });
      });
  };
  // Handle inactivate tax rate.
  const handleInactivateTaxRate = () => {
    inactivateTaxRateMutate(taxRateId)
      .then(() => {
        AppToaster.show({
          message: 'El tipo impositivo se ha desactivado correctamente.',
          intent: Intent.SUCCESS,
        });
      })
      .catch(() => {
        AppToaster.show({
          message: 'Se ha producido un error.',
          intent: Intent.DANGER,
        });
      });
  };

  return (
    <DrawerActionsBar>
      <NavbarGroup>
        <Can I={TaxRateAction.Edit} a={AbilitySubject.TaxRate}>
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="pen-18" />}
            text={'Editar tipo impositivo'}
            onClick={handleEditTaxRate}
          />
        </Can>
        <Can I={TaxRateAction.Delete} a={AbilitySubject.Item}>
          <NavbarDivider />
          <Button
            className={Classes.MINIMAL}
            text={'Eliminar'}
            icon={<Icon icon={'trash-16'} iconSize={16} />}
            intent={Intent.DANGER}
            onClick={handleDeleteTaxRate}
          />
        </Can>

        <Can I={TaxRateAction.Edit} a={AbilitySubject.TaxRate}>
          <NavbarDivider />
          <Popover
            minimal={true}
            interactionKind={PopoverInteractionKind.CLICK}
            position={Position.BOTTOM_LEFT}
            modifiers={{
              offset: { offset: '0, 4' },
            }}
            content={
              <Menu>
                {!taxRate?.active && (
                  <MenuItem
                    text={'Activar tipo impositivo'}
                    onClick={handleActivateTaxRate}
                  />
                )}
                {!!taxRate?.active && (
                  <MenuItem
                    text={'Desactivar tipo impositivo'}
                    onClick={handleInactivateTaxRate}
                  />
                )}
              </Menu>
            }
          >
            <Button
              icon={<Icon icon="more-vert" iconSize={16} />}
              minimal={true}
            />
          </Popover>
        </Can>
      </NavbarGroup>
    </DrawerActionsBar>
  );
}

export const TaxRateDetailsContentActionsBar = compose(
  withDrawerActions,
  withDialogActions,
  withAlertActions,
)(TaxRateDetailsContentActionsBarInner);
