import { Badge } from "@/components/ui";
import { Clock, Users, Target, Moon, Sun, MessageCircle, Vote } from "lucide-react";

interface GameProgressProps {
  currentRound: number;
  gamePhase: string;
  gamePhaseType: string;
  gamePhaseIcon: string;
  currentSpeakerName: string;
  totalPlayers?: number;
  alivePlayers?: number;
}

const GameProgress = ({
  currentRound,
  gamePhase,
  gamePhaseType,
  gamePhaseIcon,
  currentSpeakerName,
  totalPlayers = 6,
  alivePlayers = 6
}: GameProgressProps) => {
  // 根据阶段类型获取颜色主题
  const getPhaseColor = () => {
    switch (gamePhaseType) {
      case "夜晚":
        return "bg-indigo-500/20 border-indigo-500 text-indigo-400";
      case "白天":
        return "bg-yellow-500/20 border-yellow-500 text-yellow-400";
      case "讨论":
        return "bg-blue-500/20 border-blue-500 text-blue-400";
      case "投票":
        return "bg-red-500/20 border-red-500 text-red-400";
      default:
        return "bg-slate-500/20 border-slate-500 text-slate-400";
    }
  };

  // 获取阶段描述
  const getPhaseDescription = () => {
    switch (gamePhaseType) {
      case "夜晚":
        return "狼人行动时间";
      case "白天":
        return "讨论和投票时间";
      case "讨论":
        return "玩家轮流发言";
      case "投票":
        return "投票放逐可疑玩家";
      default:
        return "游戏进行中";
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 space-y-3">
      {/* 标题和回合数 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <h3 className="font-semibold text-slate-100">游戏进度</h3>
        </div>
        <Badge variant="outline" className="text-xs bg-amber-500/10 border-amber-500 text-amber-400">
          第 {currentRound} 轮
        </Badge>
      </div>

      {/* 当前阶段 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">当前阶段</span>
          <span className="text-xs text-slate-500">{getPhaseDescription()}</span>
        </div>

        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-300 ${getPhaseColor()}`}>
          <span className="text-2xl">{gamePhaseIcon}</span>
          <div className="flex-1">
            <p className="font-medium text-sm">{gamePhase}</p>
            <p className="text-xs opacity-75">{gamePhaseType}</p>
          </div>
        </div>
      </div>

      {/* 玩家状态 */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-400">玩家状态</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1">
            <span className="text-xs text-slate-300">存活</span>
            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500 text-green-400">
              {alivePlayers}
            </Badge>
          </div>

          <div className="flex items-center justify-between bg-slate-700/50 rounded px-2 py-1">
            <span className="text-xs text-slate-300">总计</span>
            <Badge variant="outline" className="text-xs bg-slate-500/10 border-slate-500 text-slate-400">
              {totalPlayers}
            </Badge>
          </div>
        </div>
      </div>

      {/* 当前发言者 */}
      {gamePhaseType === "讨论" && currentSpeakerName && currentSpeakerName !== "等待发言" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-slate-400">当前发言</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <p className="text-sm text-blue-300 font-medium">{currentSpeakerName}</p>
          </div>
        </div>
      )}

      {/* 投票阶段提示 */}
      {gamePhaseType === "投票" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Vote className="w-3 h-3 text-red-400" />
            <span className="text-xs text-slate-400">投票进行中</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <Target className="w-4 h-4 text-red-400" />
            <p className="text-sm text-red-300">请投票放逐可疑玩家</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameProgress;