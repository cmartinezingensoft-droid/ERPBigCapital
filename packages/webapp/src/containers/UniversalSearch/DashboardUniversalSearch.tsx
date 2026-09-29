// @ts-nocheck
import {
  Button,
  InputGroup,
  Menu,
  MenuItem,
  Overlay,
  OverlayProps,
} from '@blueprintjs/core';
import { css } from '@emotion/css';
import { x } from '@xstyled/emotion';
import React from 'react';
import intl from 'react-intl-universal';
import { useHistory } from 'react-router-dom';
import { FormattedMessage as T, Icon } from '@/components';
import { PreferencesMenu } from '@/constants/preferencesMenu';
import { SidebarMenu } from '@/constants/sidebarMenu';
import { ISidebarMenuItemType } from '@/containers/Dashboard/Sidebar/interfaces';
import { useAbilityContext } from '@/hooks';
import { useFeatureCan } from '@/hooks/state';
import { withUniversalSearch } from './withUniversalSearch';
import { withUniversalSearchActions } from './withUniversalSearchActions';
import { compose } from '@/utils';

type ProgramSearchItem = {
  id: string;
  title: string;
  category: string;
  href: string;
  keywords: string;
  normalizedTitle: string;
  normalizedAliases: string[];
};

type MenuNode = {
  text?: React.ReactNode;
  title?: React.ReactNode;
  href?: string;
  disabled?: boolean;
  feature?: string;
  permission?: {
    subject: string;
    ability: string;
  };
  type?: string;
  children?: MenuNode[];
};

const overlayStyles = css`
  .bp4-overlay-appear,
  .bp4-overlay-enter {
    filter: blur(20px);
    opacity: 0.2;
  }
  .bp4-overlay-appear-active,
  .bp4-overlay-enter-active {
    filter: blur(0);
    opacity: 1;
    transition:
      filter 0.2s cubic-bezier(0.4, 1, 0.75, 0.9),
      opacity 0.2s cubic-bezier(0.4, 1, 0.75, 0.9);
  }
  .bp4-overlay-exit {
    filter: blur(0);
    opacity: 1;
  }
  .bp4-overlay-exit-active {
    filter: blur(20px);
    opacity: 0.2;
    transition:
      filter 0.2s cubic-bezier(0.4, 1, 0.75, 0.9),
      opacity 0.2s cubic-bezier(0.4, 1, 0.75, 0.9);
  }
`;

const containerStyles = css`
  position: fixed;
  filter: blur(0);
  opacity: 1;
  background-color: var(--color-universal-search-background);
  border-radius: 3px;
  box-shadow:
    0 0 0 1px rgba(16, 22, 26, 0.1),
    0 4px 8px rgba(16, 22, 26, 0.2),
    0 18px 46px 6px rgba(16, 22, 26, 0.2);
  left: calc(50% - 280px);
  top: 20vh;
  width: 560px;
  z-index: 20;

  .bp4-input-group {
    .bp4-icon {
      margin: 16px;
      color: var(--color-universal-search-icon);
    }
  }

  .bp4-input-group .bp4-input {
    border: 0;
    box-shadow: 0 0 0 0;
    height: 50px;
    line-height: 50px;
    font-size: 20px;
  }

  .bp4-input-group.bp4-large .bp4-input:not(:first-child) {
    padding-left: 50px !important;
  }

  .bp4-menu {
    border-top: 1px solid var(--color-universal-search-menu-border);
    max-height: calc(60vh - 20px);
    overflow: auto;
    padding: 6px;
  }

  .bp4-menu-item-label {
    max-width: 210px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const footerStyles = css`
  align-items: center;
  border-top: 1px solid var(--color-universal-search-footer-divider);
  color: var(--bp4-gray-500);
  display: flex;
  font-size: 12px;
  justify-content: space-between;
  padding: 10px 12px;
