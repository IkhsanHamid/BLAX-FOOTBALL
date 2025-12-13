import { Crown, Gift, Lock } from "lucide-react";
import Button from "../atoms/Button";

interface LineupBlurProps {
  onUpgradeClick: () => void;
  className?: string;
}

const LineupBlur = ({ onUpgradeClick, className }: LineupBlurProps) => {
  return (
    <div className={`relative ${className ?? ""}`}>
      {/* Blurred lineup placeholders */}
      <div className="space-y-4 filter blur-sm pointer-events-none select-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="
              p-4 rounded-xl
              bg-white/80 border border-slate-200
              shadow-sm
            "
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-24 bg-slate-300 rounded" />
              <div className="h-4 w-12 bg-slate-300 rounded" />
            </div>

            <div className="space-y-2">
              <div className="h-3 bg-slate-300 rounded w-full" />
              <div className="h-3 bg-slate-300 rounded w-5/6" />
              <div className="h-3 bg-slate-300 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="
            max-w-sm w-full mx-4 p-6 rounded-2xl text-center
            bg-gradient-to-br from-blue-600/95 to-blue-800/95
            border border-white/20
            shadow-2xl backdrop-blur-md
          "
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-white/20">
              <Lock className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Title */}
          <h4 className="flex items-center justify-center gap-2 text-lg font-bold text-white mb-2">
            <Gift className="w-5 h-5" />
            Live Lineup
          </h4>

          {/* Description */}
          <p className="text-sm text-white/85 mb-5 leading-relaxed">
            Upgrade ke <span className="font-semibold">Membership</span> untuk
            melihat live lineup dan menikmati berbagai keuntungan eksklusif.
          </p>

          {/* CTA */}
          <Button
            onClick={onUpgradeClick}
            className="
              w-full flex items-center justify-center
              bg-white text-blue-700 font-bold
              py-3 rounded-xl
              shadow-lg hover:shadow-xl
              transition-all duration-300
              hover:scale-[1.02]
            "
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LineupBlur;
