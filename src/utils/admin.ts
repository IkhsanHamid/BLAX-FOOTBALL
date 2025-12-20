import { ListSchedule, ScheduleOverview } from "@/types/schedule";
import { apiClient } from "./api";
import {
  BookingHistory,
  BookingHistoryResponse,
  ListUserMember,
  ReportBooking,
  Roles,
  UserManagement,
  Users,
} from "@/types/admin";
import { News } from "@/types/news";
import { GalleriesRequest, GalleryData } from "@/types/galleries";

class AdminService {
  // User Management
  async getAllUsers(
    limit?: number,
    offset?: number,
    search?: string
  ): Promise<{
    users: UserManagement[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      totalPages: number;
      currentPages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append("limit", limit.toString());
      if (offset) queryParams.append("skip", offset.toString());
      if (search) queryParams.append("name", search);

      const result = await apiClient.get(
        `/api/v1/users/allUsers?${queryParams}`
      );
      return {
        users: result.data || [],
        pagination: {
          total: result.totalData,
          limit: result.limit,
          offset: result.skip,
          totalPages: result.totalPages,
          currentPages: result.currentPages,
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
        },
      };
    }
  }

  async scheduleOverview(
    startDate?: String,
    endDate?: String,
    venue?: string
  ): Promise<ScheduleOverview[]> {
    const queryParams = new URLSearchParams();

    if (startDate) queryParams.append("startDate", startDate.toString());
    if (endDate) queryParams.append("endDate", endDate.toString());
    if (venue) queryParams.append("venue", venue.toString());

    const response = await apiClient.get(
      `/api/v1/matches/schedules-overview?${queryParams}`
    );

    return response.data;
  }

  async createNews(newsData: FormData): Promise<News | null> {
    try {
      const response = await apiClient.post("/api/v1/news/add-news", newsData);
      return response.data;
    } catch (error) {
      console.error("Error creating news:", error);
      return null;
    }
  }

  async updateNews(id: string, newsData: FormData): Promise<News | null> {
    try {
      const response = await apiClient.put(
        `/api/v1/news/update-news/${id}`,
        newsData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating news:", error);
      return null;
    }
  }

  async createSchedule(scheduleData: FormData): Promise<any> {
    try {
      const response = await apiClient.post(
        "/api/v1/matches/add-schedules",
        scheduleData
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
        scheduleData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating schedule:", error);
      throw error;
    }
  }

  async deleteSchedule(id: string): Promise<any> {
    try {
      const response = await apiClient.delete(
        `/api/v1/matches/delete-schedule?id=${id}`
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting schedule:", error);
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
    endDate?: string
  ): Promise<ReportBooking> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      const response = await apiClient.get(
        "/api/v1/reports/booking-reports?" + queryParams
      );

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async historyRecentBooking(
    startDate?: string,
    endDate?: string,
    status?: string,
    search?: string,
    skip?: number,
    limit?: number
  ): Promise<BookingHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      if (status) queryParams.append("paymentStatus", status.toString());
      if (search) queryParams.append("keyword", search.toString());
      if (skip !== undefined) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());

      const response = await apiClient.get(
        "/api/v1/booking/recent-booking?" + queryParams
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
        `/api/v1/users/updateStaff/${id}`,
        data
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

  async listMemberUser(): Promise<ListUserMember[]> {
    const response = await apiClient.get(`/api/v1/users/list-membership`);
    return response.data;
  }

  async addGallery(payload: GalleriesRequest) {
    try {
      const response = await apiClient.post(
        `/api/v1/galleries/add-gallery`,
        payload
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
    limit?: number
  ): Promise<GalleryData[]> {
    try {
      const queryParams = new URLSearchParams();
      if (scheduleId) queryParams.append("scheduleId", scheduleId.toString());
      if (skip) queryParams.append("skip", skip.toString());
      if (limit) queryParams.append("limit", limit.toString());
      const response = await apiClient.get(
        `/api/v1/galleries/galleries-data?${queryParams}`
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

  async deleteGallery(id: string) {
    try {
      const response = await apiClient.delete(
        `/api/v1/galleries/delete-gallery/${id}`
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
        payload
      );
      return response.data;
    } catch (error) {
      console.error("Error delete gallery:", error);
      throw error;
    }
  }

  async lockSlots(scheduleId: string, slot: number) {
    try {
      const response = await apiClient.put(`/api/v1/matches/lock-slots`, {
        slot,
        scheduleId,
      });
      return response.data;
    } catch (error) {
      console.error("Error lock slots:", error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
