import {
  PaymentStatus,
  PaymentCheckRequest,
  PaymentCheckResponse,
} from "@/types/payment";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BE}/api/v1/booking`;
const API_BASE_URL_MEMBER = `${process.env.NEXT_PUBLIC_BE}/api/v1/member`;

class PaymentService {
  async checkPaymentStatus(bookingId: string): Promise<PaymentCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/check-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bookingId }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Something went wrong!");
    }

    return result;
  }

  async getPaymentDetails(paymentId: string): Promise<PaymentStatus | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/details/${paymentId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch payment details");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return null;
    }
  }

  async checkPaymentStatusMembership(paymentId: string) {
    const data = {
      statusId: paymentId,
    };
    const response = await fetch(`${API_BASE_URL_MEMBER}/status`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong!");
    }

    return result.data;
  }

  async showQRMember(paymentId: string) {
    const data = {
      id: paymentId,
    };
    const response = await fetch(`${API_BASE_URL_MEMBER}/image`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong!");
    }

    return result.data;
  }

  async setupMemberPayment(userId: string) {
    const data = {
      userId,
    };

    const response = await fetch(`${API_BASE_URL_MEMBER}/setup-member`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Something went wrong!");
    }

    return result.data;
  }
}

export const paymentService = new PaymentService();
