import { StreamProtocolChunk, createCallbacksTransformer, createSSEProtocolTransformer } from '.';
import { ChatStreamCallbacks } from '../..';

interface DifyChunk {
  answer?: string;
  event: string;
  id?: string;
  message?: string;
  message_id?: string;
  task_id?: string;
}

function processDifyData(buffer: string): DifyChunk | undefined {
  // 先排除空字符串
  if (!buffer.trim()) return;

  // 将可能的多行内容拆分
  const lines = buffer.split('\n');
  let result: DifyChunk | undefined;

  for (let line of lines) {
    line = line.trim();
    
    // 忽略空行和 ping 事件
    if (!line || line === 'event: ping') continue;

    // 如果以 data: 开头，则去掉前缀 "data:"
    if (line.startsWith('data:')) {
      line = line.slice(5).trim();
      // 确保去掉前缀后还有内容
      if (!line) continue;
      
      // 处理特殊情况：data 可能被包裹在引号中
      if (line.startsWith('"') && line.endsWith('"')) {
        line = line.slice(1, -1);
      }
    }

    try {
      const parsed = JSON.parse(line);
      // 确保解析出的对象符合 DifyChunk 接口要求
      if (parsed && typeof parsed === 'object' && 'event' in parsed) {
        result = parsed as DifyChunk;
      }
    } catch (err) {
      // 打印错误日志，包含更详细的信息以便调试
      console.warn('[Dify] JSON parse error:', {
        error: err,
        line,
        rawBuffer: buffer,
      });
    }
  }

  return result;
}

export const transformDifyStream = (buffer: Uint8Array): StreamProtocolChunk => {
  const decoder = new TextDecoder();
  const chunk = processDifyData(decoder.decode(buffer, { stream: true }));

  // 如果解析失败或无法获取消息 id，则返回空文本
  const id = chunk?.message_id ?? chunk?.task_id ?? chunk?.id;
  if (!chunk || !id) {
    return {
      data: '',
      type: 'text',
    };
  }

  let type: StreamProtocolChunk['type'] = 'text';
  let data: DifyChunk | string = chunk;

  // 根据 Dify 返回的 event 字段进行类型映射
  switch (chunk.event) {
    case 'message':
    case 'agent_message': {
      // 普通消息或 Agent 消息
      type = 'text';
      data = chunk.answer ?? '';
      break;
    }
    case 'message_end': {
      // 消息结束
      type = 'stop';
      break;
    }
    case 'workflow_started': {
      // 流程开始
      type = 'tool_using';
      break;
    }
    case 'node_started': {
      // 节点已启动
      type = 'thoughts';
      break;
    }
    case 'workflow_finished': {
      // 流程结束
      type = 'tool_using';
      break;
    }
    case 'node_finished': {
      // 节点结束
      type = 'thoughts';
      break;
    }
    case 'error': {
      // 错误消息
      type = 'error';
      // 可根据需要保留原有结构，也可映射为字符串
      data = chunk;
      break;
    }
  }

  return {
    data,
    id,
    type,
  };
};

export const DifyStream = (stream: ReadableStream, callbacks?: ChatStreamCallbacks) => {
  return stream
    .pipeThrough(createSSEProtocolTransformer(transformDifyStream))
    .pipeThrough(createCallbacksTransformer(callbacks));
};
