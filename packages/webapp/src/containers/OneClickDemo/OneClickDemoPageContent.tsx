// @ts-nocheck
import { Button, Intent, ProgressBar, Text } from '@blueprintjs/core';
import { useEffect, useState } from 'react';
import style from './OneClickDemoPage.module.scss';
import { Box, Stack } from '@/components';
import { FaroCapitalBrand } from '@/components/FaroCapitalBrand';
import { useJob } from '@/hooks/query';
import {
  useCreateOneClickDemo,
  useOneClickDemoSignin,
} from '@/hooks/query/oneclick-demo';

export function OneClickDemoPageContent() {
  const {
    mutateAsync: createOneClickDemo,
    isLoading: isCreateOneClickLoading,
  } = useCreateOneClickDemo();
  const {
    mutateAsync: oneClickDemoSignIn,
    isLoading: isOneclickDemoSigningIn,
  } = useOneClickDemoSignin();

  // Job states.
  const [demoId, setDemoId] = useState<string>('');
  const [buildJobId, setBuildJobId] = useState<string>('');
  const [isJobDone, setIsJobDone] = useState<boolean>(false);

  const {
    data: { running, completed },
  } = useJob(buildJobId, {
    refetchInterval: 2000,
    enabled: !isJobDone && !!buildJobId,
  });

  useEffect(() => {
    if (completed) {
      setIsJobDone(true);
    }
  }, [completed, setIsJobDone]);

  // One the job done request sign-in using the demo id.
  useEffect(() => {
    if (isJobDone) {
      oneClickDemoSignIn({ demoId }).then((res) => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isJobDone]);

  const handleCreateAccountBtnClick = () => {
    createOneClickDemo({})
      .then(({ data: { data } }) => {
        setBuildJobId(data?.build_job?.job_id);
        setDemoId(data?.demo_id);
      })
      .catch(() => {});
  };
  const isLoading = running || isOneclickDemoSigningIn;

  return (
    <Box className={style.root}>
      <Box className={style.inner}>
        <Stack align={'center'} spacing={40}>
          <FaroCapitalBrand size={46} />

          {isLoading && (
            <Stack align={'center'} spacing={15}>
              <ProgressBar stripes value={null} className={style.progressBar} />
              {isOneclickDemoSigningIn && (
                <Text className={style.waitingText}>
                  Estamos iniciando sesión en tu cuenta de demostración. Un momento...
                </Text>
              )}
              {running && (
                <Text className={style.waitingText}>
                  Estamos preparando el entorno temporal de demostración. Suele tardar unos segundos. No cierres ni actualices la página.
                </Text>
              )}
            </Stack>
          )}
        </Stack>

        {!isLoading && (
          <Button
            className={style.oneClickBtn}
            intent={Intent.NONE}
            onClick={handleCreateAccountBtnClick}
            loading={isCreateOneClickLoading}
          >
            Crear cuenta de demostración
          </Button>
        )}
      </Box>
    </Box>
  );
}
