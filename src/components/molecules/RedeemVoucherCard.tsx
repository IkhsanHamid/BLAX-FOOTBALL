import { RedeemableVoucher } from "@/types/voucher";
import { Gift, Clock, Coins } from "lucide-react";
import Button from "../atoms/Button";

interface RedeemVoucherCardProps {
  voucher: RedeemableVoucher;
  userPoints: number;
  onRedeem: (voucher: RedeemableVoucher) => void;
}

const RedeemVoucherCard = ({
  voucher,
  userPoints,
  onRedeem,
}: RedeemVoucherCardProps) => {
  console.log("userPoints", userPoints);
  console.log("voucher.pointCost", voucher.pointCost);
  console.log("canAfford", Number(userPoints) >= Number(voucher.pointCost));
  const canAfford = Number(userPoints) >= Number(voucher.pointCost);

  const formatDiscount = () => {
    if (voucher.type === "PERCENTAGE") {
      return `${voucher.nominal}%`;
    }
    return `Rp${voucher.nominal.toLocaleString("id-ID")}`;
  };

  return (
    <div className="relative h-full p-4 sm:p-5 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-white to-blue-50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col">
      {/* Discount Badge */}
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold shadow-md z-10">
        {formatDiscount()}
      </div>

      {/* Header */}
      <div className="flex items-start gap-2 sm:gap-3 mb-3">
        <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg flex-shrink-0">
          <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
            {voucher.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
            {voucher.description}
          </p>
        </div>
      </div>

      {/* Expiry Info */}
      {/* <div className="flex items-center gap-1 sm:gap-1.5 text-xs text-gray-500 mb-3 sm:mb-4">
        <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
        <span className="truncate">Berlaku {voucher.expiryDays} hari</span>
      </div> */}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-200 gap-2">
        <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
          <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
          <span
            className={`font-bold text-xs sm:text-sm truncate ${
              canAfford ? "text-amber-600" : "text-red-600"
            }`}
          >
            {voucher.pointCost.toLocaleString("id-ID")}
          </span>
        </div>
        <button
          onClick={() => onRedeem(voucher)}
          disabled={!canAfford}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
            canAfford
              ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-sm"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          {canAfford ? "Tukar" : "Kurang Poin"}
        </button>
      </div>
    </div>
  );
};

export default RedeemVoucherCard;
