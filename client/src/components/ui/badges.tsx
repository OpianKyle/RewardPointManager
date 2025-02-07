import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LucideIcon, Trophy, Award, Star, Shield } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface AchievementBadge {
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  earned: boolean;
  progress?: number;
  requirement: number;
}

export const referralBadges: AchievementBadge[] = [
  {
    name: "Bronze Referrer",
    description: "Made your first referral",
    icon: Trophy,
    color: "bg-orange-500/10 text-orange-500",
    earned: false,
    requirement: 1
  },
  {
    name: "Silver Networker",
    description: "Successfully referred 5 people",
    icon: Award,
    color: "bg-slate-300/10 text-slate-300",
    earned: false,
    requirement: 5
  },
  {
    name: "Gold Influencer",
    description: "Built a network of 10 referrals",
    icon: Star,
    color: "bg-yellow-500/10 text-yellow-500",
    earned: false,
    requirement: 10
  },
  {
    name: "Platinum Ambassador",
    description: "Achieved 25 successful referrals",
    icon: Shield,
    color: "bg-purple-500/10 text-purple-500",
    earned: false,
    requirement: 25
  },
  {
    name: "Diamond Elite",
    description: "Legendary status with 50 referrals",
    icon: Trophy,
    color: "bg-blue-500/10 text-blue-500",
    earned: false,
    requirement: 50
  }
];

export function AchievementBadges({ 
  badges, 
  className 
}: { 
  badges: AchievementBadge[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <TooltipProvider>
        {badges.map((badge) => {
          const Icon = badge.icon;
          return (
            <Tooltip key={badge.name}>
              <TooltipTrigger>
                <Badge
                  variant="outline"
                  className={cn(
                    "h-8 w-8 p-0 flex items-center justify-center transition-all",
                    badge.earned ? badge.color : "bg-gray-100/10 text-gray-400",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <p className="font-semibold">{badge.name}</p>
                  <p className="text-xs text-muted-foreground">{badge.description}</p>
                  {!badge.earned && badge.progress !== undefined && (
                    <p className="text-xs mt-1">
                      Progress: {badge.progress}/{badge.requirement}
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
