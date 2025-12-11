import { Flame } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StreakBadgeProps {
  streak: number;
  longestStreak?: number;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
  className?: string;
}

export function StreakBadge({ 
  streak, 
  longestStreak, 
  size = "md", 
  showTooltip = true,
  className 
}: StreakBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const isActive = streak > 0;

  const badge = (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={cn(
        "inline-flex items-center rounded-full font-semibold transition-colors",
        sizeClasses[size],
        isActive 
          ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/25" 
          : "bg-muted text-muted-foreground",
        className
      )}
    >
      <motion.div
        animate={isActive ? { 
          scale: [1, 1.2, 1],
        } : {}}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      >
        <Flame className={cn(iconSizes[size], isActive && "text-yellow-200")} />
      </motion.div>
      <span>{streak}</span>
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-center">
        <p className="font-semibold">
          {isActive ? `${streak} day streak! 🔥` : "No active streak"}
        </p>
        {longestStreak !== undefined && longestStreak > 0 && (
          <p className="text-xs text-muted-foreground">
            Best: {longestStreak} days
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Post daily to keep your streak!
        </p>
      </TooltipContent>
    </Tooltip>
  );
}