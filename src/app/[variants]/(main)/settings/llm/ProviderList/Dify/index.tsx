'use client';

import { useTranslation } from 'react-i18next';

import { DifyProviderCard } from '@/config/modelProviders';

import { ProviderItem } from '../../type';
import Checker from './Checker';

export const useDifyProvider = (): ProviderItem => {
  const { t } = useTranslation('modelProvider');

  return {
    ...DifyProviderCard,
    checkerItem: {
      children: <Checker />,
      desc: t('ollama.checker.desc'),
      label: t('ollama.checker.title'),
      minWidth: undefined,
    },
    proxyUrl: {
      desc: t('ollama.endpoint.desc'),
      placeholder: 'http://192.168.1.53/v1',
      title: t('ollama.endpoint.title'),
    },
  };
};
