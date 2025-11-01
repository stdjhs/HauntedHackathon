import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, ScrollArea } from "@/components/ui";
import ModelAvatar from "@/components/ModelAvatar";
import GameInfo from "@/components/GameInfo";
import GameProgress from "@/components/GameProgress";
import { WebSocketMessageFormatter, FormattedMessage } from "@/lib/websocket-formatter";
import { ArrowLeft, MessageCircle, Zap, Moon, Sun, Users, Skull } from "lucide-react";

interface Player {
  id: number;
  name: string;
  role: string;
  status: "alive" | "eliminated";
  votes: number;
}

const LiveGamePage = () => {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();

  const [godMode] = useState<"inside" | "outside">("outside");
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(-1); // 初始状态为-1，表示没有活跃发言者
  const [currentSpeakerName, setCurrentSpeakerName] = useState<string>("等待发言");
  const [gamePhase, setGamePhase] = useState<string>("准备中");
  const [gamePhaseType, setGamePhaseType] = useState<string>("等待");
  const [gamePhaseIcon, setGamePhaseIcon] = useState<string>("⏳");
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState<string>("");
  const [historySpeeches, setHistorySpeeches] = useState<Array<{name: string, content: string}>>([]);
  const [wsMessages, setWsMessages] = useState<FormattedMessage[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // 初始化WebSocket连接
  useEffect(() => {
    if (!sessionId) return;

    const wsUrl = `ws://localhost:8000/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket连接已建立");
      setWsConnection(ws);
      const connectionMessage = WebSocketMessageFormatter.formatConnectionMessage("WebSocket连接已建立");
      setWsMessages(prev => [...prev, connectionMessage]);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error("解析WebSocket消息失败:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket错误:", error);
      const errorMessage = WebSocketMessageFormatter.formatErrorMessage("连接错误");
      setWsMessages(prev => [...prev, errorMessage]);
    };

    ws.onclose = () => {
      console.log("WebSocket连接已关闭");
      setWsConnection(null);
      const closeMessage = WebSocketMessageFormatter.formatCloseMessage();
      setWsMessages(prev => [...prev, closeMessage]);
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]);

  // 处理WebSocket消息
  const handleWebSocketMessage = (data: any) => {
    console.log(`[WebSocket] 收到消息类型: ${data.type}`, data);

    // 使用消息格式化器格式化消息
    const formattedMessage = WebSocketMessageFormatter.formatMessage(data);

    if (formattedMessage) {
      // 添加消息到历史
      setWsMessages(prev => [...prev, formattedMessage]);

      // 同时处理游戏状态更新逻辑
      const { type, data: messageData } = data;

      switch (type) {
        case "phase_change":
          console.log(`[WebSocket] 处理阶段变更:`, messageData);
          handlePhaseChange(messageData);
          break;
        case "debate_turn":
          console.log(`[WebSocket] 处理发言:`, messageData);
          handleDebateTurn(messageData);
          break;
        case "vote_cast":
          console.log(`[WebSocket] 处理投票:`, messageData);
          handleVoteCast(messageData);
          break;
        case "night_action":
          console.log(`[WebSocket] 处理夜晚行动:`, messageData);
          handleNightAction(messageData);
          break;
        case "game_update":
          console.log(`[WebSocket] 处理游戏更新:`, messageData);
          handleGameUpdate(messageData);
          break;
        default:
          console.log(`[WebSocket] 未处理的消息类型: ${type}`);
      }
    } else {
      console.warn(`[WebSocket] 消息格式化失败:`, data);
    }
  };

  // 处理阶段变更
  const handlePhaseChange = (data: any) => {
    const { phase, round_number } = data;
    console.log(`[阶段变更] 阶段: ${phase}, 轮数: ${round_number}`);
    setCurrentRound(round_number);

    // 重置发言者状态（除非是发言阶段）
    if (phase !== "debate") {
      console.log(`[阶段变更] 重置发言者状态，因为不是发言阶段`);
      setCurrentSpeaker(-1); // 设置为-1表示没有活跃发言者
      setCurrentSpeakerName("等待发言");
      setCurrentSpeech("");
    } else {
      console.log(`[阶段变更] 进入发言阶段，等待发言`);
      setCurrentSpeakerName("等待发言");
      setCurrentSpeech("");
    }

    let phaseText = "";
    let phaseType = "";
    let phaseIcon = "";

    switch (phase) {
      case "night":
        phaseText = "天黑了，请闭眼";
        phaseType = "夜晚";
        phaseIcon = "🌙";
        break;
      case "day":
        phaseText = "天亮了，请睁眼";
        phaseType = "白天";
        phaseIcon = "☀️";
        break;
      case "debate":
        phaseText = "发言阶段";
        phaseType = "讨论";
        phaseIcon = "💬";
        break;
      case "voting":
        phaseText = "投票环节";
        phaseType = "投票";
        phaseIcon = "🗳️";
        break;
      default:
        phaseText = `阶段: ${phase}`;
        phaseType = "未知";
        phaseIcon = "❓";
    }

    setGamePhase(phaseText);
    setGamePhaseType(phaseType);
    setGamePhaseIcon(phaseIcon);
  };

  // 处理发言
  const handleDebateTurn = (data: any) => {
    const { player_name, dialogue } = data;

    console.log(`[发言处理] 收到发言消息: ${player_name}`);
    console.log(`[发言处理] 当前玩家列表:`, players.map(p => ({ id: p.id, name: p.name })));

    // 更新历史发言记录
    setHistorySpeeches(prev => [...prev.slice(-4), { name: player_name, content: dialogue }]);

    // 实时更新当前发言者姓名和内容
    setCurrentSpeakerName(player_name);
    setCurrentSpeech(dialogue);

    // 改进的玩家查找逻辑：支持多种匹配方式
    let playerIndex = -1;

    // 1. 首先尝试精确匹配名称
    playerIndex = players.findIndex(p => p.name === player_name);
    if (playerIndex !== -1) {
      console.log(`[发言高亮] 精确匹配成功: ${player_name} (索引: ${playerIndex})`);
    } else {
      // 2. 尝试忽略大小写匹配
      playerIndex = players.findIndex(p =>
        p.name.toLowerCase().trim() === player_name.toLowerCase().trim()
      );
      if (playerIndex !== -1) {
        console.log(`[发言高亮] 忽略大小写匹配成功: ${player_name} -> ${players[playerIndex].name} (索引: ${playerIndex})`);
      } else {
        // 3. 尝试部分匹配（包含关系）
        playerIndex = players.findIndex(p =>
          p.name.includes(player_name) || player_name.includes(p.name)
        );
        if (playerIndex !== -1) {
          console.log(`[发言高亮] 部分匹配成功: ${player_name} -> ${players[playerIndex].name} (索引: ${playerIndex})`);
        }
      }
    }

    if (playerIndex !== -1) {
      setCurrentSpeaker(playerIndex);
      console.log(`[发言高亮] ${player_name} (索引: ${playerIndex}) 开始发言，头像应该亮起`);
    } else {
      console.warn(`[发言高亮] 未找到玩家: ${player_name}，玩家列表:`, players.map(p => p.name));
      // 如果找不到玩家，重置发言者状态
      setCurrentSpeaker(-1);
    }
  };

  // 处理投票
  const handleVoteCast = (data: any) => {
    const { voter, target } = data;

    // 更新玩家票数
    setPlayers(prev => prev.map(player => {
      if (player.name === target) {
        return { ...player, votes: player.votes + 1 };
      }
      return player;
    }));
  };

  // 处理夜晚行动
  const handleNightAction = (data: any) => {
    // 夜晚行动的具体逻辑由WebSocket消息格式化器处理
  };

  // 处理游戏更新
  const handleGameUpdate = (data: any) => {
    const { game_state } = data;
    if (game_state && game_state.players) {
      const updatedPlayers: Player[] = Object.entries(game_state.players).map(([name, player]: [string, any], index: number) => {
        // 尝试从player对象中获取更准确的ID
        const playerId = player.id || parseInt(name) || index + 1;
        const playerName = player.name || name; // 优先使用player.name

        console.log(`[玩家数据] 初始化玩家: ID=${playerId}, Name=${playerName}, Role=${player.role}`);

        return {
          id: playerId,
          name: playerName,
          role: player.role || "未知",
          status: player.alive !== false ? "alive" : "eliminated", // 根据alive状态设置
          votes: 0,
        };
      });
      setPlayers(updatedPlayers);
      console.log(`[玩家数据] 总共初始化了 ${updatedPlayers.length} 个玩家`, updatedPlayers);
    }
  };

  // 处理日志更新
  const handleLogUpdate = (data: any) => {
    // 日志更新由WebSocket消息格式化器处理
  };

  // 格式化消息显示
  const formatMessageDisplay = (message: FormattedMessage) => {
    const isImportant = WebSocketMessageFormatter.isImportantMessage(message);
    const hasMultiLine = message.content.includes('\n');

    return (
      <div className={`flex items-start gap-2 p-3 rounded hover:bg-slate-800/50 ${
        isImportant ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
      }`}>
        <span className="text-sm mt-1">{message.icon}</span>
        <div className="flex-1 min-w-0">
          <div className={`text-sm ${
            isImportant ? 'font-semibold text-amber-400' : 'text-slate-300'
          }`}>
            {hasMultiLine ? (
              // 多行内容：第一行正常显示，详细信息缩进显示
              message.content.split('\n').map((line, index) => (
                <div key={index} className={index > 0 ? 'mt-1 text-xs text-slate-400 italic ml-2' : ''}>
                  {line}
                </div>
              ))
            ) : (
              // 单行内容正常显示
              message.content
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {message.timestamp}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 顶部控制栏 */}
      <div className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Clear the redirect flag to prevent auto-redirect
                sessionStorage.removeItem('shouldRedirectToGame');
                router.push("/");
              }}
              className="gap-2 text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              返回
            </Button>
            <div className="h-6 w-px bg-slate-700" />
            <span className="text-xl font-bold text-amber-400">
              AI狼人杀直播 - {sessionId}
            </span>
            <Badge variant="outline" className="bg-red-500/20 border-red-500 text-red-400">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse" />
              {wsConnection ? "连接中" : "未连接"}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm text-blue-400 border-blue-400/30">
              {godMode === "outside" ? "🔍 场外上帝" : "👁️ 场内上帝"}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              {gamePhaseIcon} 第{currentRound}轮 - {gamePhaseType}
            </span>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-4">
          {/* 中间：圆桌布局 */}
          <div className="col-span-8">
            <Card className="h-[600px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 p-6 shadow-2xl">
              <div className="relative w-full h-full flex items-center justify-center">
                {/* 圆桌玩家 - 围成一圈 */}
                <div className="relative w-[500px] h-[500px]">
                  {players.length > 0 ? (
                    players.map((player, index) => {
                      const angle = (index * 360) / players.length - 90;
                      const radius = 200;
                      const x = Math.cos((angle * Math.PI) / 180) * radius;
                      const y = Math.sin((angle * Math.PI) / 180) * radius;

                      return (
                        <div
                          key={`player-${player.id || index}`}
                          className="absolute top-1/2 left-1/2"
                          style={{
                            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                          }}
                        >
                          <ModelAvatar
                            model={player}
                            isActive={currentSpeaker >= 0 && currentSpeaker === index}
                            godMode={godMode}
                            votes={player.votes || 0}
                          />
                          {/* 调试信息：显示当前玩家索引和发言状态 */}
                          {currentSpeaker >= 0 && currentSpeaker === index && (
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                              发言中 (索引: {index})
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-400">
                      <p>等待游戏开始...</p>
                    </div>
                  )}

                  {/* 中间法官 - 南瓜头 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
                    <div className="text-8xl animate-pulse drop-shadow-2xl drop-shadow-amber-500/20">🎃</div>
                    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 max-w-[250px] shadow-xl shadow-black/50">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl">{gamePhaseIcon}</span>
                        <p className="text-center text-sm font-medium text-amber-400 drop-shadow-lg">
                          {gamePhase}
                        </p>
                      </div>
                    </div>

                    {/* 当前发言者状态指示器 */}
                    {gamePhaseType === "讨论" && currentSpeaker >= 0 && currentSpeakerName && currentSpeakerName !== "等待发言" && (
                      <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 rounded-lg px-4 py-2 max-w-[280px] shadow-lg shadow-blue-500/20">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                          <p className="text-center text-xs font-medium text-blue-300">
                            💬 {currentSpeakerName} 正在发言...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 右侧：游戏信息 */}
          <div className="col-span-4 space-y-4">
            {/* 游戏进度 */}
            <GameProgress
              currentRound={currentRound}
              gamePhase={gamePhase}
              gamePhaseType={gamePhaseType}
              gamePhaseIcon={gamePhaseIcon}
              currentSpeakerName={currentSpeakerName}
              totalPlayers={players.length}
              alivePlayers={players.filter(p => p.status === "alive").length}
            />

            {/* 游戏详情信息 */}
            <GameInfo
              currentRound={currentRound}
              currentPhase={gamePhase}
              currentSpeaker={{
                name: currentSpeakerName,
                content: currentSpeech,
              }}
              historySpeeches={historySpeeches}
              eliminatedPlayers={players
                .filter((p) => p.status === "eliminated")
                .map((p) => p.name)}
            />
          </div>
        </div>

        {/* 底部：WebSocket消息记录区域 */}
        <div className="mt-6">
          <Card className="h-[300px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-slate-100">游戏消息记录</h3>
              </div>
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-400/30">
                {WebSocketMessageFormatter.filterGameMessages(wsMessages).length} 条消息
              </Badge>
            </div>

            <ScrollArea className="h-[240px] p-4">
              <div className="space-y-1">
                {/** 过滤系统消息，只显示重要游戏行动 */}
                {WebSocketMessageFormatter.filterGameMessages(wsMessages).map((message) => (
                  <div key={message.id}>
                    {formatMessageDisplay(message)}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LiveGamePage;