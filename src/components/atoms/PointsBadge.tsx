import { Coins } from "lucide-react";

interface PointsBadgeProps {
  points: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const PointsBadge = ({
  points,
  size = "md",
  className = "",
}: PointsBadgeProps) => {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="relative inline-block group">
      {/* Badge */}
      <div
        className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-primary-foreground rounded-full font-semibold shadow-md cursor-pointer ${sizeClasses[size]} ${className}`}
      >
        <Coins className={iconSizes[size]} />
        <span>{points.toLocaleString("id-ID")}</span>
        <span className="opacity-80">pts</span>
      </div>

      {/* Tooltip */}
      <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max max-w-[200px] -translate-x-1/2 scale-95 rounded-md bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
        Hanya membership yang mendapatkan point
        {/* Arrow */}
        <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-gray-900" />
      </div>
    </div>
  );
};

export default PointsBadge;
