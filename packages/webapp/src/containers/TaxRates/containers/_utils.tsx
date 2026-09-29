import { Intent, Tag, Classes } from '@blueprintjs/core';
import clsx from 'classnames';
import type { TaxRate } from '@farocapital/sdk-ts';
import { Align } from '@/constants';

const codeAccessor = (taxRate: TaxRate) => {
  return (
    <Tag minimal={true} round={false} intent={Intent.NONE} interactive={true}>
      {taxRate.code}
    </Tag>
  );
};

const statusAccessor = (taxRate: TaxRate) => {
  return taxRate.active ? (
    <Tag round={false} intent={Intent.SUCCESS}>
      Activo
    </Tag>
  ) : (
    <Tag round={false} intent={Intent.NONE}>
      Inactivo
    </Tag>
  );
};

const nameAccessor = (taxRate: TaxRate) => {
  return (
    <>
      <span>{taxRate.name}</span>
      {!!taxRate.isCompound && (
        <span className={clsx(Classes.TEXT_MUTED)}>(Impuesto compuesto)</span>
      )}
    </>
  );
};

const DescriptionAccessor = (taxRate: TaxRate) => {
  return (
    <span className={clsx(Classes.TEXT_MUTED)}>{taxRate.description}</span>
  );
};

/**
 * Retrieves the tax rates table columns.
 */
export const useTaxRatesTableColumns = () => {
  return [
    {
      Header: 'Nombre',
      accessor: nameAccessor,
      width: 60,
    },
    {
      Header: 'Código',
      accessor: codeAccessor,
      width: 40,
    },
    {
      Header: 'Tipo',
      accessor: 'rateFormatted',
      align: Align.Right,
      width: 30,
    },
    {
      Header: 'Descripción',
      accessor: DescriptionAccessor,
      width: 100,
    },
    {
      Header: 'Estado',
      accessor: statusAccessor,
      width: 30,
      align: Align.Right,
    },
  ];
};
