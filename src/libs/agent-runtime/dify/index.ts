import urlJoin from 'url-join';

import { LobeRuntimeAI } from '../BaseAI';
import { AgentRuntimeErrorType } from '../error';
import { ChatCompetitionOptions, ChatStreamPayload, ModelProvider } from '../types';
import { AgentRuntimeError } from '../utils/createError';
import { StreamingResponse } from '../utils/response';
import { DifyStream } from '../utils/streams/dify';

export interface DifyParams {
  baseUrl: string;
  conversation_id?: string;
  token?: string;
  userId: string;
}

export class LobeDify implements LobeRuntimeAI {
  difyParams: DifyParams;

  constructor({ baseUrl, token, userId, conversation_id }: Partial<DifyParams>) {
    if (!(userId && token))
      throw AgentRuntimeError.createError(AgentRuntimeErrorType.InvalidProviderAPIKey);

    this.difyParams = {
      baseUrl: baseUrl ?? 'http://192.168.1.53/v1',
      conversation_id,
      token,
      userId,
    };

    console.log("LobeDify 初始化", this.difyParams)
  }

  async chat(payload: ChatStreamPayload, options?: ChatCompetitionOptions) {
    const { messages } = payload;
    // Get the last message as query
    const query = messages.at(-1);
    if (!query) {
      throw new Error('[Dify]: No query');
    }

    let textQuery = '';
    if (typeof query.content === 'string') {
      textQuery = query.content;
    } else {
      throw new Error('[Dify]: Unsupported user message type');
    }

    const chatMessagePayload = {
      auto_generate_name: true,
      conversation_id: this.difyParams?.conversation_id ?? '',
      files: [],
      inputs: [],
      query: textQuery,
      response_mode: 'streaming',
      user: this.difyParams.userId,
    }

    console.log("Pending chatMessagePayload", chatMessagePayload);

    const response = await fetch(urlJoin(this.difyParams.baseUrl, '/chat-messages'), {
      body: JSON.stringify(chatMessagePayload),

      // signal: options?.signal,
      headers: {
        'Authorization': `Bearer ${this.difyParams.token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });


    if (!response.body || !response.ok) {
      throw AgentRuntimeError.chat({
        error: {
          status: response.status,
          statusText: response.statusText,
        },
        errorType: AgentRuntimeErrorType.ProviderBizError,
        provider: ModelProvider.Dify,
      });
    }

    const [prod, _] = response.body.tee();

    return StreamingResponse(DifyStream(prod), { headers: options?.headers });
  }
}

export default LobeDify;
