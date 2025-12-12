import { Crown, Gift, Lock } from "lucide-react";
import Button from "../atoms/Button";

interface VouchersBlurProps {
  onUpgradeClick: () => void;
  className?: string;
}

const VouchersBlur = ({ onUpgradeClick, className }: VouchersBlurProps) => {
  return (
    <div className={`relative ${className || ""}`}>
      {/* Blurred voucher placeholders */}
      <div className="space-y-3 filter blur-sm pointer-events-none select-none">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 border border-slate-300 rounded-lg bg-slate-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 bg-slate-300 rounded w-24" />
              <div className="h-5 bg-slate-300 rounded w-16" />
            </div>

            <div className="h-3 bg-slate-300 rounded w-full mb-2" />
            <div className="h-4 bg-slate-300 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Overlay with upgrade message */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`
            text-center p-6 rounded-xl mx-4
            bg-gradient-to-br from-blue-600/95 to-blue-800/95
            border border-slate-300/50
            shadow-xl backdrop-blur-sm
          `}
          style={{
            boxShadow:
              "0 10px 40px rgba(37, 99, 235, 0.3), 0 0 30px rgba(203, 213, 225, 0.2)",
          }}
        >
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-slate-300/30 rounded-full">
              <Lock className="w-6 h-6 text-slate-100" />
            </div>
          </div>

          <h4 className="text-white font-bold text-lg mb-2 flex items-center justify-center gap-2">
            <Gift className="w-5 h-5" />
            Voucher Eksklusif
          </h4>

          <p className="text-white/80 text-sm mb-4">
            Upgrade ke Membership untuk mendapatkan voucher eksklusif dan
            penawaran menarik!
          </p>

          <Button
            onClick={onUpgradeClick}
            className={`
              bg-slate-300 text-blue-800 font-bold
              hover:bg-slate-100
              px-6 py-2 rounded-lg
              shadow-lg hover:shadow-xl transition-all duration-300
              hover:scale-105
            `}
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VouchersBlur;
