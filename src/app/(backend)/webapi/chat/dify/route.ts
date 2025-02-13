import { POST as UniverseRoute } from '../[provider]/route';

export const runtime = 'edge';

// 如果你有特定需要排除或偏好的 region，可以仿照其他 provider 定义一个 preferredRegion
export const preferredRegion = [
  // 可以空着，也可以根据需要自定义
];

export const POST = async (req: Request) => {
  return UniverseRoute(req, { params: Promise.resolve({ provider: 'dify' }) });
};
