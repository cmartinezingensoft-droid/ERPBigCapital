import * as Yup from 'yup';

export const MatchingReconcileFormSchema = Yup.object().shape({
  type: Yup.string().required().label('Type'),
  date: Yup.string().required().label('Fecha'),
  amount: Yup.string().required().label('Importe'),
  memo: Yup.string().required().min(3).label('Memo'),
  referenceNo: Yup.string().label('Refernece #'),
  category: Yup.string().required().label('Categogry'),
});
