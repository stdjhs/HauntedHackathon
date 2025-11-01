# 发言高亮调试指南

## 🔍 问题定位步骤

### 第一步：打开浏览器开发者工具

1. 打开游戏页面
2. 按 `F12` 或右键 → 检查 → 打开开发者工具
3. 点击 **Console** 标签页

### 第二步：观察关键日志

在游戏中开始新的一局，然后观察控制台输出。你应该看到以下关键日志：

#### 🟢 正常情况的日志顺序：

1. **WebSocket连接建立**
   ```
   WebSocket连接已建立
   [WebSocket] 收到消息类型: connection_established
   ```

2. **游戏更新和玩家初始化**
   ```
   [WebSocket] 收到消息类型: game_update
   [玩家数据] 初始化玩家: ID=X, Name=XXX, Role=XXX
   [玩家数据] 总共初始化了 6 个玩家
   ```

3. **阶段变更**
   ```
   [WebSocket] 收到消息类型: phase_change
   [阶段变更] 阶段: debate, 轮数: 1
   [阶段变更] 进入发言阶段，等待发言
   ```

4. **发言处理（关键部分）**
   ```
   [WebSocket] 收到消息类型: debate_turn
   [WebSocket] 处理发言: {player_name: "XXX", dialogue: "XXX"}
   [发言处理] 收到发言消息: XXX
   [发言处理] 当前玩家列表: [{id: 1, name: "XXX"}, {id: 2, name: "YYY"}, ...]
   [发言高亮] 精确匹配成功: XXX (索引: X)
   [发言高亮] XXX (索引: X) 开始发言，头像应该亮起
   ```

#### 🔴 常见问题的日志表现：

**问题1: 玩家名称不匹配**
```
[发言处理] 收到发言消息: Hunyuan-A13B
[发言处理] 当前玩家列表: [{id: 1, name: "Hunyuan A13B"}, ...]
[发言高亮] 忽略大小写匹配成功: Hunyuan-A13B -> Hunyuan A13B (索引: 0)
```
或者：
```
[发言高亮] 未找到玩家: Hunyuan-A13B，玩家列表: ["Hunyuan A13B", "GLM 4.6", ...]
```

**问题2: 玩家数组未初始化**
```
[发言处理] 收到发言消息: XXX
[发言处理] 当前玩家列表: []
[发言高亮] 未找到玩家: XXX，玩家列表: []
```

**问题3: 未收到发言消息**
```
// 没有 [WebSocket] 收到消息类型: debate_turn 的日志
// 可能WebSocket连接有问题或后端消息发送失败
```

### 第三步：根据日志分析问题

#### 情况A: 看到了完整的日志链，但头像还是不亮

1. 检查 `ModelAvatar` 组件的 `isActive` 属性
2. 在浏览器开发者工具的 **Elements** 标签页中检查对应头像元素
3. 查看是否有 `border-amber-400` 等高亮样式类

#### 情况B: 玩家名称不匹配

如果看到：
```
[发言高亮] 未找到玩家: XXX，玩家列表: ["YYY", "ZZZ", ...]
```

**原因**: WebSocket消息中的玩家名称与前端玩家数组中的名称格式不一致

**解决方案**: 需要添加名称标准化处理

#### 情况C: 玩家数组为空

如果看到：
```
[发言处理] 当前玩家列表: []
```

**原因**: `game_update` 消息处理失败，玩家数据未正确初始化

**解决方案**: 需要检查 `handleGameUpdate` 函数

#### 情况D: 没有收到发言消息

如果看不到：
```
[WebSocket] 收到消息类型: debate_turn
```

**原因**:
1. WebSocket连接问题
2. 后端消息发送失败
3. 前端消息解析失败

**解决方案**: 检查WebSocket连接状态和消息格式

### 第四步：手动测试

如果自动定位困难，可以手动测试：

1. **在浏览器控制台中执行**：
   ```javascript
   // 检查当前玩家状态
   console.log('当前玩家:', window.players);
   console.log('当前发言者索引:', window.currentSpeaker);
   console.log('发言者名称:', window.currentSpeakerName);
   ```

2. **手动触发发言高亮**：
   ```javascript
   // 手动设置第一个玩家为发言者
   setCurrentSpeaker(0);
   ```

### 📋 问题报告模板

如果问题仍然存在，请提供以下信息：

1. **完整的控制台日志**（从游戏开始到发言阶段）
2. **网络面板的WebSocket消息**：
   - 打开 **Network** 标签页
   - 筛选 **WS** (WebSocket) 消息
   - 查看 `debate_turn` 类型的消息内容
3. **当前玩家列表和发言消息的对比**

### 🛠️ 临时解决方案

如果急需解决，可以手动修复：

1. **刷新页面**重新建立连接
2. **检查后端日志**确认消息发送成功
3. **在浏览器控制台手动设置发言者**测试头像高亮效果

---

## 💡 调试技巧

1. **使用 `console.table` 查看玩家数组**：
   ```javascript
   console.table(players);
   ```

2. **实时监控WebSocket消息**：
   ```javascript
   // 在控制台运行这段代码监控所有WebSocket消息
   const originalLog = console.log;
   console.log = function(...args) {
     if (args[0] && args[0].includes && args[0].includes('[WebSocket]')) {
       originalLog.apply(console, ['🔵', ...args]);
     } else {
       originalLog.apply(console, args);
     }
   };
   ```

3. **高亮显示当前发言者**：
   ```javascript
   // 检查DOM元素
   document.querySelectorAll('.ModelAvatar').forEach((el, index) => {
     if (index === currentSpeaker) {
       el.style.border = '3px solid red';
     }
   });
   ```