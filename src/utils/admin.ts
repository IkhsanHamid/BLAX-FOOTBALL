import {
  ListSchedule,
  MasterTeamCreatePayload,
  MasterTeamDetailResponse,
  MasterTeamListResponse,
  MasterTeamUpdatePayload,
  PendingVerificationResponse,
  RejectedScheduleResponse,
  ScheduleDetailResponse,
  ScheduleMatchBulkPayload,
  ScheduleMatchListResponse,
  ScheduleMatchUpdatePayload,
  ScheduleOverview,
  VerificationDetailResponse,
  VerifyScheduleRequest,
} from "@/types/schedule";
import { apiClient } from "./api";
import {
  BookingHistory,
  BookingHistoryResponse,
  CreateFreeMembershipPayload,
  CreateFreeMembershipResponse,
  DepositHistory,
  DepositHistoryRecord,
  DepositUsage,
  ListUserMember,
  NonMemberSearchResponse,
  RefundHistoryResponse,
  RefundableBookingResponse,
  ReportBooking,
  RescheduleManagement,
  Roles,
  UserManagement,
  Users,
  VoucherHistoryRecord,
  BracketResponse,
  GenerateBracketPayload,
  MatchDetailResponse,
  UpdateMatchPayload,
  AddGoalPayload,
  AddGoalResponse,
  TopScorerResponse,
  StandingResponse,
  MatchPlayersResponse,
  AttendanceChecklistResponse,
  UpdateAttendancePayload,
  CompleteSchedulePayload,
  AttendanceHistoryResponse,
} from "@/types/admin";
import { News } from "@/types/news";
import { GalleriesRequest, GalleryData } from "@/types/galleries";

function buildMasterTeamFormData(
  payload: MasterTeamCreatePayload | MasterTeamUpdatePayload,
): FormData {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.hexColor !== undefined && payload.hexColor !== null) {
    formData.append("hexColor", payload.hexColor);
  }
  if (payload.image instanceof File) {
    formData.append("image", payload.image);
  } else if (typeof payload.image === "string" && payload.image) {
    formData.append("image", payload.image);
  }
  return formData;
}

class AdminService {
  // User Management
  async getAllUsers(
    limit?: number,
    offset?: number,
    search?: string,
  ): Promise<{
    users: UserManagement[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      totalPages: number;
      currentPages: number;
      totalMembership: number;
      totalUsers: number;
      totalStaff: number;
      totalNewThisMonth: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (offset) queryParams.append("skip", offset.toString());
      if (search) queryParams.append("name", search);

      const result = await apiClient.get(
        `/api/v1/users/allUsers?${queryParams}`,
      );
      return {
        users: result.data || [],
        pagination: {
          total: result.totalData,
          limit: result.limit,
          offset: result.skip,
          totalPages: result.totalPages,
          currentPages: result.currentPages,
          totalMembership: result.totalMembership,
          totalUsers: result.totalUsers,
          totalStaff: result.totalStaff,
          totalNewThisMonth: result.totalNewThisMonth,
        },
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        users: [],
        pagination: {
          total: 0,
          limit: limit || 20,
          offset: offset || 0,
          totalPages: 0,
          currentPages: 0,
          totalMembership: 0,
          totalUsers: 0,
          totalStaff: 0,
          totalNewThisMonth: 0,
        },
      };
    }
  }

  async scheduleOverview(
    startDate?: String,
    endDate?: String,
    venue?: string,
  ): Promise<ScheduleOverview[]> {
    const queryParams = new URLSearchParams();

    if (startDate) queryParams.append("startDate", startDate.toString());
    if (endDate) queryParams.append("endDate", endDate.toString());
    if (venue) queryParams.append("venue", venue.toString());

    const response = await apiClient.get(
      `/api/v1/matches/schedules-overview?${queryParams}`,
    );

    return response.data;
  }

  async createNews(newsData: FormData): Promise<any> {
    try {
      const response = await apiClient.post("/api/v1/news/add-news", newsData);
      return response;
    } catch (error) {
      console.error("Error creating news:", error);
      return null;
    }
  }

