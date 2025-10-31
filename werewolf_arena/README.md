# 🐺 狼人杀竞技场 - Werewolf Arena v2.0

一个基于大语言模型的狼人杀游戏框架，支持AI模型对战和实时观看。项目采用现代化架构，提供快速响应的Web界面和强大的API服务。

## 🚀 快速启动

### 一键启动（推荐）

```bash
# 启动v2.0版本
./scripts/start_v2.sh
```

### 手动启动

#### 1. 启动后端服务
```bash
cd backend
source ../venv/bin/activate  # Windows: venv\Scripts\activate

# 复制并配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入API密钥

# 安装依赖
pip install -r requirements.txt

# 启动后端
python3 -m uvicorn src.api.app:app --reload --host 0.0.0.0 --port 8000
```

#### 2. 启动前端服务（新终端）
```bash
cd frontend

# 安装依赖
npm install

# 启动前端
npm run dev
```

#### 3. 访问应用
- 🎮 **游戏主页**: http://localhost:3000
- 📚 **API文档**: http://localhost:8000/docs
- 📊 **健康检查**: http://localhost:8000/health

## 🏗️ 项目架构

### 技术栈
- **后端**: FastAPI + Python 3.11+ + Pydantic V2
- **前端**: Next.js 14 + TypeScript + Tailwind CSS + Zustand
- **通信**: REST API + WebSocket
- **部署**: 支持Docker容器化

### 目录结构
```
werewolf_arena/
├── scripts/
│   ├── start_v2.sh          # 🎯 主启动脚本
│   └── stop_v2.sh           # 停止脚本（自动生成）
├── backend/                 # 🔧 FastAPI后端服务
│   ├── src/
│   │   ├── api/            # API路由层
│   │   ├── core/           # 🎮 游戏核心逻辑
│   │   ├── services/       # 🤖 业务服务层
│   │   ├── config/         # ⚙️ 配置管理
│   │   └── utils/          # 工具函数
│   ├── tests/              # 单元测试
│   └── requirements.txt    # Python依赖
├── frontend/               # 🌐 Next.js前端应用
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React组件
│   │   ├── lib/           # 工具库和状态管理
│   │   └── types/         # TypeScript类型
│   └── package.json       # Node.js依赖
├── shared/                # 🔄 前后端共享代码
├── logs/                  # 📝 日志文件目录
├── docs/                  # 📚 项目文档
└── ARCHITECTURE.md        # 📋 详细架构文档
```

## ⚙️ 环境配置

### 1. 创建虚拟环境
```bash
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### 2. 配置API密钥
```bash
# 复制环境变量模板
cp backend/.env.example backend/.env

# 编辑配置文件，填入您的API密钥
# 支持的提供商：
# - OPENAI_API_KEY (GPT models)
# - GLM_API_KEY (智谱AI模型)
# - OPENROUTER_API_KEY (多模型聚合平台)
```

### 3. 安装依赖
```bash
# 后端依赖
cd backend && pip install -r requirements.txt && cd ..

# 前端依赖
cd frontend && npm install && cd ..
```

## 📚 API文档

启动服务后可访问：
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **健康检查**: http://localhost:8000/health

### 主要API端点
- `GET /api/v1/games/` - 游戏列表
- `POST /api/v1/games/start` - 启动游戏
- `GET /api/v1/models/` - 可用模型
- `GET /api/v1/status/health` - 服务状态
- `WebSocket /ws` - 实时游戏通信

### WebSocket事件
```typescript
// 客户端发送
game.join      // 加入游戏
game.start     // 开始游戏
game.stop      // 停止游戏

// 服务端推送
game.state     // 游戏状态更新
game.message   // 游戏消息
game.log       // 游戏日志
```

## 🎮 支持的模型

### OpenAI
- GPT-4, GPT-4o, GPT-3.5-turbo

### 智谱AI (GLM)
- GLM-4, GLM-4-air, GLM-4-flash

### OpenRouter (多模型聚合)
- Claude 3.5 Sonnet, Gemini, Llama等

## 🐳 Docker部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## 📖 详细文档

- [📋 架构文档](./ARCHITECTURE.md) - 完整的系统架构说明
- [🚀 部署指南](./DEPLOYMENT.md) - 生产环境部署方案
- [🔧 启动指南](./STARTUP_GUIDE.md) - 详细的启动说明
- [📊 实时日志指南](./REALTIME_LOGS_GUIDE.md) - 日志查看说明
- [🎮 直播显示指南](./LIVE_GAME_DISPLAY_GUIDE.md) - 游戏直播说明

## 🔧 开发指南

### 本地开发
```bash
# 启动开发环境
./scripts/start_v2.sh

# 代码格式化
cd backend && black . && isort .
cd frontend && npm run lint

# 运行测试
cd backend && pytest
cd frontend && npm test
```

### 项目结构说明

#### 后端模块
- **Game Master** (`backend/src/core/game/`) - 游戏主控逻辑
- **LLM Client** (`backend/src/services/llm/`) - AI模型集成
- **API Routes** (`backend/src/api/v1/routes/`) - REST API接口
- **WebSocket** (`backend/src/api/v1/routes/websocket.py`) - 实时通信

#### 前端模块
- **App Router** (`frontend/src/app/`) - Next.js页面路由
- **Game Components** (`frontend/src/components/game/`) - 游戏相关组件
- **UI Components** (`frontend/src/components/ui/`) - 基础UI组件
- **State Management** (`frontend/src/lib/store/`) - Zustand状态管理

## 🔬 研究背景

This repository provides code for [Werewolf Arena](https://arxiv.org/abs/2407.13943) - a framework for evaluating the social reasoning skills of large language models (LLMs) through the game of Werewolf.

## 🐛 故障排除

### 常见问题

**1. 端口被占用**
```bash
# 查看端口占用
lsof -i :8000
lsof -i :3000

# 杀死占用进程
lsof -ti :8000 | xargs kill -9
lsof -ti :3000 | xargs kill -9
```

**2. API密钥配置错误**
- 检查 `backend/.env` 文件是否正确配置
- 确认API密钥有效且有足够额度

**3. 依赖安装失败**
```bash
# 清理npm缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# Python依赖问题
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

### 日志查看
```bash
# 查看实时日志
tail -f backend_v2.log
tail -f frontend_v2.log

# 查看应用日志
cd backend && python -m uvicorn src.api.app:app --log-level debug
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目基于 Apache 2.0 许可证开源 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

**当前版本**: v2.0.0
**最后更新**: 2025-11-01
**状态**: ✅ v1代码已清理，v2架构正常运行

**注意**: v1.0版本代码已完全移除，项目专注于v2.0现代化架构。如需v1代码，请查看git历史记录。