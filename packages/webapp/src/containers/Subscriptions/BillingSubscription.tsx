// @ts-nocheck
import { Button, Card, Classes, Intent, Text } from '@blueprintjs/core';
import clsx from 'classnames';
import { includes } from 'lodash';
import * as R from 'ramda';
import { withAlertActions } from '../Alert/withAlertActions';
import { withDrawerActions } from '../Drawer/withDrawerActions';
import { getSubscriptionStatusText } from './_utils';
import { useBillingPageBoot } from './BillingPageBoot';
import styles from './BillingSubscription.module.scss';
import { SubscriptionsDrawers } from './SubscriptionsDrawers';
import { Box, Group, Stack } from '@/components';
import { DRAWERS } from '@/constants/drawers';
import { useLemonSubscription } from '@/hooks/query/subscription';

function SubscriptionRoot({ openAlert, openDrawer }) {
  const { mainSubscription } = useBillingPageBoot();
  const lemonSubscription = useLemonSubscription('main');

  // Can't continue if the main subscription is not loaded.
  if (!mainSubscription) {
    return null;
  }
  const handleCancelSubBtnClick = () => {
    openAlert('cancel-main-subscription');
  };
  const handleResumeSubBtnClick = () => {
    openAlert('resume-main-subscription');
  };
  const handleUpdatePaymentMethod = () => {
    window.LemonSqueezy.Url.Open(lemonSubscription?.urls?.updatePaymentMethod);
  };
  // Handle upgrade button click.
  const handleUpgradeBtnClick = () => {
    openDrawer(DRAWERS.CHANGE_SUBSCARIPTION_PLAN);
  };

  return (
    <Card className={styles.root}>
      <SubscriptionsDrawers />
      <Stack spacing={6}>
        <h1 className={styles.title}>{mainSubscription.planName}</h1>

        <Group
          spacing={0}
          className={clsx(styles.period, {
            [Classes.INTENT_DANGER]: includes(
              ['on_trial', 'inactive'],
              mainSubscription.status,
            ),
            [Classes.INTENT_SUCCESS]: includes(
              ['active', 'canceled'],
              mainSubscription.status,
            ),
          })}
        >
          <Text className={styles.periodStatus}>
            {mainSubscription.statusFormatted}
          </Text>

          <SubscriptionStatusText subscription={mainSubscription} />
        </Group>
      </Stack>

      <Text className={styles.description}>
        Gestiona la contabilidad de tu empresa con automatización e informes para tomar decisiones con mayor rapidez.
      </Text>

      <Stack align="flex-start" spacing={8} className={styles.actions}>
        <Button
          minimal
          small
          inline
          intent={Intent.PRIMARY}
          onClick={handleUpgradeBtnClick}
        >
          Mejorar el plan
        </Button>

        {mainSubscription.canceled && (
          <Button
            minimal
            small
            inline
            intent={Intent.PRIMARY}
            onClick={handleResumeSubBtnClick}
          >
            Reanudar suscripción
          </Button>
        )}
        {!mainSubscription.canceled && (
          <Button
            minimal
            small
            inline
            intent={Intent.PRIMARY}
            onClick={handleCancelSubBtnClick}
          >
            Cancelar suscripción
          </Button>
        )}
        <Button
          minimal
          small
          inline
          intent={Intent.PRIMARY}
          onClick={handleUpdatePaymentMethod}
        >
          Cambiar método de pago
        </Button>
      </Stack>

      <Group position={'apart'} style={{ marginTop: 'auto' }}>
        <Group spacing={4}>
          <Text className={styles.priceAmount}>
            {mainSubscription.planPriceFormatted}
          </Text>

          {mainSubscription.planPeriod && (
            <Text className={styles.pricePeriod}>
              {mainSubscription.planPeriod === 'month'
                ? 'mo'
                : mainSubscription.planPeriod === 'year'
                  ? 'yearly'
                  : ''}
            </Text>
          )}
        </Group>

        <Box>
          {mainSubscription.canceled && (
            <Button
              intent={Intent.PRIMARY}
              onClick={handleResumeSubBtnClick}
              className={styles.subscribeButton}
            >
              Reanudar suscripción
            </Button>
          )}
        </Box>
      </Group>
    </Card>
  );
}

export const Subscription = R.compose(
  withAlertActions,
  withDrawerActions,
)(SubscriptionRoot);

function SubscriptionStatusText({ subscription }) {
  const text = getSubscriptionStatusText(subscription);

  if (!text) return null;

  return <Text className={styles.periodText}>{text}</Text>;
}
