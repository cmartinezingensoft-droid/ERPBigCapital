import React from 'react';
import { Card, H2, H4 } from '@blueprintjs/core';
import { FaroCapitalBrand } from '@/components/FaroCapitalBrand';

export function AboutPage() {
  return (
    <div style={{ maxWidth: 820, padding: '32px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <FaroCapitalBrand size={44} />
      </div>
      <H2>Acerca de FaroCapital</H2>
      <p>
        FaroCapital es una solución de gestión empresarial adaptada para su uso en España.
      </p>
      <Card elevation={0} style={{ marginTop: 24 }}>
        <H4>Software libre y licencia</H4>
        <p>
          FaroCapital se basa en el proyecto de software libre BigCapital y se distribuye
          conforme a la GNU Affero General Public License v3 (AGPLv3), incluyendo las
          modificaciones realizadas en esta versión.
        </p>
        <p>
          El texto completo de la licencia se incluye en el archivo <strong>LICENSE</strong>
          de las fuentes. El proyecto original puede consultarse en{' '}
          <a
            href="https://github.com/bigcapitalhq/bigcapital"
            target="_blank"
            rel="noreferrer"
          >
            su repositorio público
          </a>.
        </p>
      </Card>
    </div>
  );
}
