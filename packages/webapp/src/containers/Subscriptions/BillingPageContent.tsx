// @ts-nocheck
import { Spinner, Text } from '@blueprintjs/core';
import { useBillingPageBoot } from './BillingPageBoot';
import styles from './BillingPageContent.module.scss';
import { Subscription } from './BillingSubscription';
import { Box, Group } from '@/components';

export function BillingPageContent() {
  const { isSubscriptionsLoading, subscriptions } = useBillingPageBoot();

  if (isSubscriptionsLoading || !subscriptions) {
    return <Spinner size={30} />;
  }

  return (
    <Box className={styles.root}>
      <Text>
        Paga solo por lo que necesitas. Todos los planes incluyen soporte al cliente 24/7.
      </Text>

      <Group style={{ marginTop: '2rem' }}>
        <Subscription />
      </Group>
    </Box>
  );
}
