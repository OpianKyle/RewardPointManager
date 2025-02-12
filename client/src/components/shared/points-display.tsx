interface PointsDisplayProps {
  points: number;
  size?: "small" | "medium" | "large";
  showSign?: boolean;
}

export default function PointsDisplay({ points, size = "medium", showSign = false }: PointsDisplayProps) {
  const sizeClasses = {
    small: "text-lg",
    medium: "text-2xl",
    large: "text-4xl",
  };

  const getPointsDisplay = () => {
    if (!showSign) return points.toLocaleString();
    const sign = points >= 0 ? "+" : "";
    return `${sign}${points.toLocaleString()}`;
  };

  const getColorClass = () => {
    if (!showSign) return "text-white";
    return points >= 0 ? "text-[#43EB3E]" : "text-red-600";
  };

  return (
    <div className="flex items-center gap-1">
      <span className={`font-bold ${sizeClasses[size]} ${getColorClass()}`}>
        {getPointsDisplay()}
      </span>
      <span className="text-muted-foreground text-sm">points</span>
    </div>
  );
}