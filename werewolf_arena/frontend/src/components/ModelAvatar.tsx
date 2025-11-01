import { Card, Badge } from "@/components/ui";
import { Bot } from "lucide-react";
import { useState } from "react";

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
  showRole?: boolean; // 是否显示角色（游戏结束时为true）
}

const ModelAvatar = ({ model, isActive, godMode, votes, showRole = false }: ModelAvatarProps) => {
  const [imageError, setImageError] = useState(false);
  
  // 构建图片路径
  const imagePath = `/${model.name}.png`;
  
  // 角色图标映射
  const roleIcons: Record<string, string> = {
    "Werewolf": "🐺",
    "Seer": "🔮",
    "Doctor": "⚕️",
    "Villager": "👤"
  };
  
  // 角色中文名映射
  const roleNames: Record<string, string> = {
    "Werewolf": "狼人",
    "Seer": "预言家",
    "Doctor": "医生",
    "Villager": "村民"
  };
  
  return (
    <div className="relative flex flex-col items-center">
      <div className="relative">
        {/* 编号徽章 - 左上角 */}
        <Badge
          className={`
            absolute -top-1 -left-1 z-10 w-7 h-7 rounded-full flex items-center justify-center p-0 font-bold
            ${isActive ? "bg-amber-500 text-amber-950 shadow-lg shadow-amber-500/50" : "bg-amber-500/80 text-amber-950"}
          `}
        >
          {model.id || '?'}
        </Badge>

        {/* 存活状态徽章 - 右上角 */}
        <Badge
          className={`
            absolute -top-1 -right-1 z-10 px-2 py-0.5 text-[10px] font-bold
            ${model.status === 'alive' 
              ? "bg-amber-500/80 text-amber-950" 
              : "bg-slate-600 text-slate-300"
            }
          `}
        >
          {model.status === 'alive' ? '存活' : '出局'}
        </Badge>

        {/* 圆形容器 */}
        <Card
          className={`
            relative w-32 h-32 rounded-full transition-all duration-300 border-4 flex flex-col items-center justify-center overflow-visible
            ${isActive
              ? "border-amber-400 shadow-2xl shadow-amber-400/40 bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-slate-800/80 scale-110 ring-4 ring-amber-400/20 ring-offset-2 ring-offset-slate-900"
              : "border-amber-500/60 bg-gradient-to-br from-slate-800/95 to-slate-700/95 backdrop-blur-sm hover:border-amber-400/80 hover:scale-105 hover:shadow-lg hover:shadow-amber-400/20 transition-all duration-200"
            }
            ${model.status === "eliminated" ? "opacity-40 grayscale" : ""}
          `}
        >
          {/* 模型头像或图标 */}
          {!imageError ? (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <img
                src={imagePath}
                alt={model.name}
                className="w-16 h-16 object-cover rounded-lg mb-2"
                onError={() => setImageError(true)}
              />
              {/* 名称标签 - 在圆形容器内 */}
              <div className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${isActive 
                  ? "bg-amber-400 text-amber-950 shadow-lg" 
                  : "bg-amber-500/80 text-amber-950"
                }
              `}>
                {model.name.length > 10 ? model.name.substring(0, 10) + '...' : model.name}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <div
                className={`
                  w-16 h-16 rounded-lg flex items-center justify-center transition-all duration-300 mb-2
                  ${isActive
                    ? "bg-gradient-to-br from-amber-400/40 to-amber-500/30 text-amber-300 shadow-inner shadow-amber-400/20"
                    : "bg-slate-700/50 text-amber-400"
                  }
                `}
              >
                <Bot className={`w-10 h-10 transition-colors duration-300 ${isActive ? "text-amber-200" : ""}`} />
              </div>
              {/* 名称标签 - 在圆形容器内 */}
              <div className={`
                px-3 py-1 rounded-full text-xs font-bold
                ${isActive 
                  ? "bg-amber-400 text-amber-950 shadow-lg" 
                  : "bg-amber-500/80 text-amber-950"
                }
              `}>
                {model.name.length > 10 ? model.name.substring(0, 10) + '...' : model.name}
              </div>
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

          {/* 激活指示器 - 发言高亮效果 */}
          {isActive && (
            <>
              {/* 外层脉冲光环 */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping opacity-75" />

              {/* 中层持续光环 */}
              <div className="absolute inset-0 rounded-full border border-amber-400 animate-pulse opacity-60" />

              {/* 内层闪烁边框 */}
              <div className="absolute inset-0 rounded-full border-2 border-amber-300 shadow-lg shadow-amber-400/50 animate-pulse" />
            </>
          )}
        </Card>
      </div>

      {/* 角色显示在底部（游戏结束时） */}
      {showRole && model.role && (
        <div className="mt-2 text-center">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-center gap-1">
            <span>{roleIcons[model.role] || "❓"}</span>
            <span>{roleNames[model.role] || model.role}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelAvatar;