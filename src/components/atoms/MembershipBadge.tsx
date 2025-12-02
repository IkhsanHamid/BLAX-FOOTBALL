import { Crown } from "lucide-react";

export function MembershipBadge({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const iconSizes = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  return (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Outer circle with gradient */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-1 shadow-lg">
        {/* Inner circle */}
        <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
          {/* Crown icon with gradient */}
          <Crown
            className={`${iconSizes[size]} text-amber-500`}
            strokeWidth={2.5}
          />
        </div>
      </div>
      {/* Shine effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white to-transparent opacity-30" />
    </div>
  );
}
