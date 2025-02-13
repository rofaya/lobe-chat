import { ModelProviderCard } from '@/types/llm';

// ref: https://platform.deepseek.com/api-docs/pricing
const Dify: ModelProviderCard = {
  chatModels: [
    {
      contextWindowTokens: 65_536,
      description: 'Dify Chatflow',
      displayName: 'DeepSeek R1',
      enabled: true,
      id: 'dify-application-test',
      pricing: {
        cachedInput: 1,
        currency: 'CNY',
        input: 4,
        output: 16,
      },
      releasedAt: '2025-01-20',
    },
  ],
  checkModel: 'deepseek-chat',
  description: 'Dify Applications',
  id: 'dify',
  modelList: { showModelFetcher: true },
  modelsUrl: 'https://platform.deepseek.com/api-docs/zh-cn/quick_start/pricing',
  name: 'Dify',
  settings: {
    proxyUrl: {
      placeholder: 'https://api.deepseek.com',
    },
    sdkType: 'openai',
    showModelFetcher: true,
  },
  url: 'https://deepseek.com',
};

export default Dify;
