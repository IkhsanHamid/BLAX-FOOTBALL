export interface PaymentStatus {
  imageBase64?: string;
  name: string;
  phone: string;
  total: number;
  bookId: string;
  status: string;
  paymentDate: string;
  paymentTime: string;
  bookingType: string;
  bookingTeam: [];
  matchDate: string;
  matchTime: string;
  scheduleName: string;
  venue: string;
  id: string;
}
export interface PaymentCheckResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: PaymentStatus;
}

export interface PaymentCheckRequest {
  bookingId: string;
}

export interface PaymentDataMember {
  total: number;
  imageBase64: string;
  expired_at: string;
}

export interface PaymentDataBooking {
  name: string;
  phone: string;
  bookId: string;
  total: number;
  baseFee: number;
  discountAmount: number;
  adminFee: number;
  imageBase64: string;
  status: "pending" | "settlement" | "expire";
  scheduleName?: string;
  venue?: string;
  date?: string;
  time?: string;
  bookingType?: string;
  feeGk?: number;
  feePlayer?: number;
  expired_at: string;
  error?: string;
}

export interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentData: PaymentDataBooking;
}
