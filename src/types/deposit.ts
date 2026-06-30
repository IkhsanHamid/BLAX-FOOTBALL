export interface UserDepositBalance {
  balance: number;
  lastUpdated: string;
}

export interface UserDepositTopupResponse {
  paymentId: string;
  totalAmount: number;
  status: string;
  paymentUrl: string;
}

export interface UserDepositPaymentDetail {
  paymentId: string;
  totalAmount: number;
  status: string;
  customerName: string;
  paymentUrl: string;
  imageBase64?: string;
  expiredAt: string;
  createdAt: string;
}

export interface UserDepositHistory {
  id: string;
  type: "TOPUP" | "USAGE" | "RESCHEDULE";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string | null;
  paymentId: string;
  status: string;
  createdAt: string;
}

export interface UserDepositHistoryResponse {
  data: UserDepositHistory[];
  totalData: number;
  skip: number;
  limit: number;
  summary: {
    totalTopup: number;
    totalUsage: number;
    totalReschedule: number;
    totalAmount: number;
  };
}

export interface UserDepositUsage {
  id: string;
  type?: "USAGE" | "REFUND";
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string;
  scheduleName: string;
  scheduleDate: string;
  scheduleTime: string;
  venueName: string;
  createdAt: string;
}

export interface UserDepositUsageResponse {
  data: UserDepositUsage[];
  totalData: number;
  skip: number;
  limit: number;
  summary: {
    totalUsage: number;
    totalAmount: number;
  };
}

export interface TopupStatusResponse {
  status: string;
}
