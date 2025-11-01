# 开发者文档

## 项目架构

### 代码组织

```
核心模块
├── ErrorHandler        # 错误处理系统
├── ResourceManager     # 资源管理器（防内存泄漏）
├── AudioManager        # 音效系统
├── LoadingManager      # 加载状态管理
├── UserGuide          # 用户引导系统
└── domCache           # DOM缓存优化
```

### 关键设计模式

#### 1. 配置驱动音效系统

音效系统采用配置驱动设计，避免代码重复：

```javascript
// 音效配置对象
getSoundConfig() {
    return {
        jumpscare: {
            type: 'single',
            waveType: 'sawtooth',
            frequencies: [...],
            gain: { start: 0.3, end: 0.01 },
            duration: 0.3
        }
    };
}

// 统一播放接口
playSound(type) {
    const config = this.getSoundConfig()[type];
    if (config.type === 'single') {
        this.createSingleSound(config);
    } else {
        this.createSequenceSound(config);
    }
}
```

#### 2. 资源管理器模式

自动追踪和清理所有资源：

```javascript
// 添加定时器
const timerId = ResourceManager.addTimer(setTimeout(...));

// 添加interval
const intervalId = ResourceManager.addInterval(setInterval(...));

// 添加事件监听器
ResourceManager.addListener(element, 'click', handler);

// 页面卸载时自动清理
window.addEventListener('beforeunload', () => {
    ResourceManager.cleanupAll();
});
```

#### 3. 错误边界模式

关键函数使用ErrorHandler包装：

```javascript
function criticalFunction() {
    return ErrorHandler.try(() => {
        // 业务逻辑
    }, '函数名称');
}
```

### 性能优化技巧

#### DOM缓存
```javascript
const domCache = {
    get(id) {
        if (!this[id]) {
            this[id] = document.getElementById(id);
        }
        return this[id];
    }
};
```

#### 节流优化
```javascript
const throttledUpdate = throttle(() => {
    // 频繁执行的操作
}, 100);
```

## API文档

### AudioManager

音效管理器，负责所有音频生成和播放。

#### 方法

**`init()`**
- 初始化Web Audio API
- 返回：Promise

**`playSound(type: string)`**
- 播放指定类型音效
- 参数：
  - `type`: 音效类型 ('jumpscare', 'select', 'hover'等)

**`toggle()`**
- 切换音效开关
- 返回：boolean (当前状态)

#### 支持的音效类型
- `jumpscare` - 惊吓音效
- `select` - 选择音效
- `hover` - 悬停音效
- `achievement` - 成就解锁
- `chase-start` / `chase-success` - 游戏音效
- 等17种音效...

### ResourceManager

资源管理器，防止内存泄漏。

#### 方法

**`addTimer(timerId: number)`**
- 注册setTimeout定时器
- 返回：timerId

**`addInterval(intervalId: number)`**
- 注册setInterval定时器
- 返回：intervalId

**`addListener(element, event, handler, options)`**
- 注册事件监听器
- 自动追踪以便清理

**`cleanupAll()`**
- 清理所有已注册资源
- 在页面卸载时自动调用

### ErrorHandler

统一错误处理系统。

#### 方法

**`log(error, context)`**
- 记录错误到控制台
- 参数：
  - `error`: 错误对象
  - `context`: 错误上下文描述

**`try(fn, context)`**
- 同步函数错误捕获
- 返回：函数执行结果或null

**`tryAsync(fn, context)`**
- 异步函数错误捕获
- 返回：Promise

## 数据结构

### 测试题目格式

```javascript
{
    question: "问题文本",
    answers: [
        { text: "选项A", type: "E" },
        { text: "选项B", type: "I" },
        { text: "🔍 隐藏线索", type: "clue" }
    ]
}
```

### MBTI人格类型

```javascript
{
    "INTJ": {
        name: "城堡中的暗黑君主",
        description: "详细描述...",
        traits: ["特质1", "特质2", ...],
        compatibility: "最佳拍档..."
    }
}
```

### 成就系统

```javascript
achievements = {
    achievementKey: {
        unlocked: false,
        name: '成就名称',
        desc: '成就描述',
        icon: '🎃'
    }
}
```

