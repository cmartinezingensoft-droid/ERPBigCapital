// @ts-nocheck
import React from 'react';
import { Link } from 'react-router-dom';
import { For, Icon } from '@/components';

import '@/style/pages/FinancialStatements/FinancialSheets.scss';
import { useFilterShortcutBoxesSection } from './components';

function ShortcutBox({ title, link, description, icon }) {
  return (
    <div className={'financial-reports__item'}>
      {icon && (
        <div className="financial-reports__item-icon" aria-hidden="true">
          <Icon icon={icon} iconSize={18} />
        </div>
      )}
      <Link className="title" to={link}>
        {title}
      </Link>
      <p className="desc">{description}</p>
    </div>
  );
}

function ShortcutBoxes({ sectionTitle, shortcuts }) {
  return (
    <div className="financial-reports__section">
      <div className="section-title">{sectionTitle}</div>
      <div className="financial-reports__list">
        <For render={ShortcutBox} of={shortcuts} />
      </div>
    </div>
  );
}

export function ShortcutBoxesSection({ section }) {
  const BoxSection = useFilterShortcutBoxesSection(section);
  return <For render={ShortcutBoxes} of={BoxSection} />;
}
