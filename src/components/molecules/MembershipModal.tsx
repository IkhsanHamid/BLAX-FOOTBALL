import {
  Crown,
  Sparkles,
  Gift,
  Percent,
  History,
  Check,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import Button from "../atoms/Button";
import { paymentService } from "@/utils/payment";
import { useState } from "react";
import { useNotifications } from "../organisms/NotificationContainer";
import { useRouter } from "next/navigation";

interface MembershipModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

const benefits = [
  {
    icon: History,
    title: "Akses Full Booking History",
    description: "Lihat semua riwayat booking tanpa batasan",
  },
  {
    icon: Gift,
    title: "Voucher Eksklusif Member",
    description: "Dapatkan voucher khusus yang hanya tersedia untuk member",
  },
  {
    icon: Percent,
    title: "Diskon Khusus Booking",
    description: "Nikmati diskon spesial untuk setiap booking",
  },
];

const MembershipModal = ({
  open,
  onOpenChange,
  code,
}: MembershipModalProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotifications();
  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const setupPayment = await paymentService.setupMemberPayment(code);
      showSuccess("Silahkan selesaikan pembayaran anda");
      router.push(`/signup/membership?paymentId=${setupPayment}`);
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border border-blue-500/30">
        {/* Header - Blue Gradient */}
        <div className="relative p-6 pb-8 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-400">
          <div className="absolute inset-0 overflow-hidden">
            <Sparkles className="absolute top-4 right-4 w-6 h-6 text-cyan-200/40 animate-pulse" />
            <Sparkles
              className="absolute bottom-8 left-8 w-4 h-4 text-white/40 animate-pulse"
              style={{ animationDelay: "0.5s" }}
            />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-300/20 rounded-full blur-3xl" />
          </div>

          <DialogHeader className="relative z-10">
            <div className="flex items-center justify-center mb-3">
              <div
                className="p-4 rounded-full bg-white/20 backdrop-blur-sm"
                style={{ boxShadow: "0 0 30px rgba(59,130,246,0.4)" }} // blue glow
              >
                <Crown className="w-10 h-10 text-yellow-300" />
              </div>
            </div>

            <DialogTitle className="text-center text-2xl font-bold text-white">
              Upgrade ke Membership
            </DialogTitle>
            <p className="text-center text-white/90 mt-2">
              Tingkatkan pengalaman bermain Anda dengan keuntungan eksklusif
            </p>
          </DialogHeader>
        </div>

        {/* Benefit List */}
        <div className="p-6 space-y-4">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 hover:border-blue-300 transition-colors"
            >
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400">
                <benefit.icon className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  {benefit.title}
                  <Check className="w-4 h-4 text-blue-600" />
                </h4>
                <p className="text-sm text-gray-600 mt-0.5">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="p-6 pt-0 space-y-3">
          <Button
            onClick={handleUpgrade}
            disabled={loading}
            className="
    w-full py-6 text-lg font-bold rounded-xl
    bg-gradient-to-r from-blue-600 to-cyan-400
    hover:opacity-90 transition-opacity
    shadow-lg
    disabled:opacity-60 disabled:cursor-not-allowed
  "
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Crown className="w-5 h-5 mr-2" />
                Upgrade Membership Sekarang
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-gray-500 hover:text-gray-700"
          >
            Nanti saja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MembershipModal;
