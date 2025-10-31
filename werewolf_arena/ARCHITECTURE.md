# Werewolf Arena v2.0 架构文档

## 🏗️ 项目概览

Werewolf Arena 是一个基于AI的狼人杀游戏平台，使用大语言模型作为游戏玩家。项目采用现代化的微服务架构，提供实时游戏体验和丰富的交互功能。

## 🚀 快速开始

### 启动项目
```bash
# 克隆项目
git clone <repository-url>
cd werewolf_arena

# 启动服务（主启动脚本）
./scripts/start_v2.sh
```

启动后可访问：
- **游戏主页**: http://localhost:3000
- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/health

## 📁 项目结构

```
werewolf_arena/
├── scripts/
│   ├── start_v2.sh          # 🎯 主启动脚本
│   └── stop_v2.sh           # 停止脚本（自动生成）
├── backend/                 # 🔧 FastAPI后端服务
│   ├── src/
│   │   ├── api/            # API路由层
│   │   │   └── v1/         # API v1版本
│   │   │       ├── routes/ # 路由定义
│   │   │       └── schemas/ # 数据模型
│   │   ├── core/           # 🎮 游戏核心逻辑
│   │   │   ├── game/       # 游戏引擎
│   │   │   └── models/     # 数据模型
│   │   ├── services/       # 🤖 业务服务层
│   │   │   ├── llm/        # LLM客户端
│   │   │   └── game_manager/ # 游戏管理器
│   │   ├── config/         # ⚙️ 配置管理
│   │   └── utils/          # 工具函数
│   ├── tests/              # 单元测试
│   ├── requirements.txt    # Python依赖
│   ├── .env                # 环境变量
│   └── Dockerfile          # Docker配置
├── frontend/               # 🌐 Next.js前端应用
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   │   ├── page.tsx   # 首页
│   │   │   └── live/      # 游戏直播页面
│   │   ├── components/    # React组件
│   │   │   ├── ui/        # UI基础组件
│   │   │   └── game/      # 游戏相关组件
│   │   ├── lib/           # 🔧 工具库
│   │   │   ├── api/       # API客户端
│   │   │   ├── hooks/     # React Hooks
│   │   │   └── store/     # 状态管理
│   │   └── types/         # TypeScript类型定义
│   ├── public/            # 静态资源
│   ├── package.json       # Node.js依赖
│   └── Dockerfile         # Docker配置
├── shared/                # 🔄 前后端共享代码
│   └── types/             # 共享类型定义
├── logs/                  # 📝 日志文件目录
├── docs/                  # 📚 项目文档
└── README.md              # 项目说明
```

## 🛠️ 技术栈

### 后端 (FastAPI)
- **框架**: FastAPI 0.104+
- **Python版本**: Python 3.11+
- **服务器**: Uvicorn
- **异步**: asyncio, aiohttp
- **配置**: pydantic-settings
- **日志**: structlog
- **测试**: pytest

### 前端 (Next.js)
- **框架**: Next.js 14 (App Router)
- **UI库**: React 18
- **语言**: TypeScript 5.3+
- **样式**: TailwindCSS 3.3+
- **状态管理**: Zustand 4.4+
- **HTTP客户端**: Axios 1.6+
- **图标**: Lucide React

### 开发工具
- **容器化**: Docker, Docker Compose
- **代码质量**: ESLint, Prettier, TypeScript
- **测试**: Jest, React Testing Library
- **环境管理**: Python venv, npm

## 🔄 系统架构

### 整体架构图
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js       │    │   FastAPI       │    │   LLM APIs      │
│   Frontend      │◄──►│   Backend       │◄──►│   (外部服务)     │
│   (Port 3000)   │    │   (Port 8000)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   游戏状态存储    │
                       │   (内存 + 日志)   │
                       └─────────────────┘
