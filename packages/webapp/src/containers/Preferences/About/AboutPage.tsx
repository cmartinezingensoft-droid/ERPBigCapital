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
          conforme a la GNU Affero General Public License v3 o posterior (AGPLv3+),
          incluyendo las modificaciones realizadas en esta versión.
        </p>
        <p>
          El texto completo de la licencia se incluye en el archivo <strong>LICENSE</strong>.
          Los avisos de origen y cambios se incluyen en <strong>NOTICE</strong>. El proyecto
          original puede consultarse en{' '}
          <a
            href="https://github.com/bigcapitalhq/bigcapital"
            target="_blank"
            rel="noreferrer"
          >
            su repositorio público
          </a>.
        </p>
        <p>
          Si esta instalación se ofrece a usuarios por red, esos usuarios deben poder
          acceder al código fuente correspondiente de la versión que están usando, sin
          coste, por un medio estándar o habitual.
        </p>
      </Card>
    </div>
  );
}
