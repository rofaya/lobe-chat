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

const processDifyData = (buffer: string): DifyChunk | undefined => {
  console.log(buffer)

  // Remove the prefix `data:`
  if (buffer.startsWith('data:'))
    return JSON.parse(buffer.slice(5).trim()) as DifyChunk
  return JSON.parse(buffer.trim())
}

export const transformDifyStream = (buffer: Uint8Array): StreamProtocolChunk => {
  const decoder = new TextDecoder();
  const chunk = processDifyData(decoder.decode(buffer, { stream: true }));
  const id = chunk?.message_id ?? chunk?.task_id ?? chunk?.id;
  // Return empty block if error
  if (!chunk || !id)
    return {
      data: '',
      type: 'text',
    };
  let type: StreamProtocolChunk['type'] = 'text';
  let data: DifyChunk | string = chunk;
  switch (chunk.event) {
    case 'message_end': {
      type = 'stop';
      break;
    }
    case 'message': {
      type = 'text';
      data = chunk.answer ?? '';
      break;
    }
    case 'workflow_started': {
      type = 'tool_using';
      break;
    }
    case 'node_started': {
      type = 'thoughts';
      break;
    }
    case 'workflow_finished': {
      type = 'tool_using';
      break;
    }
    case 'node_finished': {
      type = 'thoughts';
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
