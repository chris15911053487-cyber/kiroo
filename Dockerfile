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

# 安装 Chromium + Puppeteer 依赖（用于 PDF 报告生成）
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-cjk

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

# 时区设置为北京时间
ENV TZ=Asia/Shanghai

# npm 国内镜像
RUN npm config set registry https://registry.npmmirror.com

WORKDIR /app

# 复制后端依赖
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev

# 复制后端源代码
COPY server/ ./

# SQLite 数据持久化目录
RUN mkdir -p /app/data

# 复制前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 复制 MIDS-F2 提示词模板（AI 报告生成运行时读取，修改即生效）
COPY --from=frontend-builder /app/docs/report-system/mids-f2/ ./docs/report-system/mids-f2/

# 复制问卷 JSON（用于降级获取条目文本 + 构建条目级分数）
COPY --from=frontend-builder /app/src/data/questionnaires/ ./src/data/questionnaires/

# 复制 Chart.js（本地替代CDN，避免被墙）
COPY --from=frontend-builder /app/node_modules/chart.js/dist/chart.umd.js ./dist/chart.umd.js

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "server.js"]
