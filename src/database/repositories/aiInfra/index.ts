import { isEmpty } from 'lodash-es';
import pMap from 'p-map';

import { DEFAULT_MODEL_PROVIDER_LIST } from '@/config/modelProviders';
import { AiModelModel } from '@/database/server/models/aiModel';
import { AiProviderModel } from '@/database/server/models/aiProvider';
import { LobeChatDatabase } from '@/database/type';
import {
  AIChatModelCard,
  AiModelSourceEnum,
  AiProviderModelListItem,
  EnabledAiModel,
} from '@/types/aiModel';
import {
  AiProviderDetailItem,
  AiProviderListItem,
  AiProviderRuntimeState,
  EnabledProvider,
} from '@/types/aiProvider';
import { ProviderConfig, GlobalLLMProviderKey } from '@/types/user/settings';
import { merge, mergeArrayById } from '@/utils/merge';

type DecryptUserKeyVaults = (encryptKeyVaultsStr: string | null) => Promise<any>;

export class AiInfraRepos {
  private userId: string;
  private db: LobeChatDatabase;
  aiProviderModel: AiProviderModel;
  private readonly providerConfigs: Record<string, ProviderConfig>;
  aiModelModel: AiModelModel;

  constructor(
    db: LobeChatDatabase,
    userId: string,
    providerConfigs: Record<string, ProviderConfig>,
  ) {
    this.userId = userId;
    this.db = db;
    this.aiProviderModel = new AiProviderModel(db, userId);
    this.aiModelModel = new AiModelModel(db, userId);
    this.providerConfigs = providerConfigs;
  }

  /**
   * Calculate the final providerList based on the known providerConfig
   */
  getAiProviderList = async () => {
    const userProviders = await this.aiProviderModel.getAiProviderList();

    // 获取环境变量中的自定义顺序
    const customOrder = process.env.MODEL_PROVIDER_ORDER?.split(',').map((s) => s.trim()) || [];

    // 创建一个基于自定义顺序的映射，未指定的顺序值设为较大数
    const orderMap = new Map(
      DEFAULT_MODEL_PROVIDER_LIST.map((item) => {
        const customIndex = customOrder.indexOf(item.id as GlobalLLMProviderKey);
        // 如果在自定义顺序中找到，使用其索引值；否则使用一个较大的数（1000 + 原始索引）
        const order = customIndex !== -1 ? customIndex : 1000 + DEFAULT_MODEL_PROVIDER_LIST.indexOf(item);
        return [item.id, order];
      }),
    );

    const builtinProviders = DEFAULT_MODEL_PROVIDER_LIST.map((item) => ({
      description: item.description,
      enabled:
        userProviders.some((provider) => provider.id === item.id && provider.enabled) ||
        this.providerConfigs[item.id]?.enabled,
      id: item.id,
      name: item.name,
      source: 'builtin',
    })) as AiProviderListItem[];

    const mergedProviders = mergeArrayById(builtinProviders, userProviders);

    // 根据 orderMap 排序
    return mergedProviders.sort((a, b) => {
      const orderA = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const orderB = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
      return orderA - orderB;
    });
  };

  /**
   * used in the chat page. to show the enabled providers
   */
  getUserEnabledProviderList = async () => {
    const list = await this.getAiProviderList();
    return list
      .filter((item) => item.enabled)
      .sort((a, b) => a.sort! - b.sort!)
      .map(
        (item): EnabledProvider => ({
          id: item.id,
          logo: item.logo,
          name: item.name,
          source: item.source,
        }),
      );
  };

  /**
   * used in the chat page. to show the enabled models
   */
  getEnabledModels = async () => {
    const providers = await this.getAiProviderList();
    const enabledProviders = providers.filter((item) => item.enabled);

    const allModels = await this.aiModelModel.getAllModels();
    const userEnabledModels = allModels.filter((item) => item.enabled);

    const modelList = await pMap(
      enabledProviders,
      async (provider) => {
        const aiModels = await this.fetchBuiltinModels(provider.id);
        return (aiModels || [])
          .map<EnabledAiModel & { enabled?: boolean | null }>((item) => {
            const user = allModels.find((m) => m.id === item.id && m.providerId === provider.id);

            if (!user)
              return {
                ...item,
                abilities: item.abilities || {},
                providerId: provider.id,
              };

            return {
              abilities: !isEmpty(user.abilities) ? user.abilities : item.abilities || {},
              config: !isEmpty(user.config) ? user.config : item.config,
              contextWindowTokens:
                typeof user.contextWindowTokens === 'number'
                  ? user.contextWindowTokens
                  : item.contextWindowTokens,
              displayName: user?.displayName || item.displayName,
              enabled: typeof user.enabled === 'boolean' ? user.enabled : item.enabled,
              id: item.id,
              providerId: provider.id,
              settings: item.settings,
              sort: user.sort || undefined,
              type: item.type,
            };
          })
          .filter((i) => i.enabled);
      },
      { concurrency: 10 },
    );

    return [...modelList.flat(), ...userEnabledModels].sort(
      (a, b) => (a?.sort || -1) - (b?.sort || -1),
    ) as EnabledAiModel[];
  };

  getAiProviderRuntimeState = async (
    decryptor?: DecryptUserKeyVaults,
  ): Promise<AiProviderRuntimeState> => {
    const result = await this.aiProviderModel.getAiProviderRuntimeConfig(decryptor);

    const runtimeConfig = result;

    Object.entries(result).forEach(([key, value]) => {
      runtimeConfig[key] = merge(this.providerConfigs[key] || {}, value);
    });

    const enabledAiProviders = await this.getUserEnabledProviderList();

    const enabledAiModels = await this.getEnabledModels();

    return { enabledAiModels, enabledAiProviders, runtimeConfig };
  };

  getAiProviderModelList = async (providerId: string) => {
    const aiModels = await this.aiModelModel.getModelListByProviderId(providerId);

    const defaultModels: AiProviderModelListItem[] =
      (await this.fetchBuiltinModels(providerId)) || [];

    return mergeArrayById(defaultModels, aiModels) as AiProviderModelListItem[];
  };

  /**
   * use in the `/settings/provider/[id]` page
   */
  getAiProviderDetail = async (id: string, decryptor?: DecryptUserKeyVaults) => {
    const config = await this.aiProviderModel.getAiProviderById(id, decryptor);

    return merge(this.providerConfigs[id] || {}, config) as AiProviderDetailItem;
  };

  /**
   * Fetch builtin models from config
   */
  private fetchBuiltinModels = async (
    providerId: string,
  ): Promise<AiProviderModelListItem[] | undefined> => {
    try {
      const { default: providerModels } = await import(`@/config/aiModels/${providerId}`);

      // use the serverModelLists as the defined server model list
      const presetList = this.providerConfigs[providerId]?.serverModelLists || providerModels;
      return (presetList as AIChatModelCard[]).map<AiProviderModelListItem>((m) => ({
        ...m,
        enabled: m.enabled || false,
        source: AiModelSourceEnum.Builtin,
      }));
    } catch {
      // maybe provider id not exist
    }
  };
}
