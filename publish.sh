#!/bin/bash

# 默认值
IMAGE_NAME="lobe-chat-database-local:v1.53.0"  # 默认包含 tag
DOCKERFILE="Dockerfile.database"
USE_CN_MIRROR="true"
PROXY_URL="http://192.168.1.180:2088"  # 默认不使用代理
JFROG_REGISTRY="jfrog.jhlfund.com/docker"

# 构建镜像
docker build -t ${IMAGE_NAME} \
  -f ${DOCKERFILE} \
  --build-arg USE_CN_MIRROR="${USE_CN_MIRROR}" \
  --build-arg HTTP_PROXY="${PROXY_URL}" \
  --build-arg HTTPS_PROXY="${PROXY_URL}" \
  .

if [ $? -ne 0 ]; then
  echo "镜像 ${IMAGE_NAME} 构建失败."
  exit 1
fi

DOCKER_REPO="${JFROG_REGISTRY}/${IMAGE_NAME}"

# 标记仓库标签
docker tag ${IMAGE_NAME} "${DOCKER_REPO}"

# 推送标记版本到仓库
docker push "${DOCKER_REPO}"

if [ $? -eq 0 ]; then
  echo "镜像 ${DOCKER_REPO} 推送成功."
else
  echo "镜像 ${DOCKER_REPO} 推送失败."
  exit 1
fi

echo "镜像 ${IMAGE_NAME} 构建并推送完成."
