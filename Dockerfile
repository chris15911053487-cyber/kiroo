# ============================================
# 潜能星图 - 多阶段 Docker 构建
# ============================================

# ---------- 阶段1: 构建前端 ----------
FROM node:18-alpine AS frontend-builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 阶段2: 生产镜像 ----------
FROM node:18-alpine

# Puppeteer 需要的系统依赖
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk

# 设置 Chromium 路径供 puppeteer 使用
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

WORKDIR /app

# 复制后端依赖
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# 复制后端源代码
COPY server/ ./

# 安装 puppeteer（使用系统 Chromium）
RUN npm install puppeteer --omit=dev 2>/dev/null || true

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
