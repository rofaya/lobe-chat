import { DEFAULT_AGENT_META } from '@/const/meta';
import { DEFAULT_MODEL } from '@/const/settings/llm';
import { ModelProvider } from '@/libs/agent-runtime';
import { LobeAgentChatConfig, LobeAgentConfig, LobeAgentTTSConfig, DifyChatConfig } from '@/types/agent';
import { UserDefaultAgent } from '@/types/user/settings';

export const DEFAUTT_AGENT_TTS_CONFIG: LobeAgentTTSConfig = {
  showAllLocaleVoice: false,
  sttLocale: 'auto',
  ttsService: 'openai',
  voice: {
    openai: 'alloy',
  },
};

export const DEFAULT_AGENT_CHAT_CONFIG: LobeAgentChatConfig = {
  autoCreateTopicThreshold: 2,
  displayMode: 'chat',
  enableAutoCreateTopic: true,
  enableCompressHistory: true,
  enableHistoryCount: true,
  historyCount: 8,
};

export const DEFAULT_DIFY_CHAT_CONFIG: DifyChatConfig = {
  baseUrl: 'http://192.168.1.53/v1',
  enabled: false,
  token: '',
  userId: 'devTest',
};

export const DEFAULT_AGENT_CONFIG: LobeAgentConfig = {
  chatConfig: DEFAULT_AGENT_CHAT_CONFIG,
  dify: DEFAULT_DIFY_CHAT_CONFIG,
  model: DEFAULT_MODEL,
  params: {
    frequency_penalty: 0,
    presence_penalty: 0,
    temperature: 1,
    top_p: 1,
  },
  plugins: [],
  provider: ModelProvider.OpenAI,
  systemRole: '',
  tts: DEFAUTT_AGENT_TTS_CONFIG,
};

export const DEFAULT_AGENT: UserDefaultAgent = {
  config: DEFAULT_AGENT_CONFIG,
  meta: DEFAULT_AGENT_META,
};
