import {
  Button,
  Classes,
  MenuItem,
  Menu,
  Popover,
  PopoverInteractionKind,
  Position,
  Divider,
} from '@blueprintjs/core';
import classNames from 'classnames';
import React from 'react';
import intl from 'react-intl-universal';
import { FormattedMessage as T } from '@/components';
import { Icon } from '@/components';

export interface DashboardViewItem {
  name?: React.ReactNode;
  slug?: string;
  [key: string]: unknown;
}

const defaultViewTranslationIds: Record<string, string> = {
  draft: 'draft',
  delivered: 'delivered',
  unpaid: 'unpaid',
  'partially-paid': 'partially_paid',
  paid: 'paid',
  opened: 'opened',
  overdue: 'overdue',
  approved: 'approved',
  rejected: 'rejected',
  invoiced: 'invoiced',
  expired: 'expired',
  closed: 'closed',
  published: 'published',
};

const getViewName = (view: DashboardViewItem) => {
  const translationId = view.slug
    ? defaultViewTranslationIds[view.slug]
    : undefined;

  return translationId ? intl.get(translationId) || view.name : view.name;
};

/**
 * Dashboard action views list.
 */
export function DashboardActionViewsList({
  resourceName,
  allMenuItem = false,
  allMenuItemText,
  views = [],
  onChange,
}: {
  resourceName: string;
  allMenuItem?: boolean;
  allMenuItemText?: React.ReactNode;
  views: any;
  onChange?: (view: any) => void;
}) {
  const handleClickViewItem = (view: any) => {
    onChange && onChange(view);
  };

  const viewsMenuItems = (views as DashboardViewItem[]).map((view) => (
    <MenuItem
      key={view.slug || String(view.name)}
      onClick={() => handleClickViewItem(view)}
      text={getViewName(view)}
    />
  ));

  const handleAllTabClick = () => {
    handleClickViewItem(null);
  };

  const content = (
    <Menu>
      {allMenuItem && (
        <>
          <MenuItem
            onClick={handleAllTabClick}
            text={allMenuItemText || <T id={'all'} />}
          />
          <Divider />
        </>
      )}
      {viewsMenuItems}
    </Menu>
  );

  return (
    <Popover
      content={content}
      minimal={true}
      interactionKind={PopoverInteractionKind.CLICK}
      position={Position.BOTTOM_LEFT}
    >
      <Button
        className={classNames(Classes.MINIMAL, 'button--table-views')}
        icon={<Icon icon="table-16" iconSize={16} />}
        text={<T id={'table_views'} />}
        rightIcon={'caret-down'}
      />
    </Popover>
  );
}
