import { apiClient } from "./api";
import { Voucher, VoucherPayload, UserVoucher } from "@/types/voucher";

class VoucherService {
  // Admin voucher management
  async getVouchers(
    search?: string,
    page?: number,
    limit?: number
  ): Promise<{
    data: Voucher[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryParams = new URLSearchParams();
    // if (search) queryParams.append("search", search);
    // if (page) queryParams.append("page", page.toString());
    // if (limit) queryParams.append("limit", limit.toString());

    const response = await apiClient.get(
      `/api/v1/vouchers/vouchers-data?${queryParams}`
    );
    return response;
  }

  async createVoucher(data: VoucherPayload): Promise<Voucher> {
    const response = await apiClient.post("/api/v1/vouchers/add-voucher", data);
    return response.data;
  }

  async updateVoucher(id: string, data: VoucherPayload): Promise<Voucher> {
    const response = await apiClient.put(
      `/api/v1/vouchers/update-voucher/${id}`,
      data
    );
    return response.data;
  }

  async deleteVoucher(id: string): Promise<void> {
    await apiClient.delete(`/api/v1/vouchers/delete-voucher/${id}`);
  }

  // User voucher access
  async getUserVouchers(): Promise<UserVoucher[]> {
    const response = await apiClient.get("/api/v1/vouchers/user-vouchers");
    return response.data;
  }

  async applyVoucher(
    voucherId: string,
    bookingId: string
  ): Promise<{
    success: boolean;
    discountAmount: number;
    finalAmount: number;
    error?: string;
  }> {
    const response = await apiClient.post("/api/v1/vouchers/apply", {
      voucherId,
      bookingId,
    });
    return response.data;
  }

  async voucherUser(): Promise<UserVoucher[]> {
    const response = await apiClient.get("/api/v1/vouchers/voucher-user");
    return response.data;
  }

  async assignToUser(voucherId: string, userId: string): Promise<any> {
    const response = await apiClient.post("/api/v1/vouchers/assign-voucher", {
      voucherId,
      userId,
    });
    return response.data;
  }

  async listAssignVoucher(voucherId: string) {
    const response = await apiClient.get(
      `/api/v1/vouchers/list-assign-users/${voucherId}`
    );
    return response.data;
  }

  async removeAssignment(id: string) {
    const response = await apiClient.delete(
      `/api/v1/vouchers/remove-assignment/${id}`
    );
    return response;
  }

  async voucherAvailable() {
    const response = await apiClient.get(
      `/api/v1/vouchers/list-voucher-available`
    );
    return response.data;
  }

  async redeemVoucher(voucherId: string) {
    const response = await apiClient.post(
      `/api/v1/vouchers/redeem-voucher/${voucherId}`
    );

    return response;
  }

  async validateVoucher(code: string) {
    const response = await apiClient.post(`/api/v1/vouchers/check-voucher`, {
      code,
    });

    return response;
  }
}

export const voucherService = new VoucherService();