  async updateNews(id: string, newsData: FormData): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/v1/news/update-news/${id}`,
        newsData,
      );
      return response;
    } catch (error) {
      console.error("Error updating news:", error);
      return null;
    }
  }

  async deleteNews(id: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/news/delete-news?id=${id}`,
      );
      return response;
    } catch (error) {
      console.error("Error deleteing news:", error);
      return null;
    }
  }

  async createSchedule(scheduleData: FormData): Promise<any> {
    try {
      const response = await apiClient.post(
        "/api/v1/matches/add-schedules",
        scheduleData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating schedule:", error);
      throw error;
    }
  }

  async updateSchedule(id: string, scheduleData: FormData): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/v1/matches/update-schedule?id=${id}`,
        scheduleData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  }

  async getScheduleDetail(id: string): Promise<ScheduleDetailResponse> {
    try {
      const response = await apiClient.get(`/api/v1/matches/schedule/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching schedule detail:", error);
      throw error;
    }
  }

  async getMasterTeams(
    search?: string,
    skip?: number,
    limit?: number,
  ): Promise<MasterTeamListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        `/api/v1/teams?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching master teams:", error);
      throw error;
    }
  }

  async getMasterTeam(id: string): Promise<MasterTeamDetailResponse> {
    try {
      const response = await apiClient.get(`/api/v1/teams/${id}`);
      return response;
    } catch (error) {
      console.error("Error fetching master team:", error);
      throw error;
    }
  }

  async createMasterTeam(
    payload: MasterTeamCreatePayload,
  ): Promise<MasterTeamDetailResponse> {
    try {
      const body =
        payload.image instanceof File
          ? buildMasterTeamFormData(payload)
          : payload;
      const response = await apiClient.post(`/api/v1/teams`, body);
      return response;
    } catch (error) {
      console.error("Error creating master team:", error);
      throw error;
    }
  }

  async updateMasterTeam(
    id: string,
    payload: MasterTeamUpdatePayload,
  ): Promise<MasterTeamDetailResponse> {
    try {
      const body =
        payload.image instanceof File
          ? buildMasterTeamFormData(payload)
          : payload;
      const response = await apiClient.put(`/api/v1/teams/${id}`, body);
      return response;
    } catch (error) {
      console.error("Error updating master team:", error);
      throw error;
    }
  }

  async deleteMasterTeam(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/v1/teams/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting schedule team:", error);
      throw error;
    }
  }

  async getScheduleMatches(
    scheduleId: string,
  ): Promise<ScheduleMatchListResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/schedule/${scheduleId}/matches`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching schedule matches:", error);
      throw error;
    }
  }

  async bulkReplaceScheduleMatches(
    scheduleId: string,
    payload: ScheduleMatchBulkPayload,
  ): Promise<ScheduleMatchListResponse> {
    try {
      const response = await apiClient.post(
        `/api/v1/schedule/${scheduleId}/matches`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error bulk replacing schedule matches:", error);
      throw error;
    }
  }

  async updateScheduleMatch(
    id: string,
    payload: ScheduleMatchUpdatePayload,
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/v1/schedule-matches/${id}`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error updating schedule match:", error);
      throw error;
    }
  }

  async deleteScheduleMatch(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/v1/schedule-matches/${id}`);
      return response;
    } catch (error) {
      console.error("Error deleting schedule match:", error);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(
        `/api/v1/matches/delete-schedule?id=${id}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting schedule:", error);
      throw error;
    }
  }

  async getPendingVerification(
    skip?: number,
    limit?: number,
  ): Promise<PendingVerificationResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        `/api/v1/matches/pending-verification?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching pending verification:", error);
      throw error;
    }
  }

  async getVerificationDetail(id: string): Promise<VerificationDetailResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/matches/verification/${id}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching verification detail:", error);
      throw error;
    }
  }

  async verifySchedule(data: VerifyScheduleRequest): Promise<any> {
    try {
      const response = await apiClient.post(`/api/v1/matches/verify`, data);
      return response;
    } catch (error) {
      console.error("Error verifying schedule:", error);
      throw error;
    }
  }

  async getRejectedSchedules(
    skip?: number,
    limit?: number,
  ): Promise<RejectedScheduleResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        `/api/v1/matches/rejected?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching rejected schedules:", error);
      throw error;
    }
  }

  async reviseSchedule(id: string, formData: FormData): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/v1/matches/revision/${id}`,
        formData,
      );
      return response;
    } catch (error) {
      console.error("Error revising schedule:", error);
      throw error;
    }
  }

  async toggleScheduleIsOpen(id: string, isOpen: boolean): Promise<any> {
    try {
      const response = await apiClient.patch(`/api/v1/matches/toggle-is-open`, {
        id,
        isOpen,
      });
      return response.data;
    } catch (error) {
      console.error("Error toggling schedule isOpen:", error);
      throw error;
    }
  }

  async getRoles(): Promise<Roles[]> {
    try {
      const response = await apiClient.get(`/api/v1/roles/getRoles`);
      return response.data || [];
    } catch (error) {
      console.error("Error fetching roles:", error);
      return [];
    }
  }

  async reportBooking(
    startDate?: string,
    endDate?: string,
    skip?: 0 | number,
    limit?: 10 | number,
    venueId?: string,
    community?: string,
  ): Promise<ReportBooking> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());
      if (venueId) queryParams.append("venueId", venueId.toString());
      if (community) queryParams.append("community", community.toString());

      const response = await apiClient.get(
        "/api/v1/reports/booking-reports?" + queryParams,
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getScheduleBookings(id: string, type?: string): Promise<any> {
    try {
      const query = type ? `?type=${type}` : "";
      const response = await apiClient.get(
        `/api/v1/reports/booking-report-detail/${id}${query}`,
      );
      const data = response?.data ?? response ?? {};
      return {
        ...data,
        bookings: Array.isArray(data.bookings) ? data.bookings : [],
      };
    } catch (error) {
      throw error;
    }
  }

  async membershipReport(
    startDate: string,
    endDate: string,
    name?: string,
    skip?: 0 | number,
    limit?: 10 | number,
    orderBy?: "desc" | string,
  ) {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      if (name) queryParams.append("name", name.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());
      if (orderBy) queryParams.append("orderBy", orderBy.toString());

      const response = await apiClient.get(
        "/api/v1/reports/membership-detail?" + queryParams,
      );

      return response;
    } catch (error) {
      throw error;
    }
  }

  async memberStatsReport(
    sortBy?: string,
    sortType?: string,
    skip?: 0 | number,
    limit?: 10 | number,
    name?: string,
    memberStatus?: string,
    dateFrom?: string,
    dateTo?: string,
    isNew?: boolean,
  ) {
    const queryParams = new URLSearchParams();

    if (name) queryParams.append("name", name);
    if (skip !== undefined) queryParams.append("skip", skip.toString());
    if (limit) queryParams.append("limit", limit.toString());
    if (sortBy) queryParams.append("sortBy", sortBy);
    if (sortType) queryParams.append("sortType", sortType);
    if (memberStatus) queryParams.append("memberStatus", memberStatus);
    if (dateFrom) queryParams.append("dateFrom", dateFrom);
    if (dateTo) queryParams.append("dateTo", dateTo);
    if (isNew !== undefined) queryParams.append("isNew", isNew.toString());

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/v1/reports/members-statistic?${queryString}`
      : "/api/v1/reports/members-statistic";

    const response = await apiClient.get(endpoint);

    return response;
  }

  async historyRecentBooking(
    startDate?: string,
    endDate?: string,
    status?: string,
    search?: string,
    skip?: number,
    limit?: number,
    scheduleId?: string,
  ): Promise<BookingHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      if (status) queryParams.append("paymentStatus", status.toString());
      if (search) queryParams.append("keyword", search.toString());
      if (scheduleId) queryParams.append("scheduleId", scheduleId.toString());
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        "/api/v1/booking/recent-booking?" + queryParams,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getRefundableBookings(
    search?: string,
    skip?: number,
    limit?: number,
  ): Promise<RefundableBookingResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        `/api/v1/booking/refundable?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async refundBooking(data: { bookId: string; reason: string }) {
    try {
      const response = await apiClient.post(`/api/v1/booking/refund`, data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async getRefundHistory(
    search?: string,
    skip?: number,
    limit?: number,
  ): Promise<RefundHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        `/api/v1/booking/refund-history?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  async addStaff(data: Users) {
    try {
      const response = await apiClient.post(`/api/v1/users/addStaff`, data);
      return response.data;
    } catch (error) {
      console.error("Error create staff:", error);
      throw error;
    }
  }

  async editStaff(id: string, data: Users) {
    try {
      const response = await apiClient.put(
        `/api/v1/users/updateUser?userId=${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async removeUser(id: string) {
    try {
      const response = await apiClient.delete(`/api/v1/users/removeUser/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async listMemberUser(search?: string): Promise<ListUserMember[]> {
    const response = await apiClient.get(
      `/api/v1/users/list-membership?search=${search}`,
    );
    return response.data;
  }

  async addGallery(payload: GalleriesRequest) {
    try {
      const response = await apiClient.post(
        `/api/v1/galleries/add-gallery`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error create galery:", error);
      throw error;
    }
  }

  async galleriesDatas(
    scheduleId?: string,
    skip?: number,
    limit?: number,
  ): Promise<GalleryData[]> {
    try {
      const queryParams = new URLSearchParams();
      if (scheduleId) queryParams.append("scheduleId", scheduleId.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());
      const response = await apiClient.get(
        `/api/v1/galleries/galleries-data?${queryParams}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error get galeries data:", error);
      throw error;
    }
  }

  async listSchedule(): Promise<ListSchedule[]> {
    try {
      const response = await apiClient.get(`/api/v1/matches/list-schedule`);
      return response.data;
    } catch (error: any) {
      console.error("Error get list schedule data:", error);
      throw error;
    }
  }

  async listScheduleActive(): Promise<ListSchedule[]> {
    try {
      const response = await apiClient.get(
        `/api/v1/matches/list-schedule-active`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error get list schedule active data:", error);
      throw error;
    }
  }

  async listScheduleActiveByVenue(
    venueId: string,
    scheduleId?: string,
  ): Promise<ListSchedule[]> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("venueId", venueId);
      if (scheduleId) queryParams.append("scheduleId", scheduleId);
      const response = await apiClient.get(
        `/api/v1/matches/list-schedule-active-by-venue?${queryParams}`,
      );
      return response.data;
    } catch (error: any) {
      console.error("Error get list schedule active by venue data:", error);
      throw error;
    }
  }

  async deleteGallery(id: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/galleries/delete-gallery/${id}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error delete gallery:", error);
      throw error;
    }
  }

  async updateGallery(id: string, payload: GalleriesRequest) {
    try {
      const response = await apiClient.put(
        `/api/v1/galleries/update-gallery/${id}`,
        payload,
      );
      return response.data;
    } catch (error) {
      console.error("Error delete gallery:", error);
      throw error;
    }
  }

  async lockSlots(scheduleId: string, slotGk: number, slotPlayer: number) {
    try {
      const response = await apiClient.put(`/api/v1/matches/lock-slots`, {
        slotGk,
        slotPlayer,
        scheduleId,
      });
      return response.data;
    } catch (error) {
      console.error("Error lock slots:", error);
      throw error;
    }
  }

  async lockSlotsEvent(
    eventTeamId: string,
    slotGk: number,
    slotPlayer: number,
  ) {
    try {
      const response = await apiClient.put(`/api/v1/events/lock-slots`, {
        slotGk,

        slotPlayer,
        eventTeamId,
      });
      return response.data;
    } catch (error) {
      console.error("Error lock slots:", error);
      throw error;
    }
  }

  async listAvailReschedule(skip: number, limit: number, search: string) {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/reschedule/list-available-reschedule?${queryParams}`,
      );

      return result;
    } catch (error) {
      throw error;
    }
  }

  async createRescheduleRecord(
    bookId: string,
    reason: string,
    scheduleId?: string,
  ) {
    const payload: Record<string, string> = { bookId, reason };
    if (scheduleId) payload.scheduleId = scheduleId;
    const response = await apiClient.post("/api/v1/reschedule", payload);
    return response;
  }

  async historyReschedule(skip: number, limit: number, search: string) {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit.toString());
    if (skip) queryParams.append("skip", skip.toString());
    if (search) queryParams.append("search", search);

    const result = await apiClient.get(
      `/api/v1/reschedule/histories?${queryParams}`,
    );

    return result;
  }

  async createVoucher(
    depositId: string,
    nominal: number,
    name?: string,
    description?: string,
  ) {
    try {
      const payload: Record<string, unknown> = { depositId, nominal };
      if (name) payload.name = name;
      if (description) payload.description = description;

      const response = await apiClient.post(
        `/api/v1/deposit/create-voucher`,
        payload,
      );
      return response;
    } catch (error: any) {
      console.error("Error create voucher:", error);
      throw error;
    }
  }

  async getDepositHistories(
    skip?: number,
    limit?: number,
    search?: string,
  ): Promise<{
    data: DepositHistory[];
    totalData: number;
    skip: number;
    limit: number;
    summary: { totalRemainingDeposit: number };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/histories?${queryParams}`,
      );

      return result;
    } catch (error: any) {
      console.error("Error get deposit histories:", error);
      throw error;
    }
  }

  async getVoucherHistories(
    skip?: number,
    limit?: number,
    search?: string,
  ): Promise<{
    data: VoucherHistoryRecord[];
    totalData: number;
    skip: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/voucher-histories?${queryParams}`,
      );

      return result;
    } catch (error: any) {
      console.error("Error get voucher histories:", error);
      throw error;
    }
  }

  async exportDepositHistories(search?: string): Promise<{
    data: DepositHistory[];
    totalData: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/histories?${queryParams}&limit=1`,
      );

      const totalData = result.totalData || 0;
      if (totalData === 0) {
        return { data: [], totalData: 0 };
      }

      const exportParams = new URLSearchParams();
      if (search) exportParams.append("search", search);
      exportParams.append("limit", totalData.toString());

      const exportResult = await apiClient.get(
        `/api/v1/deposit/histories?${exportParams}`,
      );

      return { data: exportResult.data, totalData };
    } catch (error: any) {
      console.error("Error export deposit histories:", error);
      throw error;
    }
  }

  async exportVoucherHistories(search?: string): Promise<{
    data: VoucherHistoryRecord[];
    totalData: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/voucher-histories?${queryParams}&limit=1`,
      );

      const totalData = result.totalData || 0;
      if (totalData === 0) {
        return { data: [], totalData: 0 };
      }

      const exportParams = new URLSearchParams();
      if (search) exportParams.append("search", search);
      exportParams.append("limit", totalData.toString());

      const exportResult = await apiClient.get(
        `/api/v1/deposit/voucher-histories?${exportParams}`,
      );

      return { data: exportResult.data, totalData };
    } catch (error: any) {
      console.error("Error export voucher histories:", error);
      throw error;
    }
  }

  async getDepositUsages(
    skip?: number,
    limit?: number,
    search?: string,
  ): Promise<{
    data: DepositUsage[];
    totalData: number;
    skip: number;
    limit: number;
    summary: { totalUsage: number; totalAmount: number };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/admin/usages?${queryParams}`,
      );

      return result;
    } catch (error: any) {
      console.error("Error get deposit usages:", error);
      throw error;
    }
  }

  async getAdminDepositHistories(
    skip?: number,
    limit?: number,
    search?: string,
  ): Promise<{
    data: DepositHistoryRecord[];
    totalData: number;
    skip: number;
    limit: number;
    summary: { totalActiveBalance: number };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/admin/histories?${queryParams}`,
      );

      return result;
    } catch (error: any) {
      console.error("Error get admin deposit histories:", error);
      throw error;
    }
  }

  async exportAdminDepositHistories(search?: string): Promise<{
    data: DepositHistoryRecord[];
    totalData: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const result = await apiClient.get(
        `/api/v1/deposit/admin/histories?${queryParams}&limit=1`,
      );

      const totalData = result.totalData || 0;
      if (totalData === 0) {
        return { data: [], totalData: 0 };
      }

      const exportParams = new URLSearchParams();
      if (search) exportParams.append("search", search);
      exportParams.append("limit", totalData.toString());

      const exportResult = await apiClient.get(
        `/api/v1/deposit/admin/histories?${exportParams}`,
      );

      return { data: exportResult.data, totalData };
    } catch (error: any) {
      console.error("Error export admin deposit histories:", error);
      throw error;
    }
  }

  async changeNameTeam(
    scheduleId: string,
    nameTeam: string,
    teamExist: string,
  ) {
    const result = await apiClient.post(`/api/v1/lineup/name-team`, {
      scheduleId,
      nameTeam,
      teamExist,
    });

    return result;
  }

  async getBookingPlayers(bookingId: string) {
    const result = await apiClient.get(
      `/api/v1/booking/booking-team/${bookingId}`,
    );

    return result;
  }

  async postEvent(eventData: FormData): Promise<any> {
    const response = await apiClient.post("/api/v1/events", eventData);
    return response.data;
  }

  async getEvents(): Promise<[]> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/events`,
      {
        method: "GET",
        headers: {},
      },
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Something went wrong!");
    }
    return result.data;
  }

  async getAdminEvents(): Promise<[]> {
    try {
      const response = await apiClient.get("/api/v1/events/admin");
      return response.data;
    } catch (error) {
      console.error("Error fetching admin events:", error);
      throw error;
    }
  }

  async getEventDetail(id: string) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/events/${id}`,
      {
        method: "GET",
        headers: {},
      },
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "Something went wrong!");
    }
    return result.data;
  }

  async getEventLineup(
    id: string,
  ): Promise<{ data: any[] | null; locked: boolean }> {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BE}/api/v1/events/${id}/lineup`,
      {
        method: "GET",
        headers: {},
      },
    );
    const result = await response.json();
    if (response.status === 404) {
      return { data: [], locked: false };
    }
    if (response.status === 403) {
      return { data: null, locked: true };
    }
    if (!response.ok) {
      throw new Error(result.message || result.error || "Gagal memuat lineup");
    }
    return { data: result.data ?? [], locked: false };
  }

  async editEvents(id: string, eventData: FormData): Promise<any> {
    try {
      const response = await apiClient.put(`/api/v1/events/${id}`, eventData);
      return response.data;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  async deleteEvent(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/api/v1/events/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }

  async toggleEventOpen(id: string, data: { isOpen: boolean }) {
    try {
      const response = await apiClient.patch(`/api/v1/events`, {
        id,
        status: data.isOpen,
      });
      return response;
    } catch (error) {
      console.error("Error toggling event status:", error);
      throw error;
    }
  }

  async searchNonMembers(search?: string): Promise<NonMemberSearchResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);

      const response = await apiClient.get(
        `/api/v1/member/search-non-member?${queryParams.toString()}`,
      );
      return response;
    } catch (error) {
      console.error("Error searching non-members:", error);
      throw error;
    }
  }

  async createFreeMembership(
    payload: CreateFreeMembershipPayload,
  ): Promise<CreateFreeMembershipResponse> {
    try {
      const response = await apiClient.post(
        `/api/v1/member/create-free`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error creating free membership:", error);
      throw error;
    }
  }

  async getBracket(eventId: string): Promise<BracketResponse> {
    try {
      const response = await apiClient.get(`/api/v1/events/${eventId}/bracket`);
      return response;
    } catch (error) {
      console.error("Error fetching bracket:", error);
      throw error;
    }
  }

  async generateBracket(
    eventId: string,
    payload: GenerateBracketPayload,
  ): Promise<BracketResponse> {
    try {
      const response = await apiClient.post(
        `/api/v1/events/${eventId}/bracket`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error generating bracket:", error);
      throw error;
    }
  }

  async getMatchDetail(
    eventId: string,
    matchId: string,
  ): Promise<MatchDetailResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/events/${eventId}/matches/${matchId}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching match detail:", error);
      throw error;
    }
  }

  async updateMatch(
    eventId: string,
    matchId: string,
    payload: UpdateMatchPayload,
  ): Promise<MatchDetailResponse> {
    try {
      const response = await apiClient.put(
        `/api/v1/events/${eventId}/matches/${matchId}`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error updating match:", error);
      throw error;
    }
  }

  async addGoal(
    eventId: string,
    matchId: string,
    payload: AddGoalPayload,
  ): Promise<AddGoalResponse> {
    try {
      const response = await apiClient.post(
        `/api/v1/events/${eventId}/matches/${matchId}/goals`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error adding goal:", error);
      throw error;
    }
  }

  async deleteGoal(
    eventId: string,
    matchId: string,
    goalId: string,
  ): Promise<any> {
    try {
      const response = await apiClient.delete(
        `/api/v1/events/${eventId}/matches/${matchId}/goals/${goalId}`,
      );
      return response;
    } catch (error) {
      console.error("Error deleting goal:", error);
      throw error;
    }
  }

  async getTopScorers(eventId: string): Promise<TopScorerResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/events/${eventId}/top-scorers`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching top scorers:", error);
      throw error;
    }
  }

  async deleteBracket(eventId: string): Promise<any> {
    try {
      const response = await apiClient.delete(
        `/api/v1/events/${eventId}/bracket`,
      );
      return response;
    } catch (error) {
      console.error("Error deleting bracket:", error);
      throw error;
    }
  }

  async getStandings(eventId: string): Promise<StandingResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/events/${eventId}/standings`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching standings:", error);
      throw error;
    }
  }

  async getMatchPlayers(
    eventId: string,
    matchId: string,
  ): Promise<MatchPlayersResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/events/${eventId}/matches/${matchId}/players`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching match players:", error);
      throw error;
    }
  }

  async getAttendanceChecklist(
    scheduleId: string,
  ): Promise<AttendanceChecklistResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/attendance/checklist/${scheduleId}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching attendance checklist:", error);
      throw error;
    }
  }

  async updateAttendance(
    lineupId: string,
    payload: UpdateAttendancePayload,
  ): Promise<any> {
    try {
      const response = await apiClient.put(
        `/api/v1/attendance/lineup/${lineupId}`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error updating attendance:", error);
      throw error;
    }
  }

  async completeSchedule(
    scheduleId: string,
    payload: CompleteSchedulePayload,
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/v1/attendance/schedule/${scheduleId}/complete`,
        payload,
      );
      return response;
    } catch (error) {
      console.error("Error completing schedule:", error);
      throw error;
    }
  }

  async getAttendanceHistory(
    scheduleId: string,
  ): Promise<AttendanceHistoryResponse> {
    try {
      const response = await apiClient.get(
        `/api/v1/attendance/schedule/${scheduleId}/history`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching attendance history:", error);
      throw error;
    }
  }

  async deleteRejectedSchedule(scheduleId: string): Promise<any> {
    try {
      const response = await apiClient.delete(
        `/api/v1/matches/rejected/${scheduleId}`,
      );
      return response;
    } catch (error) {
      console.error("Error deleting rejected schedule:", error);
      throw error;
    }
  }

  async getAdvancePreview(
    eventId: string,
    advancePerGroup: number = 2,
  ): Promise<any> {
    try {
      const response = await apiClient.get(
        `/api/v1/events/${eventId}/bracket/advance-preview?advancePerGroup=${advancePerGroup}`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching advance preview:", error);
      throw error;
    }
  }

  async autoAdvance(
    eventId: string,
    advancePerGroup: number = 2,
  ): Promise<any> {
    try {
      const response = await apiClient.post(
        `/api/v1/events/${eventId}/bracket/advance`,
        { advancePerGroup },
      );
      return response;
    } catch (error) {
      console.error("Error auto advancing:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