```

### 数据流
1. **用户操作** → Next.js前端
2. **API请求** → FastAPI后端
3. **游戏逻辑** → Game Master引擎
4. **LLM调用** → 外部AI服务
5. **实时更新** → WebSocket推送到前端

## 🎮 核心功能模块

### 1. 游戏管理 (Game Management)
- **位置**: `backend/src/services/game_manager/`
- **功能**:
  - 游戏会话管理
  - 玩家状态跟踪
  - 游戏流程控制
  - 实时日志记录

### 2. LLM集成 (LLM Integration)
- **位置**: `backend/src/services/llm/`
- **功能**:
  - 多AI提供商支持
  - 模型配置管理
  - 异步API调用
  - 错误重试机制

### 3. 实时通信 (Real-time Communication)
- **位置**: `backend/src/api/v1/routes/websocket.py`
- **功能**:
  - WebSocket连接管理
  - 游戏状态实时推送
  - 玩家互动同步

### 4. 前端状态管理 (Frontend State)
- **位置**: `frontend/src/lib/store/`
- **功能**:
  - 游戏状态管理
  - UI状态同步
  - 数据缓存优化

## 🔌 API接口设计

### RESTful API端点
```
GET  /api/v1/games              # 获取游戏列表
POST /api/v1/games              # 创建新游戏
GET  /api/v1/games/{id}         # 获取游戏详情
DELETE /api/v1/games/{id}       # 删除游戏
GET  /api/v1/games/{id}/logs    # 获取游戏日志
GET  /api/v1/models             # 获取可用模型
GET  /api/v1/status             # 系统状态
```

### WebSocket事件
```typescript
// 客户端事件
game.join      // 加入游戏
game.leave     // 离开游戏
game.start     // 开始游戏
game.stop      // 停止游戏

// 服务端事件
game.state     // 游戏状态更新
game.message   // 游戏消息
game.error     // 错误信息
```

## 🎯 核心组件详解

### Game Master (游戏主控)
- **文件**: `backend/src/core/game/game_master.py`
- **职责**:
  - 控制游戏流程
  - 管理角色行为
  - 处理游戏事件
  - 判定游戏结果

### Player Model (玩家模型)
- **文件**: `backend/src/core/models/player.py`
- **职责**:
  - 玩家状态管理
  - 角色能力实现
  - AI决策逻辑

### LLM Client (AI客户端)
- **文件**: `backend/src/services/llm/client.py`
- **职责**:
  - 统一AI接口
  - 多提供商适配
  - 并发请求管理

## 🔧 配置管理

### 环境变量配置
```bash
# 后端配置 (backend/.env)
OPENAI_API_KEY=your_openai_key
GLM_API_KEY=your_glm_key
DEBUG=false
LOG_LEVEL=info

# 前端配置 (frontend/.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 游戏配置
- **文件**: `backend/src/config/timing_loader.py`
- **功能**: 游戏时间配置、角色设置等

## 🚀 部署方案

### Docker部署
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 生产环境
- **反向代理**: Nginx
- **进程管理**: Supervisor
- **监控**: 自定义健康检查
- **日志**: 结构化日志输出

## 🧪 测试策略

### 后端测试
```bash
cd backend
pytest tests/ -v --cov=src
```

### 前端测试
```bash
cd frontend
npm run test
npm run test:e2e  # 端到端测试
```

## 📊 性能优化

### 后端优化
- **异步处理**: 全面使用asyncio
- **连接池**: HTTP客户端连接复用
- **缓存机制**: 游戏状态内存缓存
- **批处理**: LLM请求批量优化

### 前端优化
- **代码分割**: Next.js自动代码分割
- **组件懒加载**: 动态导入大型组件
- **状态优化**: Zustand选择器优化
- **缓存策略**: API响应缓存

## 🔒 安全考虑

- **API密钥管理**: 环境变量隔离
- **CORS配置**: 跨域请求控制
- **输入验证**: Pydantic模型验证
- **错误处理**: 敏感信息过滤

## 📝 开发规范

### 代码风格
- **Python**: Black + isort + flake8
- **TypeScript**: Prettier + ESLint
- **提交信息**: Conventional Commits

### 分支策略
- `main`: 生产环境分支
- `develop`: 开发环境分支
- `feature/*`: 功能开发分支
- `hotfix/*`: 紧急修复分支

## 🔮 未来规划

### 短期目标
- [ ] 添加更多AI模型支持
- [ ] 实现游戏回放功能
- [ ] 优化实时性能
- [ ] 增强错误处理

### 长期目标
- [ ] 多房间游戏支持
- [ ] 用户账户系统
- [ ] 排行榜功能
- [ ] 移动端适配

---

*该文档描述了Werewolf Arena v2.0的完整架构设计，为开发和维护提供详细指导。*