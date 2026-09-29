import * as Yup from 'yup';

const getSchema = () =>
  Yup.object().shape({
    name: Yup.string().required().label('Nombre'),
    code: Yup.string().required().label('Código'),
    active: Yup.boolean().optional().label('Activo'),
    description: Yup.string().optional().label('Descripción'),
    rate: Yup.number()
      .min(0, 'Introduce un porcentaje igual o superior al 0%')
      .max(100, 'Introduce un porcentaje igual o inferior al 100%')
      .required()
      .label('Tipo'),
    isCompound: Yup.boolean().optional().label('Impuesto compuesto'),
    isNonRecoverable: Yup.boolean().optional().label('No deducible'),
    taxTerritory: Yup.string().oneOf(['iva', 'igic', 'ipsi']).optional(),
    fiscalRegime: Yup.string().oneOf(['standard', 'exempt', 'not_subject', 'reverse_charge']).optional(),
    aeatTaxCode: Yup.string().oneOf(['01', '02', '03', '05']).optional(),
    aeatRegimeKey: Yup.string().matches(/^(0[1-9]|1[0-8])$/).optional(),
    aeatOperationQualification: Yup.string().oneOf(['S1', 'S2', 'N1', 'N2', '']).optional(),
    aeatExemptionCause: Yup.string().oneOf(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', '']).optional(),
    spanishOperationType: Yup.string().oneOf([
      'domestic',
      'intra_community_goods_supply',
      'intra_community_goods_acquisition',
      'intra_community_service_supply',
      'intra_community_service_acquisition',
      'export',
      'import',
      'domestic_reverse_charge',
      'oss',
      'ioss',
      'igic_ipsi',
      'other',
    ]).optional(),
    ossScheme: Yup.string().oneOf(['union','non_union','import','']).optional(),
    confirmEdit: Yup.boolean().optional(),
  });

export const CreateTaxRateFormSchema = getSchema;
export const EditTaxRateFormSchema = getSchema;
