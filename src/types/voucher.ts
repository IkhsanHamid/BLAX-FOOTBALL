export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
  isActive: boolean;
  isRedeemable: boolean;
  isBooking: boolean;
  pointCost: number;
}

export interface VoucherPayload {
  code?: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
  isActive: boolean;
  isRedeemable: boolean;
  isBooking: boolean;
  pointCost: number;
}

// export interface UserVoucher {
//   id: string;
//   userId: string;
//   voucherId: string;
//   usedAt?: string;
//   voucher: Voucher;
// }

export interface UserVoucher {
  name: string;
  code: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
}

export interface RedeemableVoucher {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
  expiryDays?: number;
}

export interface UserPoints {
  total: number;
  pending: number;
  history: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  amount: number;
  type: "EARN" | "REDEEM";
  description: string;
  date: string;
}
