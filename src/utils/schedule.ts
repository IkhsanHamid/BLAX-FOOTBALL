import { Schedule, ScheduleDetail, ScheduleMatch } from "@/types/schedule";
import { apiClient } from "./api";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BE}/api/v1/matches`;

class ScheduleService {
  async getSchedules(
    email?: string,
    startDate?: Date,
    endDate?: Date,
    venue?: string,
  ): Promise<Schedule[] | null> {
    try {
      const queryParams = new URLSearchParams();

      if (startDate) queryParams.append("startDate", startDate.toString());
      if (endDate) queryParams.append("endDate", endDate.toString());
      if (venue) queryParams.append("venue", venue.toString());
      if (email) queryParams.append("email", email.toString());

      const response = await fetch(`${API_BASE_URL}/schedules?${queryParams}`, {
        method: "GET",
        headers: {},
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Something went wrong!");
      }

      return result.data;
    } catch (error) {
      return null;
    }
  }

  async scheduleDetail(
    id: string,
    email: string | undefined,
  ): Promise<ScheduleDetail | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/schedule-detail?id=${id}&email=${email}`,
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
    } catch (error) {
      return null;
    }
  }

  async getScheduleMatches(
    scheduleId: string,
  ): Promise<ScheduleMatch[] | null> {
    try {
      const response = await apiClient.get(
        `/api/v1/schedule/${scheduleId}/matches`,
      );
      // API wraps array in { status, code, message, data: [...] }
      // Try multiple known shapes
      let list: any = response?.data?.data;
      if (!Array.isArray(list)) {
        list = response?.data;
      }
      if (!Array.isArray(list)) {
        list = response;
      }
      if (!Array.isArray(list)) return null;
      return list as ScheduleMatch[];
    } catch (error) {
      console.error("Error fetching schedule matches:", error);
      return null;
    }
  }
}

export const scheduleService = new ScheduleService();
