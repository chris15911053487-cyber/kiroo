# ============================================
# 潜能星图 - 多阶段 Docker 构建（国内镜像加速）
# ============================================

# ---------- 阶段1: 构建前端 ----------
FROM node:18-alpine AS frontend-builder

# npm 国内镜像
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 兰大模式构建参数（默认true）
ARG VITE_LZU_MODE=true
ENV VITE_LZU_MODE=${VITE_LZU_MODE}

COPY . .
RUN npm run build

# ---------- 阶段2: 生产镜像 ----------
FROM node:18-alpine

# 替换为阿里云 Alpine 镜像（加速 apk 下载）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 时区设置为北京时间
ENV TZ=Asia/Shanghai

# Puppeteer 需要的系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk \
    tzdata

# 设置 Chromium 路径供 puppeteer 使用
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# npm 国内镜像
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# 复制后端依赖
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# 复制后端源代码
COPY server/ ./

# 安装 puppeteer（使用系统 Chromium，跳过下载）
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install puppeteer --omit=dev 2>/dev/null || true

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
