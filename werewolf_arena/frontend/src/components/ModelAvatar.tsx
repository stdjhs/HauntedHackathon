import { Card, Badge } from "@/components/ui";
import { Bot } from "lucide-react";

interface ModelAvatarProps {
  model: {
    id: number;
    name: string;
    role: string;
    status: "alive" | "eliminated";
  };
  isActive: boolean;
  godMode: "inside" | "outside";
  votes: number;
}

const ModelAvatar = ({ model, isActive, godMode, votes }: ModelAvatarProps) => {
  return (
    <div className="relative">
      {/* 号码徽章 */}
      <Badge
        className={`
          absolute -top-1 -right-1 z-10 w-7 h-7 rounded-full flex items-center justify-center p-0 font-bold
          ${isActive ? "bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/50" : "bg-slate-700 text-slate-300"}
        `}
      >
        {model.id || '?'}
      </Badge>

      {/* 圆形容器 */}
      <Card
        className={`
          relative w-24 h-24 rounded-full transition-all duration-500 border-2 flex flex-col items-center justify-center
          ${isActive
            ? "border-amber-500 shadow-2xl shadow-amber-500/30 bg-gradient-to-br from-amber-500/20 to-amber-600/10 scale-110"
            : "border-slate-600 bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-sm hover:border-amber-400/50 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/20"
          }
          ${model.status === "eliminated" ? "opacity-40 grayscale" : ""}
        `}
      >
        {/* 模型图标/名称 */}
        <div
          className={`
            w-10 h-10 rounded-full flex items-center justify-center mb-1
            ${isActive ? "bg-amber-500/30 text-amber-400" : "bg-slate-700/50 text-slate-400"}
          `}
        >
          <Bot className="w-5 h-5" />
        </div>

        {/* 名称或角色 */}
        <div className="text-center px-2">
          <div className="text-[10px] font-bold truncate max-w-[70px] text-slate-300">
            {godMode === "inside" ? `${model.id || '?'}号` : model.name}
          </div>
        </div>

        {/* 出局标记 */}
        {model.status === "eliminated" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Badge variant="destructive" className="text-[8px] px-1.5 py-0.5">
              出局
            </Badge>
          </div>
        )}

        {/* 票数 */}
        {votes > 0 && model.status === "alive" && (
          <div className="absolute -bottom-2">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-card/90 backdrop-blur-sm">
              {votes}票
            </Badge>
          </div>
        )}

        {/* 激活指示器 */}
        {isActive && (
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75" />
        )}
      </Card>

      {/* 角色信息（场外上帝模式） */}
      {godMode === "outside" && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
          <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
            {model.role}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default ModelAvatar;