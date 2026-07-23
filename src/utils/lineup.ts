import { apiClient } from "@/utils/api";

export interface ApiLineupPlayer {
  id: string;
  name: string;
  type: string;
  jerseySize: string;
  isMember: boolean;
  paymentId?: string;
}

export interface ApiLineupTeam {
  team: string;
  hexColor: string | null;
  image: string | null;
  scheduleTeamId: string | null;
  nameTeam: string | null;
  gk: ApiLineupPlayer | null;
  players: ApiLineupPlayer[];
}

export interface ApiLineupResponse {
  id: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  status: "DRAFT" | "CONFIRMED" | "COMPLETED" | "ACTIVE";
  totalPlayers: number;
  bookedSlots: number;
  openSlots: number;
  totalSlots: number;
  lineUp: ApiLineupTeam[];
  team: number;
  lockLineup: boolean;
  isOpen: boolean;
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
  jerseySize: string;
  position: string;
  team: string;
  order: number;
  type?: string;
  isMember: boolean;
  paymentId?: string;
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
  isOpen?: boolean;
}

export class LineupService {
  private transformApiResponse(apiResponse: ApiLineupResponse): LineupMatch {
    const allPlayers: LineupPlayer[] = [];
    const groupedTeams: Record<string, LineupPlayer[]> = {};

    // Iterate array of teams from response
    (apiResponse.lineUp || []).forEach((teamData) => {
      const teamKey = teamData.team;
      if (!groupedTeams[teamKey]) {
        groupedTeams[teamKey] = [];
      }

      // GK (single object, may be null)
      if (teamData.gk) {
        const gkPlayer: LineupPlayer = {
          id: teamData.gk.id,
          realId: apiResponse.id,
          name: teamData.gk.name,
          phone: "",
          jerseySize: teamData.gk.jerseySize,
          position: "GK",
          team: teamKey,
          order: 1,
          type: teamData.gk.type,
          isMember: teamData.gk.isMember,
          paymentId: teamData.gk.paymentId,
        };
        allPlayers.push(gkPlayer);
        groupedTeams[teamKey].push(gkPlayer);
      }

      // PLAYERS array
      (teamData.players || []).forEach((player, index) => {
        const lineupPlayer: LineupPlayer = {
          id: player.id,
          realId: apiResponse.id,
          name: player.name,
          phone: "",
          jerseySize: player.jerseySize,
          position: "PLAYER",
          team: teamKey,
          order: index + 2,
          type: player.type,
          isMember: player.isMember,
          paymentId: player.paymentId,
        };
        allPlayers.push(lineupPlayer);
        groupedTeams[teamKey].push(lineupPlayer);
      });
    });

    // Add empty teams up to total team count if missing
    const totalTeams =
      apiResponse.team || Object.keys(groupedTeams).length;

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
      isOpen: apiResponse.isOpen,
    };
  }

  async fetchLineups(): Promise<LineupMatch[]> {
    const response = await apiClient.get("/api/v1/matches/schedules-lineup");
    const data = Array.isArray(response) ? response : response.data || [];
    return data.map((item: ApiLineupResponse) =>
      this.transformApiResponse(item),
    );
  }

  async updatePlayerTeam(
    playerId: string,
    team: string,
  ): Promise<UpdatePlayerTeamResponse> {
    const requestBody: UpdatePlayerTeamRequest = { id: playerId, team };
    const response = await apiClient.put(
      `/api/v1/lineup/lineup-team`,
      requestBody,
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
