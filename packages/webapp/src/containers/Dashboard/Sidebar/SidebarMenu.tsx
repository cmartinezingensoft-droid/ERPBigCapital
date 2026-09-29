// @ts-nocheck
import { Intent, Menu } from '@blueprintjs/core';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { MenuItem, MenuItemLabel, Icon } from '@/components';
import { ISidebarMenuItemType } from '@/containers/Dashboard/Sidebar/interfaces';

function isPathActive(item, pathname) {
  if (!item.href) {
    return false;
  }
  if (item.matchExact || item.href === '/') {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function hasActiveDescendant(item, pathname) {
  if (isPathActive(item, pathname)) {
    return true;
  }
  return (item.children || []).some((child) => hasActiveDescendant(child, pathname));
}

/**
 * Sidebar menu item.
 * @returns {JSX.Element}
 */
function SidebarMenuItem({ item, index, level, pathname, children }) {
  const hasChildren = item.hasChildren || (item.children || []).length > 0;
  const isActive = isPathActive(item, pathname);
  const isBranchActive = hasChildren && hasActiveDescendant(item, pathname);
  const icon = item.icon ? (
    <Icon icon={item.icon} iconSize={16} />
  ) : undefined;

  return (
    <MenuItem
      key={index}
      className={[
        'sidebar-menu__item',
        `sidebar-menu__item--level-${level}`,
        hasChildren ? 'sidebar-menu__item--has-children' : '',
        isActive ? 'sidebar-menu__item--is-current' : '',
        isBranchActive ? 'sidebar-menu__item--is-branch-active' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        item.iconColor
          ? { '--sidebar-menu-icon-color': item.iconColor }
          : undefined
      }
      text={item.text}
      disabled={item.disabled}
      dropdownType={item.dropdownType || 'collapse'}
      onClick={item.onClick}
      active={isActive || isBranchActive}
      intent={Intent.NONE}
      icon={icon}
      hasSubmenu={hasChildren}
      callapseActive={isBranchActive}
    >
      {children}
    </MenuItem>
  );
}

SidebarMenuItem.ItemTypes = [
  ISidebarMenuItemType.Link,
  ISidebarMenuItemType.Overlay,
  ISidebarMenuItemType.Dialog,
];

/**
 * Detarmines which sidebar menu item type should display.
 * @returns {JSX.Element}
 */
function SidebarMenuItemComposer({ item, index, level = 0, pathname }) {
  const children = (item.children || []).map((child, childIndex) => (
    <SidebarMenuItemComposer
      key={`${index}-${childIndex}`}
      index={childIndex}
      item={child}
      level={level + 1}
      pathname={pathname}
    />
  ));

  // Link item type.
  return SidebarMenuItem.ItemTypes.indexOf(item.type) !== -1 ? (
    <SidebarMenuItem
      item={item}
      index={index}
      level={level}
      pathname={pathname}
    >
      {children}
    </SidebarMenuItem>
  ) : // Group item type.
  item.type === ISidebarMenuItemType.Group ? (
    <>
      <MenuItemLabel text={item.text} />
      {children}
    </>
  ) : null;
}

/**
 * Sidebar menu.
 * @returns {JSX.Element}
 */
export function SidebarMenu({ menu }) {
  const { pathname } = useLocation();

  return (
    <div>
      <Menu className="sidebar-menu">
        {menu.map((item, index) => (
          <SidebarMenuItemComposer
            key={index}
            index={index}
            item={item}
            pathname={pathname}
          />
        ))}
      </Menu>
    </div>
  );
}
