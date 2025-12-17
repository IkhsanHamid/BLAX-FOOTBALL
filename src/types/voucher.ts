export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
  isActive: boolean;
}

export interface VoucherPayload {
  code?: string;
  name: string;
  description: string;
  type: "PERCENTAGE" | "FIXED";
  nominal: number;
  isActive: boolean;
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
}
