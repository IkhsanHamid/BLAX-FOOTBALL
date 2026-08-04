export interface AdminUser {
  id: string;
  user_id: string;
  access_level: "superadmin" | "moderator" | "admin";
  granted_at: string;
  user_profiles?: {
    name: string;
    user_id: string;
  };
}

export interface UserManagement {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  gamesPlayed: number;
  isMember: boolean;
  totalPoints: number;
  lastPlayed: string | null;
  createdAt: Date;
}
export interface AdminStats {
  totalPolicies: number;
  pendingVerification: number;
  totalUsers: number;
  activeAdmins: number;
  verificationsToday: number;
  flaggedContent: number;
}

export interface Roles {
  id: string;
  name: string;
}

export interface ReportBooking {
  total: number;
  totalPages: number;
  currentPage: number;
  totalBooking: number;
  totalRevenue: number;
  totalPlayers: number;
  schedules: ScheduleBookingReports[];
  events: EventBookingReport[];
}

export interface ScheduleBookingReports {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  typeMatch: string;
  status: boolean;
  players: number;
  bookingCount: number;
  revenue: number;
}

export interface EventBookingReport {
  id: string;
  name: string;
  date: string;
  startDate?: string;
  time: string;
  venue: string;
  typeMatch: string;
  status: boolean;
  teams: number;
  players: number;
  bookingCount: number;
  revenue: number;
}

export interface BookingHistory {
  bookingId: string;
  customerName: string;
  customerPhone: string;
  jerseySize: string;
  scheduleName: string;
  venue: string;
  isGk: true;
  isMember: string;
  isPlayer: true;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  playerCount: number;
  totalAmount: number;
  depositUsed: number;
  depositType?: "FULL" | "PARTIAL" | "NONE";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  bookedAt: string;
  paymentAt: string;
}

export interface BookingHistoryResponse {
  status: boolean;
  statusCode: number;
  message: string;
  skip: number;
  limit: number;
  totalData: number; // ← Total untuk pagination
  data: BookingHistory[];
}

export interface RefundableBooking {
  id: string;
  bookId: string;
  customerName: string;
  customerPhone: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  totalAmount: number;
  depositUsed: number;
  qrisAmount: number;
}

export interface RefundableBookingResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: RefundableBooking[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface RefundHistoryRecord {
  id: string;
  bookId: string;
  customerName: string;
  customerPhone: string;
  scheduleName: string;
  venue: string;
  date: string;
  time: string;
  bookingType: "INDIVIDUAL" | "TEAM";
  totalAmount: number;
  depositUsed: number;
  depositType?: "FULL" | "PARTIAL" | "NONE";
  reason: string;
  refundedAt: string;
}

export interface RefundHistoryResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: RefundHistoryRecord[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface RefundRequest {
  bookId: string;
  reason: string;
}

export interface Users {
  phone: string;
  name: string;
  email: string;
}

export interface ListUserMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  validUntil: string;
}

export interface RescheduleManagement {
  id: string;
  bookId: string;
  scheduleId?: string;
  playerName: string;
  playerPhone: string;
  venueName: string;
  venueId: string;
  date: string;
  time: string;
  status: string;
}

export interface DepositHistory {
  id: string;
  total: number;
  createdAt: string;
  isActive: boolean;
  userName: string;
  userPhone: string;
  bookingId: string;
  voucherHistories: VoucherHistory[];
}

export interface VoucherHistory {
  id: string;
  voucherId: string;
  voucherName: string;
  voucherCode: string;
  voucherNominal: number;
  voucherType: string;
  createdAt: string;
}

export interface DepositHistoryRecord {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string | null;
  paymentId: string;
  paymentStatus?: string;
  createdAt: string;
}

export interface DepositUsage {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  bookingId: string;
  scheduleName: string;
  scheduleDate: string;
  scheduleTime: string;
  venueName: string;
  createdAt: string;
}

export interface VoucherHistoryRecord {
  id: string;
  depositId: string;
  userId: string;
  userName: string;
  userPhone: string;
  depositRemaining: number;
  voucherId: string;
  voucherName: string;
  voucherCode: string;
  voucherNominal: number;
  voucherType: string;
  usedBookingId?: string;
  usedScheduleName?: string;
  createdAt: string;
  createdByName: string;
}

export interface NonMemberUser {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface NonMemberSearchResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: NonMemberUser[];
}

export interface CreateFreeMembershipData {
  id: string;
  userId: string;
  paymentId: string;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFreeMembershipResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: CreateFreeMembershipData;
}

export interface CreateFreeMembershipPayload {
  userId: string;
  durationMonths: number;
}

export interface BracketTeam {
  id: string;
  name: string;
  imageUrl: string;
}

export interface BracketScore {
  id?: string;
  matchId?: string;
  scoreA: number;
  scoreB: number;
  status: "scheduled" | "live" | "finished";
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BracketGoal {
  id: string;
  userId: string | null;
  userName: string | null;
  teamId: string;
  teamName: string;
  minute: number;
  type: "goal" | "own_goal" | "penalty";
}

export interface BracketMatch {
  id: string;
  matchOrder: number;
  roundName?: string;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  score: BracketScore;
  nextMatchId: string | null;
  goals: BracketGoal[];
}

export interface BracketRound {
  stage?: "knockout" | "group";
  round?: number;
  roundName: string;
  matches: BracketMatch[];
}

export interface BracketResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: BracketRound[];
}

export interface GenerateBracketRound {
  round: number;
  roundName: string;
}

export interface GenerateBracketGroup {
  roundName: string;
  teamIds?: string[];
}

export interface GenerateBracketSeeding {
  teamAId: string;
  teamBId: string;
}

export interface GenerateBracketPayload {
  stage: "knockout" | "group" | "group-knockout";
  rounds?: GenerateBracketRound[];
  groups?: GenerateBracketGroup[];
  seedings?: GenerateBracketSeeding[];
  knockoutRounds?: GenerateBracketRound[];
  advancePerGroup?: number;
}

export interface MatchDetail {
  id: string;
  round: number;
  roundName?: string;
  matchOrder: number;
  teamA: BracketTeam | null;
  teamB: BracketTeam | null;
  score: BracketScore;
  nextMatchId: string | null;
  goals: BracketGoal[];
}

export interface MatchDetailResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: MatchDetail;
}

