import { apiClient } from "./api";
import type {
  UserDepositBalance,
  UserDepositTopupResponse,
  UserDepositPaymentDetail,
  UserDepositHistoryResponse,
  UserDepositUsageResponse,
  TopupStatusResponse,
} from "@/types/deposit";

class DepositService {
  async topup(amount: number): Promise<UserDepositTopupResponse> {
    const result = await apiClient.post("/api/v1/deposit/topup", { nominal: amount });
    return result.data;
  }

  async checkPayment(encryptedPaymentId: string): Promise<UserDepositPaymentDetail> {
    const result = await apiClient.get(
      `/api/v1/deposit/payment/${encryptedPaymentId}`,
    );
    return result.data;
  }

  async checkTopupStatus(code: string): Promise<TopupStatusResponse> {
    const result = await apiClient.get(
      `/api/v1/deposit/topup-status?code=${encodeURIComponent(code)}`,
    );
    return result.data;
  }

  async getBalance(): Promise<UserDepositBalance> {
    const result = await apiClient.get("/api/v1/deposit/balance");
    return result.data;
  }

  async getHistory(
    skip = 0,
    limit = 10,
  ): Promise<UserDepositHistoryResponse> {
    const result = await apiClient.get(
      `/api/v1/deposit/history?skip=${skip}&limit=${limit}`,
    );
    return result;
  }

  async getUsage(
    skip = 0,
    limit = 10,
  ): Promise<UserDepositUsageResponse> {
    const result = await apiClient.get(
      `/api/v1/deposit/usage?skip=${skip}&limit=${limit}`,
    );
    return result;
  }
}

export const depositService = new DepositService();
