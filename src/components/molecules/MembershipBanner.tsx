import { Crown, Sparkles, Gift, Percent, History } from "lucide-react";
import Button from "../atoms/Button";

interface MembershipBannerProps {
  onUpgradeClick: () => void;
  className?: string;
}

const MembershipBanner = ({
  onUpgradeClick,
  className,
}: MembershipBannerProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-6 md:p-8
        bg-gradient-to-r from-purple-600 via-purple-800 to-yellow-500
        border border-yellow-400/30 shadow-xl
        ${className || ""}
      `}
      style={{
        boxShadow:
          "0 10px 40px hsla(270, 70%, 50%, 0.3), 0 0 60px hsla(45, 90%, 50%, 0.15)",
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-600/30 rounded-full blur-3xl" />
        <Sparkles className="absolute top-4 right-4 w-6 h-6 text-yellow-500 animate-pulse" />
        <Sparkles
          className="absolute bottom-4 left-4 w-4 h-4 text-white/30 animate-pulse"
          style={{ animationDelay: "0.5s" }}
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              Upgrade ke Membership
            </h2>
          </div>
          <p className="text-white/90 text-lg mb-4">
            Dapatkan akses eksklusif dan berbagai keuntungan menarik!
          </p>

          {/* Benefits list */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <History className="w-4 h-4" />
              </div>
              <span className="text-sm">Full Booking History</span>
            </div>

            <div className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-sm">Voucher Eksklusif</span>
            </div>

            <div className="flex items-center gap-2 text-white/90">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Percent className="w-4 h-4" />
              </div>
              <span className="text-sm">Diskon Booking</span>
            </div>
          </div>
        </div>

        <Button
          onClick={onUpgradeClick}
          className={`
            bg-white hover:bg-white/90 text-purple-600 font-bold
            px-8 py-6 text-lg rounded-xl
            shadow-lg hover:shadow-xl transition-all duration-300
            hover:scale-105
          `}
        >
          <Crown className="w-5 h-5 mr-2" />
          Upgrade Sekarang
        </Button>
      </div>
    </div>
  );
};

export default MembershipBanner;
