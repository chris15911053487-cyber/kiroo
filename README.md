# AI 测评小助手

基于 React + TypeScript + Vite 的心理与职业测评 SPA 应用，通过 DeepSeek AI 生成个性化深度分析报告。

## 功能

- **5 套专业测评**：大五人格、MBTI 十六人格、气质类型、领导风格、职业兴趣（霍兰德）
- **两种评分模式**：累加型（维度得分）和类别型（频次统计）
- **AI 深度分析**：提交答卷后自动生成个性化分析报告和发展建议
- **响应式设计**：适配桌面端和移动端

## 技术栈

| 层面 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 6 |
| 样式 | Tailwind CSS 3 |
| 路由 | React Router 6 |
| 状态管理 | Context + useReducer |
| 测试 | Vitest + React Testing Library + MSW |
| 后端 | Node.js + Express |
| AI | DeepSeek Chat API |

## 项目结构

```
ai-assessment-assistant/
├── src/
│   ├── components/          # 通用组件
│   ├── context/             # 全局状态管理
│   ├── data/questionnaires/ # 测评 JSON 数据（5 套）
│   ├── lib/                 # 问卷加载、校验、评分引擎
│   ├── pages/               # 页面组件
│   ├── services/            # API 服务层
│   ├── test/                # 测试配置
│   └── types/               # TypeScript 类型定义
├── server/
│   ├── server.js            # Express 后端（代理 DeepSeek API）
│   ├── dist/                # 前端构建产物
│   └── .env.example         # 环境变量模板
├── vite.config.ts           # Vite 配置（含开发代理）
└── vitest.config.ts         # Vitest 测试配置
```

## 本地开发

```bash
# 安装依赖
npm install

# 启动前端开发服务器
npm run dev
```

开发模式下 Vite 自动将 `/api` 请求代理到 `http://localhost:3000`，因此需要同时启动后端服务。

```bash
# 在另一个终端启动后端（需先创建 server/.env）
cd server
npm install
node server.js
```

## 构建与部署

```bash
# 构建前端
npm run build

# 将产物复制到 server/dist/
cp -r dist server/dist/   # macOS / Linux
# xcopy dist server\dist\ /E /I /Y   # Windows

# 将整个 server/ 目录上传到服务器即可
```

## 服务器配置

在 `server/` 目录下创建 `.env` 文件：

```
DEEPSEEK_API_KEY=sk-你的key
PORT=3000
```

启动服务：

```bash
node server.js
```

服务监听 `0.0.0.0:3000`，同时托管 API 和前端静态文件。打开 `http://服务器IP:3000` 即可访问。

## 运行测试

```bash
npm test
```

## 添加新测评

在 `src/data/questionnaires/` 下创建 JSON 文件，遵循以下结构：

**累加型（additive）：**
```json
{
  "id": "my-test",
  "name": "测评名称",
  "category": "personality",
  "description": "简短描述（≤100字符）",
  "enabled": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "questions": [
    {
      "id": "q1",
      "sequence": 1,
      "text": "题目文字",
      "options": [
        { "id": "q1-a", "text": "选项A", "scores": { "dim1": 5 } }
      ]
    }
  ],
  "scoring_rule": {
    "type": "additive",
    "dimensions": [
      { "key": "dim1", "name": "维度名", "min": 2, "max": 10 }
    ]
  }
}
```

**类别型（categorical）：**
```json
{
  "scoring_rule": {
    "type": "categorical",
    "categories": [
      { "key": "type-a", "name": "类型A", "description": "描述" }
    ]
  }
}
```

选项中使用 `category` 字段代替 `scores` 字段。重启开发服务器后新测评自动加载。
