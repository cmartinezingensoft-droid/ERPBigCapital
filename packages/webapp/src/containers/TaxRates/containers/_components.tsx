import { Intent, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import type { TaxRate } from '@farocapital/sdk-ts';
import { Can, Icon } from '@/components';
import { AbilitySubject, TaxRateAction } from '@/constants/abilityOption';
import { safeCallback } from '@/utils';

interface TaxRatesTableActionsMenuProps {
  payload: {
    onEdit: (taxRate: TaxRate) => void;
    onDelete: (taxRate: TaxRate) => void;
    onViewDetails: (taxRate: TaxRate) => void;
    onActivate: (taxRate: TaxRate) => void;
    onInactivate: (taxRate: TaxRate) => void;
  };
  row: {
    original: TaxRate;
  };
}

/**
 * Tax rates table actions menu.
 * @returns {JSX.Element}
 */
export function TaxRatesTableActionsMenu({
  payload: { onEdit, onDelete, onViewDetails, onActivate, onInactivate },
  row: { original },
}: TaxRatesTableActionsMenuProps) {
  return (
    <Menu>
      <MenuItem
        icon={<Icon icon="reader-18" />}
        text={'Ver detalles'}
        onClick={safeCallback(onViewDetails, original)}
      />
      <Can I={TaxRateAction.Edit} a={AbilitySubject.TaxRate}>
        <MenuDivider />
        <MenuItem
          icon={<Icon icon="pen-18" />}
          text={'Editar tipo impositivo'}
          onClick={safeCallback(onEdit, original)}
        />
      </Can>
      <MenuDivider />
      {!original.active && (
        <MenuItem
          icon={<Icon icon="play-16" iconSize={16} />}
          text={'Activar tipo impositivo'}
          onClick={safeCallback(onActivate, original)}
        />
      )}
      {!!original.active && (
        <MenuItem
          icon={<Icon icon="pause-16" iconSize={16} />}
          text={'Desactivar tipo impositivo'}
          onClick={safeCallback(onInactivate, original)}
        />
      )}
      <Can I={TaxRateAction.Delete} a={AbilitySubject.TaxRate}>
        <MenuDivider />
        <MenuItem
          text={'Eliminar tipo impositivo'}
          intent={Intent.DANGER}
          onClick={safeCallback(onDelete, original)}
          icon={<Icon icon="trash-16" iconSize={16} />}
        />
      </Can>
    </Menu>
  );
}
