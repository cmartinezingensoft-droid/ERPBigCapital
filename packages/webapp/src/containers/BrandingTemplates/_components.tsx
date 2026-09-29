// @ts-nocheck
import { Intent, Menu, MenuDivider, MenuItem } from '@blueprintjs/core';
import { safeCallback } from '@/utils';

/**
 * Templates table actions menu.
 */
export function ActionsMenu({
  row: { original },
  payload: { onDeleteTemplate, onEditTemplate, onMarkDefaultTemplate },
}) {
  return (
    <Menu>
      {!original.default && (
        <>
          <MenuItem
            text={'Marcar como predeterminada'}
            onClick={safeCallback(onMarkDefaultTemplate, original)}
          />
          <MenuDivider />
        </>
      )}
      <MenuItem
        text={'Editar plantilla'}
        onClick={safeCallback(onEditTemplate, original)}
      />
      <MenuDivider />
      <MenuItem
        text={'Eliminar plantilla'}
        intent={Intent.DANGER}
        onClick={safeCallback(onDeleteTemplate, original)}
      />
    </Menu>
  );
}
