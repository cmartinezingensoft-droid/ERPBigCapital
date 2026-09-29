import * as Yup from 'yup';

const Schema = Yup.object().shape({
  amount: Yup.string().required().label('Importe'),
  exchangeRate: Yup.string().required().label('Tipo de cambio'),
  transactionType: Yup.string().required().label('Tipo de transacción'),
  date: Yup.string().required().label('Fecha'),
  creditAccountId: Yup.string().required().label('Cuenta de crédito'),
  referenceNo: Yup.string().optional().label('N.º de referencia'),
  description: Yup.string().optional().label('Description'),
});

export const CreateCategorizeTransactionSchema = Schema;
