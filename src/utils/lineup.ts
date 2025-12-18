import { apiClient } from "@/utils/api";

export interface ApiLineupResponse {
  id: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "ACTIVE";
  bookedSlots?: number;
  lockLineup: boolean;
  openSlots?: number;
  totalSlots?: number;
  team: number;
  lineUp: Record<
    string,
    {
      GK?: {
        id: string;
        name: string;
        phone: string;
        type?: string;
      };
      PLAYERS?: Array<{
        id: string;
        name: string;
        phone: string;
        type?: string;
      }>;
    }
  >;
}

export interface UpdatePlayerTeamRequest {
  id: string;
  team: string;
}

export interface UpdatePlayerTeamResponse {
  success: boolean;
  message: string;
}

export interface LineupPlayer {
  id: string;
  realId: string;
  name: string;
  phone: string;
  position: "GK" | "PLAYER";
  team: string;
  order: number;
  notes?: string;
  type?: string;
}

export interface LineupMatch {
  id: string;
  scheduleId?: string;
  scheduleName: string;
  lockLineup: boolean;
  venue: string;
  date: string;
  time: string;
  totalTeams: number;
  teams: Record<string, LineupPlayer[]>;
  status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "ACTIVE";
  totalPlayers: number;
  createdAt?: string;
  updatedAt?: string;
  bookedSlots?: number;
  openSlots?: number;
  totalSlots?: number;
}

export class LineupService {
  private transformApiResponse(apiResponse: ApiLineupResponse): LineupMatch {
    const allPlayers: LineupPlayer[] = [];
    const groupedTeams: Record<string, LineupPlayer[]> = {};

    // Ambil data lineup dari response
    Object.entries(apiResponse.lineUp || {}).forEach(([teamKey, teamData]) => {
      if (!groupedTeams[teamKey]) {
        groupedTeams[teamKey] = [];
      }

      // GK
      if (teamData.GK) {
        const gkPlayer: LineupPlayer = {
          id: teamData.GK.id,
          realId: apiResponse.id,
          name: teamData.GK.name,
          phone: teamData.GK.phone,
          position: "GK",
          team: teamKey,
          order: 1,
          type: teamData.GK.type,
        };
        allPlayers.push(gkPlayer);
        groupedTeams[teamKey].push(gkPlayer);
      }

      // PLAYERS
      if (teamData.PLAYERS) {
        teamData.PLAYERS.forEach((player, index) => {
          const lineupPlayer: LineupPlayer = {
            id: player.id,
            realId: apiResponse.id,
            name: player.name,
            phone: player.phone,
            position: "PLAYER",
            team: teamKey,
            order: index + 2,
            type: player.type,
          };
          allPlayers.push(lineupPlayer);
          groupedTeams[teamKey].push(lineupPlayer);
        });
      }
    });

    // ==== Tambahkan tim kosong jika belum ada ====
    const totalTeams = apiResponse.team || Object.keys(groupedTeams).length;
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    for (let i = 0; i < totalTeams; i++) {
      const teamLabel = alphabet[i];
      if (!groupedTeams[teamLabel]) {
        groupedTeams[teamLabel] = []; // tim kosong
      }
    }

    return {
      id: apiResponse.id,
      scheduleName: apiResponse.scheduleName,
      venue: apiResponse.venue,
      date: apiResponse.date,
      time: apiResponse.time,
      lockLineup: apiResponse.lockLineup,
      status:
        apiResponse.status === "ACTIVE" ? "CONFIRMED" : apiResponse.status,
      totalPlayers: allPlayers.length,
      totalTeams,
      teams: groupedTeams,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      bookedSlots: apiResponse.bookedSlots,
      openSlots: apiResponse.openSlots,
      totalSlots: apiResponse.totalSlots,
    };
  }

  async fetchLineups(): Promise<LineupMatch[]> {
    const response = await apiClient.get("/api/v1/matches/schedules-lineup");
    const data = Array.isArray(response) ? response : response.data || [];
    return data.map((item: ApiLineupResponse) =>
      this.transformApiResponse(item)
    );
  }

  async updatePlayerTeam(
    playerId: string,
    team: string
  ): Promise<UpdatePlayerTeamResponse> {
    const requestBody: UpdatePlayerTeamRequest = { id: playerId, team };
    const response = await apiClient.put(
      `/api/v1/lineup/lineup-team`,
      requestBody
    );
    return response.data;
  }

  async updateLockLineup(lineupId: string, lockStatus: boolean) {
    const response = apiClient.put(`/api/v1/lineup/lock/${lineupId}`, {
      lineupStatus: lockStatus,
    });
    return response;
  }
}

export const lineupService = new LineupService();
