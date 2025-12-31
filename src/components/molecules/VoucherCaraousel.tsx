import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, Gift, Loader2 } from "lucide-react";
import { RedeemableVoucher } from "@/types/voucher";
import { useNotifications } from "../organisms/NotificationContainer";
import Button from "../atoms/Button";
import RedeemVoucherCard from "./RedeemVoucherCard";
import RedeemConfirmDialog from "./RedeemConfirmationDialog";
import { voucherService } from "@/utils/voucher";

interface VoucherCarouselProps {
  vouchers: RedeemableVoucher[];
  userPoints: number;
  onPointsUpdate: (newPoints: number) => void;
  onRefresh?: () => void;
}

const VoucherCarousel = ({
  vouchers,
  userPoints,
  onPointsUpdate,
  onRefresh,
}: VoucherCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [itemsPerView, setItemsPerView] = useState(1);
  const [selectedVoucher, setSelectedVoucher] =
    useState<RedeemableVoucher | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { showSuccess, showError } = useNotifications();

  // Handle responsive items per view
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setItemsPerView(3);
      } else if (width >= 640) {
        setItemsPerView(2);
      } else {
        setItemsPerView(1);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || showDialog) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, vouchers.length - itemsPerView);
        // Loop back to start when reaching the end
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, itemsPerView, vouchers.length, showDialog]);

  const maxIndex = Math.max(0, vouchers.length - itemsPerView);
  const canScrollPrev = currentIndex > 0;
  const canScrollNext = currentIndex < maxIndex;

  const scrollPrev = () => {
    setIsAutoPlaying(false); // Pause auto-play when user interacts
    if (canScrollPrev) {
      setCurrentIndex((prev) => Math.max(0, prev - 1));
    }
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const scrollNext = () => {
    setIsAutoPlaying(false); // Pause auto-play when user interacts
    if (canScrollNext) {
      setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    }
    // Resume auto-play after 5 seconds
    setTimeout(() => setIsAutoPlaying(true), 5000);
  };

  const handleRedeemClick = (voucher: RedeemableVoucher) => {
    setSelectedVoucher(voucher);
    setShowDialog(true);
  };

  const handleConfirmRedeem = async () => {
    if (!selectedVoucher) return;

    if (userPoints >= selectedVoucher.pointCost) {
      setIsRedeeming(true);

      try {
        await voucherService.redeemVoucher(selectedVoucher.id);
        const newPoints = userPoints - selectedVoucher.pointCost;
        onPointsUpdate(newPoints);
        showSuccess(`Voucher "${selectedVoucher.name}" berhasil ditukar! 🎉`);
        if (onRefresh) {
          onRefresh();
        }
        setShowDialog(false);
        setSelectedVoucher(null);
      } catch (error) {
        console.error("Error redeeming voucher:", error);
        showError(
          "Error",
          "Terjadi kesalahan saat menukar voucher. Silakan coba lagi."
        );
      } finally {
        setIsRedeeming(false);
      }
    }
  };

  const dotsCount = maxIndex + 1;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
          <h3 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
            Tukar Poin dengan Voucher
          </h3>
        </div>

        {/* Navigation Buttons - Hidden on mobile if only 1 item visible */}
        {vouchers.length > 1 && (
          <div className="flex gap-1 sm:gap-2 flex-shrink-0 ml-2">
            <button
              onClick={scrollPrev}
              disabled={!canScrollPrev}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollPrev
                  ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                  : "border-gray-300 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>

            <button
              onClick={scrollNext}
              disabled={!canScrollNext}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full border flex items-center justify-center transition-all ${
                canScrollNext
                  ? "border-blue-600 text-blue-600 hover:bg-blue-50"
                  : "border-gray-300 text-gray-300 cursor-not-allowed"
              }`}
            >
              <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Carousel Container */}
      <div className="overflow-hidden -mx-2 sm:mx-0">
        <div className="px-2 sm:px-0">
          <div
            className="flex gap-3 sm:gap-4 transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${(100 / itemsPerView) * currentIndex}%)`,
            }}
          >
            {vouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="flex-shrink-0"
                style={{
                  width: `calc(${100 / itemsPerView}% - ${
                    ((itemsPerView - 1) * (itemsPerView === 1 ? 12 : 16)) /
                    itemsPerView
                  }px)`,
                }}
              >
                <RedeemVoucherCard
                  voucher={voucher}
                  userPoints={userPoints}
                  onRedeem={handleRedeemClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      {dotsCount > 1 && (
        <div className="flex justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          {Array.from({ length: dotsCount }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                setIsAutoPlaying(false);
                setTimeout(() => setIsAutoPlaying(true), 5000);
              }}
              className={`h-1.5 sm:h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "w-6 sm:w-8 bg-blue-600"
                  : "w-1.5 sm:w-2 bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Simple Dialog */}
      {showDialog && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Gift className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">
                Konfirmasi Tukar Voucher
              </h3>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg mb-4">
              <h4 className="font-semibold text-gray-900">
                {selectedVoucher.name}
              </h4>
              <p className="text-sm text-gray-600 mt-1">
                {selectedVoucher.description}
              </p>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span>Poin Anda</span>
                <span className="font-medium">
                  {userPoints.toLocaleString("id-ID")} pts
                </span>
              </div>
              <div className="flex justify-between">
                <span>Poin dibutuhkan</span>
                <span className="font-medium text-red-600">
                  -{selectedVoucher.pointCost.toLocaleString("id-ID")} pts
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Sisa poin</span>
                <span className="font-bold text-blue-600">
                  {(userPoints - selectedVoucher.pointCost).toLocaleString(
                    "id-ID"
                  )}{" "}
                  pts
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDialog(false)}
                disabled={isRedeeming}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRedeem}
                disabled={isRedeeming}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isRedeeming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  "Tukar Sekarang"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherCarousel;
