import { Callout } from '@blueprintjs/core';
import { SubscriptionPlans } from './SubscriptionPlans';
import { SubscriptionPlansOfferChecks } from './SubscriptionPlansOfferChecks';
import { SubscriptionPlansPeriodSwitcher } from './SubscriptionPlansPeriodSwitcher';

/**
 * Billing plans.
 */
export function SubscriptionPlansSection() {
  return (
    <section>
      <Callout style={{ marginBottom: '2rem' }} icon={null}>
        Planes y precios sencillos. Paga solo por lo que necesitas. Todos los planes incluyen soporte 24/7. Los precios no incluyen los impuestos aplicables.
      </Callout>

      <SubscriptionPlansOfferChecks />
      <SubscriptionPlansPeriodSwitcher />
      <SubscriptionPlans />
    </section>
  );
}