## 扩展开发

### 添加新音效

1. 在 `getSoundConfig()` 中添加配置：

```javascript
newSound: {
    type: 'single',  // 或 'sequence'
    waveType: 'sine',
    frequencies: [{ value: 440, time: 0 }],
    gain: { start: 0.1, end: 0.01 },
    duration: 0.2
}
```

2. 调用播放：
```javascript
audioManager.playSound('newSound');
```

### 添加新成就

1. 在 `achievements` 对象中定义：

```javascript
newAchievement: {
    unlocked: false,
    name: '成就名称',
    desc: '解锁条件描述',
    icon: '🏆'
}
```

2. 在合适位置解锁：
```javascript
unlockAchievement('newAchievement');
```

### 添加新测试题目

在 `questions` 数组中添加：

```javascript
{
    question: "你的新问题？",
    answers: [
        { text: "选项1", type: "E" },  // E/I/S/N/T/F/J/P
        { text: "选项2", type: "I" }
    ]
}
```

### 添加新人格类型

虽然MBTI固定16种，但可以自定义描述：

```javascript
personalityTypes["INTJ"] = {
    name: "新的角色名",
    description: "新的描述...",
    traits: ["新特质1", "新特质2"],
    compatibility: "新的匹配关系"
};
```

## 调试技巧

### 启用详细日志

在浏览器控制台中：

```javascript
// 查看所有音效配置
console.log(audioManager.getSoundConfig());

// 查看当前成就状态
console.log(achievements);

// 查看资源管理器状态
console.log(ResourceManager);
```

### 性能分析

```javascript
// 监控内存使用
console.memory

// 性能标记
performance.mark('start');
// ... 代码执行
performance.mark('end');
performance.measure('operation', 'start', 'end');
```

### 常见问题

**Q: 音效不播放？**
A: 检查浏览器是否支持Web Audio API，确保用户有交互操作后再播放。

**Q: 内存持续增长？**
A: 确保使用ResourceManager管理所有定时器和监听器。

**Q: 动画卡顿？**
A: 检查CSS选择器复杂度，减少重绘区域。

## 测试指南

### 手动测试检查清单

- [ ] 温和模式测试流程
- [ ] 标准模式测试流程
- [ ] 极限模式测试流程
- [ ] 音效开关功能
- [ ] 幽魂追逐游戏
- [ ] 符号破译游戏
- [ ] 线索收集（3个）
- [ ] 成就解锁
- [ ] 结果分享
- [ ] 移动端响应式
- [ ] 浏览器兼容性

### 浏览器兼容性

| 浏览器 | 最低版本 | 状态 |
|--------|----------|------|
| Chrome | 60+ | ✅ 完全支持 |
| Firefox | 55+ | ✅ 完全支持 |
| Safari | 11+ | ✅ 完全支持 |
| Edge | 79+ | ✅ 完全支持 |
| IE | - | ❌ 不支持 |

## 性能基准

### 加载性能
- 首屏渲染：< 1s
- 交互就绪：< 2s
- 总文件大小：~80KB (未压缩)

### 运行时性能
- FPS：稳定60fps
- 内存占用：< 50MB
- CPU占用：< 5%

## 版本历史

### v3.2.0 (2025-10-31)
- 重构音效系统
- 添加资源管理器
- 完善错误处理
- 添加开发工具链

### v3.1.1 (2025-10-31)
- 原始稳定版本

## 贡献者指南

### 提交代码前

1. 运行代码检查
```bash
npm run lint
npm run format:check
```

2. 确保无console警告

3. 测试所有主要功能

### 提交信息规范

```
<type>: <subject>

<body>

<footer>
```

**Type类型**:
- feat: 新功能
- fix: 修复bug
- refactor: 重构
- perf: 性能优化
- docs: 文档更新
- style: 代码格式
- test: 测试相关

**示例**:
```
feat: 添加新的音效类型

- 增加"神秘"音效配置
- 更新音效文档
- 添加使用示例

Closes #123
```

## 许可证

MIT License - 详见 LICENSE 文件
