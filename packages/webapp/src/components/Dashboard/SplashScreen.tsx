import * as R from 'ramda';
import FaroCapitalLoading from './FaroCapitalLoading';
import { withDashboard } from '@/containers/Dashboard/withDashboard';

interface SplashScreenProps {
  splashScreenLoading: boolean;
}

function SplashScreenComponent({ splashScreenLoading }: SplashScreenProps) {
  return splashScreenLoading ? <FaroCapitalLoading /> : null;
}

export const SplashScreen = R.compose(
  withDashboard(({ splashScreenLoading }) => ({
    splashScreenLoading,
  })),
)(SplashScreenComponent);
