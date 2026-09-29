import { TaxRateDetailsContentActionsBar } from './TaxRateDetailsContentActionsBar';
import { TaxRateDetailsContentBoot } from './TaxRateDetailsContentBoot';
import { TaxRateDetailsContentDetails } from './TaxRateDetailsContentDetails';
import { DrawerBody, DrawerHeaderContent } from '@/components';

interface TaxRateDetailsContentProps {
  name: string;
  taxRateId: number;
}

export function TaxRateDetailsContent({
  name,
  taxRateId,
}: TaxRateDetailsContentProps) {
  return (
    <TaxRateDetailsContentBoot taxRateId={taxRateId}>
      <DrawerHeaderContent name={name} title={'Detalles del tipo impositivo'} />
      <TaxRateDetailsContentActionsBar />

      <DrawerBody>
        <TaxRateDetailsContentDetails />
      </DrawerBody>
    </TaxRateDetailsContentBoot>
  );
}
