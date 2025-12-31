import { RedeemableVoucher } from "@/types/voucher";
import { Gift, Coins, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../atoms/Dialog";

interface RedeemConfirmDialogProps {
  voucher: RedeemableVoucher | null;
  userPoints: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

const RedeemConfirmDialog = ({
  voucher,
  userPoints,
  open,
  onOpenChange,
  onConfirm,
}: RedeemConfirmDialogProps) => {
  if (!voucher) return null;

  const remainingPoints = userPoints - voucher.pointCost;
  const canAfford = remainingPoints >= 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md space-y-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Konfirmasi Tukar Voucher
          </DialogTitle>
        </DialogHeader>

        {/* Voucher Info */}
        <div className="p-4 bg-secondary rounded-lg">
          <h4 className="font-semibold text-foreground">{voucher.name}</h4>
          <p className="text-sm text-muted-foreground mt-1">
            {voucher.description}
          </p>
        </div>

        {/* Points Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Poin Anda saat ini</span>
            <span className="font-medium">
              {userPoints.toLocaleString("id-ID")} pts
            </span>
          </div>

          <div className="flex justify-between">
            <span>Poin yang dibutuhkan</span>
            <span className="font-medium text-destructive">
              -{voucher.pointCost.toLocaleString("id-ID")} pts
            </span>
          </div>

          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-medium">Sisa poin</span>
            <span
              className={`font-bold ${
                canAfford ? "text-primary" : "text-destructive"
              }`}
            >
              {remainingPoints.toLocaleString("id-ID")} pts
            </span>
          </div>
        </div>

        {/* Warning */}
        {!canAfford && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Poin Anda tidak mencukupi untuk menukar voucher ini.</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-md border text-sm"
          >
            Batal
          </button>

          <button
            onClick={onConfirm}
            disabled={!canAfford}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm disabled:opacity-50"
          >
            <Coins className="w-4 h-4" />
            Tukar Sekarang
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RedeemConfirmDialog;
