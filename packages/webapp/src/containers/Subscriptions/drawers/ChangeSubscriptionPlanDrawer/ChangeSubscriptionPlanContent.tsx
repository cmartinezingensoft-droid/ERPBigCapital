// @ts-nocheck
import { Callout, Classes } from '@blueprintjs/core';
import * as R from 'ramda';
import { ChangeSubscriptionPlans } from './ChangeSubscriptionPlans';
import { Box } from '@/components';
import { SubscriptionPlansPeriodSwitcher } from '@/containers/Setup/SetupSubscription/SubscriptionPlansPeriodSwitcher';

export function ChangeSubscriptionPlanContent() {
  return (
    <Box className={Classes.DRAWER_BODY}>
      <Box
        style={{
          maxWidth: 1024,
          margin: '0 auto',
          padding: '50px 20px 80px',
        }}
      >
        <Callout style={{ marginBottom: '2rem' }} icon={null}>
          Planes y precios sencillos. Paga solo por lo que necesitas. Todos los planes incluyen soporte 24/7. Los precios no incluyen los impuestos aplicables.
        </Callout>

        <SubscriptionPlansPeriodSwitcher />
        <ChangeSubscriptionPlans />
      </Box>
    </Box>
  );
}
