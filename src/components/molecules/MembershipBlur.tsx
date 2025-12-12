import { Lock, Crown } from "lucide-react";
import Button from "../atoms/Button";

interface BookingHistoryBlurProps {
  onUpgradeClick: () => void;
  blurredCount: number;
}

const BookingHistoryBlur = ({
  onUpgradeClick,
  blurredCount,
}: BookingHistoryBlurProps) => {
  return (
    <div
      className={`
        relative mt-4 rounded-xl overflow-hidden
        border border-blue-500/30
      `}
    >
      {/* Blurred background simulation */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white" />

      {/* Blurred content placeholder */}
      <div className="p-4 space-y-3 blur-sm pointer-events-none select-none">
        {Array.from({ length: Math.min(blurredCount, 3) }).map((_, i) => (
          <div
            key={i}
            className="p-4 border border-gray-300 rounded-lg bg-gray-200/50"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="h-5 w-40 bg-gray-400/20 rounded mb-1" />
                <div className="h-4 w-24 bg-gray-400/15 rounded" />
              </div>
              <div className="h-6 w-20 bg-gray-400/20 rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-4 w-32 bg-gray-400/15 rounded" />
              <div className="h-4 w-28 bg-gray-400/15 rounded" />
              <div className="h-4 w-20 bg-gray-400/15 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Overlay with CTA */}
      <div
        className={`
          absolute inset-0 flex flex-col items-center justify-center
          bg-gradient-to-b from-white/60 via-white/80 to-white/95
          backdrop-blur-[2px]
        `}
      >
        <div
          className={`
            p-4 rounded-full mb-4
            bg-gradient-to-br from-blue-500 to-sky-400
            shadow-lg
          `}
          style={{ boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)" }} // blue glow
        >
          <Lock className="w-8 h-8 text-white" />
        </div>

        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">
          {blurredCount} Booking Lainnya Tersembunyi
        </h3>

        <p className="text-gray-600 text-center mb-4 max-w-xs px-4">
          Upgrade ke membership untuk melihat semua riwayat booking Anda
        </p>

        <Button
          onClick={onUpgradeClick}
          className={`
            px-6 py-2 font-semibold rounded-xl
            bg-gradient-to-r from-blue-500 to-sky-400
            hover:opacity-90 transition-opacity
            shadow-lg hover:shadow-xl
          `}
        >
          <Crown className="w-4 h-4 mr-2" />
          Lihat Semua - Upgrade Membership
        </Button>
      </div>
    </div>
  );
};

export default BookingHistoryBlur;
