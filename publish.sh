#!/bin/bash

# 默认值
IMAGE_NAME="lobe-chat-database-local:v1.53.0"  # 默认包含 tag
DOCKERFILE="Dockerfile.database"
USE_CN_MIRROR="true"
PROXY_URL="http://192.168.1.180:2088"  # 默认不使用代理
JFROG_REGISTRY="jfrog.jhlfund.com/docker"

# 解析参数
while getopts "i:f:c:p:r:" opt; do
  case $opt in
    i)
      IMAGE_NAME="$OPTARG"  # 允许用户指定包含 tag 的镜像名称
      ;;
    f)
      DOCKERFILE="$OPTARG"
      ;;
    c)
      USE_CN_MIRROR="$OPTARG"
      ;;
    p)
      PROXY_URL="$OPTARG"
      ;;
    r)
      JFROG_REGISTRY="$OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# 构建镜像
if [ -n "$PROXY_URL" ]; then
  docker build -t ${IMAGE_NAME} \
    -f ${DOCKERFILE} \
    --build-arg USE_CN_MIRROR="${USE_CN_MIRROR}" \
    --build-arg HTTP_PROXY="${PROXY_URL}" \
    --build-arg HTTPS_PROXY="${PROXY_URL}" \
    .
else
  docker build -t ${IMAGE_NAME} \
    -f ${DOCKERFILE} \
    --build-arg USE_CN_MIRROR="${USE_CN_MIRROR}" \
    .
fi

if [ $? -ne 0 ]; then
  echo "镜像 ${IMAGE_NAME} 构建失败."
  exit 1
fi

# 标记镜像 (如果 IMAGE_NAME 已经包含 tag，则不需要再次标记)
DOCKER_REPO="${JFROG_REGISTRY}/${IMAGE_NAME}"

# 检查 IMAGE_NAME 是否已经包含 tag
if [[ "$IMAGE_NAME" != *":"* ]]; then
  docker tag ${IMAGE_NAME} "${DOCKER_REPO}"

  if [ $? -ne 0 ]; then
    echo "镜像 ${IMAGE_NAME} 标记失败."
    exit 1
  fi
fi

# 登录 JFrog (如果需要)
if [ -n "$JFROG_USERNAME" ] && [ -n "$JFROG_PASSWORD" ]; then
  docker login -u "${JFROG_USERNAME}" -p "${JFROG_PASSWORD}" "${JFROG_REGISTRY}"
  if [ $? -ne 0 ]; then
    echo "登录 JFrog 失败."
    exit 1
  fi
fi

# 推送镜像
docker push "${DOCKER_REPO}"

if [ $? -eq 0 ]; then
  echo "镜像 ${DOCKER_REPO} 推送成功."
else
  echo "镜像 ${DOCKER_REPO} 推送失败."
  exit 1
fi

echo "镜像 ${IMAGE_NAME} 构建并推送完成."
