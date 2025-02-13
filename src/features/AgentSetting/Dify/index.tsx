'use client';

import { Form, Input, type ItemGroup } from '@lobehub/ui';
import { Switch } from 'antd';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FORM_STYLE } from '@/const/layoutTokens';
import { useUserStore } from '@/store/user';

import { useStore } from '../store';

const AgentMeta = memo(() => {
  const { t } = useTranslation('setting');

  const [setAgentConfig, agentConfig] = useStore((s) => [s.setAgentConfig, s.config]);

  const updateKeyVaultConfig = useUserStore((s) => s.updateKeyVaultConfig);

  const [difyBaseUrl, setDifyBaseUrl] = useState<string>('http://192.168.1.53/v1');
  const [difyToken, setDifyToken] = useState<string>('app-aslTt4Fgl5XWsHMY3CdEoPIh');
  const [difyUserId, setDifyUserId] = useState<string>('dev');
  const [difyEnabled, setDifyEnable] = useState<boolean>(true);

  useEffect(() => {
    setAgentConfig({
      dify: {
        baseUrl: difyBaseUrl,
        enabled: difyEnabled,
        token: difyToken,
        userId: difyUserId,
      },
      model: 'Dofy Workflow',
      provider: 'dify',
    });
    updateKeyVaultConfig('dify', {
      baseUrl: difyBaseUrl,
      token: difyToken,
      userId: difyUserId,
    });
  }, [difyBaseUrl, difyToken, difyUserId, difyEnabled]);

  const metaData: ItemGroup = {
    children: [
      {
        children: (
          <Input
            onChange={(event) => setDifyBaseUrl(event.currentTarget.value)}
            placeholder="http://192.168.1.53/v1"
            value={agentConfig.dify.baseUrl}
          />
        ),
        label: 'BaseUrl',
      },
      {
        children: (
          <Input
            onChange={(event) => setDifyToken(event.currentTarget.value)}
            value={agentConfig.dify.token}
          />
        ),
        label: 'Token',
      },
      {
        children: (
          <Input
            onChange={(event) => setDifyUserId(event.currentTarget.value)}
            value={agentConfig.dify.userId}
          />
        ),
        label: 'UserId',
      },
      {
        children: <Switch onChange={setDifyEnable} value={agentConfig.dify.enabled} />,
        label: 'BaseUrl',
      },
    ],
    title: t('settingAgent.title'),
  };

  return <Form items={[metaData]} itemsType={'group'} variant={'pure'} {...FORM_STYLE} />;
});

export default AgentMeta;