`;

const normalizeSearchText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const textToString = (value: React.ReactNode): string => {
  if (typeof value === 'string' || typeof value === 'number') {
    return String(value);
  }
  if (React.isValidElement(value)) {
    const id = value.props?.id;

    if (typeof id === 'string') {
      const translated = intl.get(id);
      return translated || id;
    }
    return textToString(value.props?.children);
  }
  if (Array.isArray(value)) {
    return value.map(textToString).filter(Boolean).join(' ');
  }
  return '';
};

const getProgramAlias = (href: string): string[] => {
  const aliases: Record<string, string[]> = {
    '/customers': ['mantenimiento de clientes', 'listado de clientes'],
    '/customers/new': ['nuevo cliente', 'alta de cliente'],
    '/vendors': ['mantenimiento de proveedores', 'listado de proveedores'],
    '/vendors/new': ['nuevo proveedor', 'alta de proveedor'],
    '/items': ['mantenimiento de articulos', 'listado de articulos', 'productos y servicios'],
    '/items/new': ['nuevo articulo', 'nuevo producto', 'nuevo servicio'],
    '/items/categories': ['categorias de articulos', 'categorias de productos'],
    '/warehouses-transfers': ['traspasos de almacen', 'transferencias de almacen'],
    '/warehouses-transfers/new': ['nuevo traspaso de almacen', 'nueva transferencia de almacen'],
    '/estimates': ['presupuestos de venta', 'estimaciones', 'listado de presupuestos'],
    '/estimates/new': ['nuevo presupuesto', 'nueva estimacion', 'nuevo presupuesto de venta'],
    '/invoices': ['facturas de venta', 'listado de facturas'],
    '/invoices/new': ['nueva factura', 'nueva factura de venta'],
    '/receipts': ['recibos de venta', 'listado de recibos'],
    '/receipts/new': ['nuevo recibo', 'nuevo recibo de venta'],
    '/credit-notes': ['abonos de clientes', 'notas de credito de clientes'],
    '/credit-notes/new': ['nuevo abono de cliente', 'nueva nota de credito'],
    '/payments-received': ['cobros', 'pagos recibidos'],
    '/payment-received/new': ['nuevo cobro', 'nuevo pago recibido'],
    '/bills': ['facturas de compra', 'listado de compras'],
    '/bills/new': ['nueva factura de compra', 'nueva factura de proveedor'],
    '/vendor-credits': ['abonos de proveedores', 'creditos de proveedores'],
    '/vendor-credits/new': ['nuevo abono de proveedor', 'nuevo credito de proveedor'],
    '/payments-made': ['pagos realizados', 'pagos a proveedores'],
    '/payments-made/new': ['nuevo pago', 'nuevo pago realizado', 'nuevo pago a proveedor'],
    '/expenses': ['gastos', 'listado de gastos'],
    '/expenses/new': ['nuevo gasto', 'alta de gasto'],
    '/accounts': ['plan de cuentas', 'cuadro de cuentas'],
    '/manual-journals': ['asientos manuales', 'diario manual'],
    '/make-journal-entry': ['nuevo asiento', 'nuevo diario manual'],
    '/cashflow-accounts': ['bancos', 'cuentas bancarias', 'tesoreria'],
    '/financial-reports': ['informes', 'reportes'],
    '/preferences': ['configuracion', 'ajustes'],
  };
  return aliases[href] || [];
};

const createSearchItem = (
  title: string,
  href: string,
  category: string,
): ProgramSearchItem => {
  const aliases = getProgramAlias(href);
  const normalizedTitle = normalizeSearchText(title);
  const normalizedAliases = aliases.map(normalizeSearchText);
  return {
    id: `${href}:${title}`,
    title,
    category,
    href,
    normalizedTitle,
    normalizedAliases,
    keywords: normalizeSearchText([title, category, href, ...aliases].join(' ')),
  };
};

const flattenMenuLinks = (
  items: MenuNode[],
  parents: string[] = [],
  canShowItem: (item: MenuNode) => boolean,
): ProgramSearchItem[] => {
  return items.flatMap((item) => {
    if (!canShowItem(item)) {
      return [];
    }
    const text = textToString(item.text || item.title);
    const nextParents =
      text && item.type !== ISidebarMenuItemType.Link
        ? [...parents, text]
        : parents;
    const children = item.children
      ? flattenMenuLinks(item.children, nextParents, canShowItem)
      : [];

    if (item.href && item.type === ISidebarMenuItemType.Link && text) {
      return [createSearchItem(text, item.href, parents.join(' / ')), ...children];
    }
    return children;
  });
};

const getPreferenceSearchItems = (
  canShowItem: (item: MenuNode) => boolean,
): ProgramSearchItem[] =>
  PreferencesMenu.filter((item) => item.href && canShowItem(item)).map((item) =>
    createSearchItem(
      textToString(item.text),
      item.href,
      textToString(<T id={'preferences'} />),
    ),
  );

const getProgramSearchItems = (
  canShowItem: (item: MenuNode) => boolean,
): ProgramSearchItem[] => {
  const items = [
    ...flattenMenuLinks(SidebarMenu as MenuNode[], [], canShowItem),
    ...getPreferenceSearchItems(canShowItem),
  ];
  const uniqueItems = new Map<string, ProgramSearchItem>();

  items.forEach((item) => {
    const key = `${item.href}:${item.title}`;
    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });
  return Array.from(uniqueItems.values());
};

const filterProgramSearchItems = (
  items: ProgramSearchItem[],
  query: string,
): ProgramSearchItem[] => {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return items.slice(0, 12);
  }
  const terms = normalizedQuery.split(/\s+/).filter(Boolean);

  const getScore = (item: ProgramSearchItem) => {
    const aliasExact = item.normalizedAliases.includes(normalizedQuery);
    const aliasStarts = item.normalizedAliases.some((alias) =>
      alias.startsWith(normalizedQuery),
    );
    const aliasContains = item.normalizedAliases.some((alias) =>
      alias.includes(normalizedQuery),
    );

    if (item.normalizedTitle === normalizedQuery) {
      return 1000;
    }
    if (aliasExact) {
      return 900;
    }
    if (item.normalizedTitle.startsWith(normalizedQuery)) {
      return 700;
    }
    if (aliasStarts) {
      return 650;
    }
    if (item.normalizedTitle.includes(normalizedQuery)) {
      return 500;
    }
    if (aliasContains) {
      return 450;
    }
    return 0;
  };

  return items
    .filter((item) => terms.every((term) => item.keywords.includes(term)))
    .sort((left, right) => getScore(right) - getScore(left))
    .slice(0, 20);
};

function DashboardUniversalSearchInner({
  globalSearchShow,
  closeGlobalSearch,
}: {
  globalSearchShow: boolean;
  closeGlobalSearch: () => void;
}) {
  const history = useHistory();
  const ability = useAbilityContext();
  const { featureCan } = useFeatureCan();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState(0);
  const canShowItem = React.useCallback(
    (item: MenuNode) => {
      if (item.disabled) {
        return false;
      }
      if (item.feature && !featureCan(item.feature)) {
        return false;
      }
      if (item.permission) {
        return ability.can(item.permission.ability, item.permission.subject);
      }
      return true;
    },
    [ability, featureCan],
  );
  const searchItems = React.useMemo(
    () => getProgramSearchItems(canShowItem),
    [canShowItem],
  );
  const filteredItems = React.useMemo(
    () => filterProgramSearchItems(searchItems, query),
    [query, searchItems],
  );

  React.useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  React.useEffect(() => {
    if (globalSearchShow) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [globalSearchShow]);

  const handleClose: OverlayProps['onClose'] = () => {
    closeGlobalSearch();
  };

  const handleClosed = () => {
    setQuery('');
    setActiveIndex(0);
  };

  const navigateToItem = (item?: ProgramSearchItem) => {
    if (!item) {
      return;
    }
    closeGlobalSearch();
    setQuery('');
    history.push(item.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeGlobalSearch();
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) =>
        filteredItems.length ? Math.min(index + 1, filteredItems.length - 1) : 0,
      );
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      navigateToItem(filteredItems[activeIndex]);
    }
  };

  return (
    <Overlay
      hasBackdrop={true}
      isOpen={globalSearchShow}
      className={overlayStyles}
      onClose={handleClose}
      onClosed={handleClosed}
    >
      <x.div className={containerStyles}>
        <InputGroup
          large={true}
          inputRef={inputRef}
          leftIcon={<Icon icon={'universal-search'} iconSize={20} />}
          placeholder={intl.get('universal_search.placeholder')}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
        />
        <Menu>
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <MenuItem
                key={item.id}
                active={index === activeIndex}
                text={item.title}
                label={item.category}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => navigateToItem(item)}
              />
            ))
          ) : (
            <MenuItem disabled={true} text={<T id={'no_results'} />} />
          )}
        </Menu>
        <x.div className={footerStyles}>
          <span>
            <T id={'quick_find'} />
          </span>
          <span>ENTER · ESC</span>
        </x.div>
      </x.div>
    </Overlay>
  );
}

export const DashboardUniversalSearch = compose(
  withUniversalSearchActions,
  withUniversalSearch(({ globalSearchShow }) => ({
    globalSearchShow,
  })),
)(DashboardUniversalSearchInner);
