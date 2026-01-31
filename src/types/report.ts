export interface HistoryBooking {
  quantity: number;
  bookingType: string;
  createdAt: string;
  scheduleName: string;
  scheduleDate: string;
  scheduleTime: string;
}

export interface MemberStatistic {
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  isMember: boolean;
  totalBooking: number;
  historyBookings: HistoryBooking[];
}

export interface MemberStatisticResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: MemberStatistic[];
  meta: {
    total: number;
    limit: number;
    skip: number;
    totalPages: number;
    currentPage: number;
  };
}

export interface MemberStatisticTabProps {
  startDate: string;
  endDate: string;
}

export type SortField = "totalBooking" | "name" | "createdAt";
export type SortType = "asc" | "desc";
export type MemberStatus = "all" | "member" | "non-member";
