import { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";
import { useRouter } from "next/navigation";
import Button from "../atoms/Button";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount?: number;
  productName?: string;
}

export default function PaymentSuccessModal({
  isOpen,
  onClose,
  amount,
  productName = "Pembayaran",
}: PaymentSuccessModalProps) {
  const navigate = useRouter();
  const [countdown, setCountdown] = useState(10);

  const triggerConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;

    const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();

    // Center burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: colors,
    });
  }, []);

  const handleClose = useCallback(() => {
    onClose();
    navigate.push("/");
  }, [onClose, navigate]);

  useEffect(() => {
    if (isOpen) {
      setCountdown(10);
      triggerConfetti();
    }
  }, [isOpen, triggerConfetti]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, handleClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center animate-scale-in">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Selamat, Pembayaran Berhasil!
          </DialogTitle>
          <p className="text-muted-foreground">
            Terima kasih telah melakukan pembayaran
          </p>
        </DialogHeader>

        <div className="py-6 space-y-4">
          {productName && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Produk</span>
              <span className="font-medium text-foreground">{productName}</span>
            </div>
          )}
          {amount && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Pembayaran</span>
              <span className="font-semibold text-foreground">
                IDR {amount.toLocaleString("id-ID")}
              </span>
            </div>
          )}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Popup akan ditutup dalam{" "}
              <span className="font-bold text-primary">{countdown}</span> detik
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-1000 ease-linear"
                style={{ width: `${(countdown / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleClose} className="w-full">
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
}
