export interface AdminUser {
  id: string;
  user_id: string;
  access_level: "superadmin" | "moderator" | "admin";
  granted_at: string;
  user_profiles?: {
    name: string;
    user_id: string;
  };
}

export interface UserManagement {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gamesPlayed: number;
  isMember: boolean;
  totalPoints: number;
  lastPlayed: string | null;
  createdAt: Date;
}
export interface AdminStats {
  totalPolicies: number;
  pendingVerification: number;
  totalUsers: number;
  activeAdmins: number;
  verificationsToday: number;
  flaggedContent: number;
}

export interface Roles {
  id: string;
  name: string;
}

export interface ReportBooking {
  totalBooking: number;
  totalRevenue: number;
  totalPlayers: number;
  schedules: ScheduleBookingReports[];
  skip: number;
  limit: number;
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface ScheduleBookingReports {
  scheduleId: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  typeMatch: string;
  status: boolean;
  players: number;
  revenue: number;
}

export interface BookingHistory {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  jerseySize: string;
  scheduleName: string;
  venue: string;
  isGk: true;
  isMember: string;
  isPlayer: true;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  playerCount: number;
  totalAmount: number;
  depositUsed: number;
  depositType?: "FULL" | "PARTIAL" | "NONE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  bookedAt: string;
  paymentAt: string;
}

export interface BookingHistoryResponse {
  status: boolean;
  statusCode: number;
  message: string;
  skip: number;
  limit: number;
  totalData: number; // ← Total untuk pagination
  data: BookingHistory[];
}

export interface RefundableBooking {
  id: string;
  bookId: string;
  customerName: string;
  customerPhone: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  totalAmount: number;
  depositUsed: number;
  qrisAmount: number;
}

export interface RefundableBookingResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: RefundableBooking[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface RefundHistoryRecord {
  id: string;
  bookId: string;
  customerName: string;
  customerPhone: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  totalAmount: number;
  depositUsed: number;
  depositType?: "FULL" | "PARTIAL" | "NONE";
  reason: string;
  refundedAt: string;
}

export interface RefundHistoryResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: RefundHistoryRecord[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface RefundRequest {
  bookId: string;
  reason: string;
}

export interface Users {
  phone: string;
  name: string;
  email: string;
}

export interface ListUserMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  validUntil: string;
}

export interface RescheduleManagement {
  id: string;
  bookId: string;
  scheduleId?: string;
  playerName: string;
  playerPhone: string;
  venueName: string;
  venueId: string;
  date: string;
  time: string;
  status: string;
}

export interface DepositHistory {
  id: string;
  total: number;
  createdAt: string;
  isActive: boolean;
  userName: string;
  userPhone: string;
  bookingId: string;
  voucherHistories: VoucherHistory[];
}

export interface VoucherHistory {
  id: string;
  voucherId: string;
  voucherName: string;
  voucherCode: string;
  voucherNominal: number;
  voucherType: string;
  createdAt: string;
}

export interface DepositHistoryRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string | null;
  paymentId: string;
  createdAt: string;
}

export interface DepositUsage {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
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

export interface VoucherHistoryRecord {
  id: string;
  depositId: string;
  userId: string;
  userName: string;
  userPhone: string;
  depositRemaining: number;
  voucherId: string;
  voucherName: string;
  voucherCode: string;
  voucherNominal: number;
  voucherType: string;
  usedBookingId?: string;
  usedScheduleName?: string;
  createdAt: string;
  createdByName: string;
}
