import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, ScrollArea } from "@/components/ui";
import ModelAvatar from "@/components/ModelAvatar";
import GameInfo from "@/components/GameInfo";
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
  const [currentSpeaker, setCurrentSpeaker] = useState<number>(0);
  const [gamePhase, setGamePhase] = useState<string>("准备中");
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
    // 使用消息格式化器格式化消息
    const formattedMessage = WebSocketMessageFormatter.formatMessage(data);

    if (formattedMessage) {
      // 添加消息到历史
      setWsMessages(prev => [...prev, formattedMessage]);

      // 同时处理游戏状态更新逻辑
      const { type, data: messageData } = data;

      switch (type) {
        case "phase_change":
          handlePhaseChange(messageData);
          break;
        case "debate_turn":
          handleDebateTurn(messageData);
          break;
        case "vote_cast":
          handleVoteCast(messageData);
          break;
        case "night_action":
          handleNightAction(messageData);
          break;
        case "game_update":
          handleGameUpdate(messageData);
          break;
      }
    }
  };

  // 处理阶段变更
  const handlePhaseChange = (data: any) => {
    const { phase, round_number } = data;
    setCurrentRound(round_number);

    let phaseText = "";
    switch (phase) {
      case "night":
        phaseText = "🌙 天黑了，请闭眼...";
        break;
      case "day":
        phaseText = "☀️ 天亮了，请睁眼...";
        break;
      case "debate":
        phaseText = "💬 发言阶段开始";
        break;
      case "voting":
        phaseText = "🗳️ 投票环节开始";
        break;
      default:
        phaseText = `阶段变更: ${phase}`;
    }

    setGamePhase(phaseText);
  };

  // 处理发言
  const handleDebateTurn = (data: any) => {
    const { player_name, dialogue } = data;

    setCurrentSpeech(dialogue);
    setHistorySpeeches(prev => [...prev.slice(-4), { name: player_name, content: dialogue }]);

    // 更新当前发言者
    const playerIndex = players.findIndex(p => p.name === player_name);
    if (playerIndex !== -1) {
      setCurrentSpeaker(playerIndex);
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
      const updatedPlayers: Player[] = Object.entries(game_state.players).map(([name, player]: [string, any], index: number) => ({
        id: parseInt(name) || index + 1, // 使用index+1作为fallback
        name: name,
        role: player.role || "未知",
        status: "alive", // 这里需要根据实际状态设置
        votes: 0,
      }));
      setPlayers(updatedPlayers);
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
            <span className="text-xs text-slate-400">
              第{currentRound}局 - {gamePhase}
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
                            isActive={currentSpeaker === index}
                            godMode={godMode}
                            votes={player.votes || 0}
                          />
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
                    <div className="bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-6 py-3 max-w-[300px] shadow-xl shadow-black/50">
                      <p className="text-center text-sm font-medium text-amber-400 drop-shadow-lg">
                        {gamePhase}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* 右侧：游戏信息 */}
          <div className="col-span-4">
            <GameInfo
              currentRound={currentRound}
              currentPhase={gamePhase}
              currentSpeaker={{
                name: players[currentSpeaker]?.name || "未知",
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