export interface UpdateMatchPayload {
  teamAId?: string | null;
  teamBId?: string | null;
  matchOrder?: number;
  round?: number;
  roundName?: string | null;
  nextMatchId?: string | null;
  scoreA?: number;
  scoreB?: number;
  status?: "scheduled" | "live" | "finished";
}

export interface AddGoalPayload {
  eventTeamId: string;
  userId?: string | null;
  scorerName?: string | null;
  type?: "goal" | "own_goal" | "penalty";
}

export interface AddGoalResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: {
    id: string;
    matchId: string;
    eventTeamId: string;
    userId: string | null;
    minute: number | null;
    type: string;
    createdAt: string;
  };
}

export interface TopScorer {
  userId: string | null;
  name: string | null;
  teamName: string;
  teamImageUrl: string;
  eventTeamId: string;
  goals: number;
}

export interface TopScorerResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: TopScorer[];
}

export interface Standing {
  teamId: string;
  teamName: string;
  teamImageUrl: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingGroup {
  roundName: string;
  standings: Standing[];
}

export interface StandingResponse {
  status: boolean;
  statusCode?: number;
  code?: number;
  message: string;
  data: StandingGroup[];
}

export interface MatchPlayer {
  userId: string;
  name: string;
}

export interface MatchTeamPlayers {
  teamId: string;
  teamName: string;
  players: MatchPlayer[];
}

export interface MatchPlayersData {
  teamA: MatchTeamPlayers;
  teamB: MatchTeamPlayers;
}

export interface MatchPlayersResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: MatchPlayersData;
}

export interface AttendancePlayer {
  lineupId: string;
  userId: string | null;
  name: string | null;
  position: string;
  isPresent: boolean;
  jerseyNumber: string | null;
  jerseySize: string | null;
}

export interface AttendanceTeam {
  teamName: string;
  hexColor: string | null;
  image: string | null;
  scheduleTeamId: string | null;
  nameTeam: string | null;
  gk: AttendancePlayer | null;
  players: AttendancePlayer[];
}

export interface AttendanceChecklistResponse {
  status: boolean;
  statusCode: number;
  data: AttendanceTeam[];
}

export interface UpdateAttendancePayload {
  lineupId?: string;
  jerseyNumber?: string;
  jerseySize?: string;
  isPresent?: boolean;
}

export interface CompleteSchedulePayload {
  penanggungJawab: string;
}

export interface AttendanceHistoryPlayer {
  userId: string | null;
  name: string | null;
  position: string;
  isPresent: boolean;
  jerseyNumber: string | null;
  jerseySize: string | null;
  lineupId?: string;
  bookId?: string;
}

export interface AttendanceHistoryTeam {
  teamName: string;
  gk: AttendanceHistoryPlayer | null;
  players: AttendanceHistoryPlayer[];
}

export interface AttendanceHistoryData {
  scheduleId: string;
  scheduleName: string;
  date: string;
  time: string;
  penanggungJawab: string;
  attendance: {
    totalPlayers: number;
    hadir: number;
    tidakHadir: number;
  };
  lineup: AttendanceHistoryTeam[];
}

export interface AttendanceHistoryResponse {
  status: boolean;
  statusCode: number;
  data: AttendanceHistoryData;
}

export interface ScanLineupData {
  lineupId: string;
  team: string;
  position: string;
  jerseyNumber: string | null;
  jerseySize: string | null;
  isPresent: boolean;
}

export interface ScanBookingData {
  bookId: string;
  customerName: string;
  phone: string;
  scheduleName: string;
  date: string;
  time: string;
  venue: string;
  teamName: string;
  lineups: ScanLineupData[];
}

export interface ScanBookingResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: ScanBookingData;
}

export interface CheckinResponse {
  status: boolean;
  statusCode: number;
  message: string;
  data: {
    updatedCount: number;
  };
}
