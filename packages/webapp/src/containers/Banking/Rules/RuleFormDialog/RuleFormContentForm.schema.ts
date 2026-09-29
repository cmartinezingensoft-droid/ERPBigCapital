// @ts-nocheck
import * as Yup from 'yup';

const Schema = Yup.object().shape({
  name: Yup.string().required().label('Nombre de la regla'),
  applyIfAccountId: Yup.number().required().label('Aplicar a la cuenta'),
  applyIfTransactionType: Yup.string()
    .required()
    .label('Aplicar al tipo de transacción'),
  conditionsType: Yup.string().required().label('Tipo de condición'),
  assignCategory: Yup.string().required().label('Asignar a la categoría'),
  assignAccountId: Yup.string().required().label('Asignar a la cuenta'),
  conditions: Yup.array().of(
    Yup.object().shape({
      value: Yup.string().required().label('Valor'),
      comparator: Yup.string().required().label('Comparator'),
      field: Yup.string().required().label('Campo'),
    }),
  ),
});

export const CreateRuleFormSchema = Schema;
