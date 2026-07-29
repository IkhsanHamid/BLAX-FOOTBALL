export interface Schedule {
  id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  openSlots: string;
  bookedSlots: string;
  totalSlots: string;
  feePlayer: string;
  feeGk: string;
  typeEvent: string;
  typeMatch: string;
  community: string;
  imageUrl: string;
  description: string;
  gmapLink: string;
  address: string;
  facilities: Facilites[];
  canRegistTeam: boolean;
  availableGkSlots: number;
  availablePlayerSlots: number;
  isOpen: boolean;
  isVerified?: boolean;
  isRejected?: boolean;
  rejectReason?: string;
}

export interface LineupPlayer {
  id: string;
  name: string;
  type: string;
  jerseySize: string;
  isMember: boolean;
}

export interface LineupTeam {
  team: string;
  hexColor: string | null;
  image: string | null;
  scheduleTeamId: string | null;
  nameTeam: string | null;
  gk: LineupPlayer | null;
  players: LineupPlayer[];
}

export interface ScheduleDetail extends Schedule {
  rules: Rules[];
  lineUp: LineupTeam[];
}

interface Facilites {
  id?: string;
  name: string;
}

export interface Rules {
  id?: string;
  description: string;
}

export interface ScheduleOverview {
  id: string;
  date: string;
  time: string;
  feeGk: number;
  feePlayer: number;
  name: string;
  venue: string;
  team: number;
  typeEvent: string;
  typeMatch: string;
  community: string;
  image: string;
  openSlots: number;
  bookedSlots: number;
  lockedSlotsGk: number;
  lockedSlotsPlayer: number;
  totalSlots: number;
  revenue: number;
  status: string;
  rules: Rules[];
  facilities: Facilites[];
  isOpen: boolean;
  isVerified?: boolean;
  isRejected?: boolean;
  scheduleTeams?: string[];
  rejectReason?: string;
}

export interface ListSchedule {
  id: string;
  type?: "schedule" | "event";
  name: string;
  date: string;
  time: string;
  isOpen?: boolean;
}

export interface PendingVerificationItem {
  id: string;
  name: string;
  date: string;
  time: string;
  typeMatch: string;
  team: number;
  community: string;
  venue: string;
  paymentProof: string;
  createdBy: string;
  createdByPhone: string;
  createdAt: string;
}

export interface PendingVerificationResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: PendingVerificationItem[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface VerificationFacility {
  id: string;
  name: string;
}

export interface VerificationRule {
  id: string;
  description: string;
}

export interface VerificationCreatedBy {
  name: string;
  phone: string;
  email: string;
}

export interface VerificationDetail {
  id: string;
  name: string;
  date: string;
  time: string;
  typeEvent: string;
  typeMatch: string;
  team: number;
  feePlayer: number;
  feeGk: number;
  community: string;
  imageUrl: string;
  paymentProof: string;
  isVerified: boolean;
  isRejected: boolean;
  venue: { id: string; name: string };
  facilities: VerificationFacility[];
  rules: VerificationRule[];
  createdBy: VerificationCreatedBy;
  createdAt: string;
}

export interface VerificationDetailResponse {
  status: boolean;
  code: number;
  message: string;
  data: VerificationDetail;
}

export interface VerifyScheduleRequest {
  scheduleId: string;
  action: "approve" | "reject";
  rejectReason?: string;
}

export interface RejectedScheduleItem {
  id: string;
  name: string;
  date: string;
  time: string;
  typeMatch: string;
  team: number;
  community: string;
  venue: string;
  paymentProof: string;
  imageUrl: string;
  createdBy: string;
  createdByPhone: string;
  createdAt: string;
  rejectedAt?: string;
  rejectReason: string;
}

export interface RejectedScheduleResponse {
  status: boolean;
  code: number;
  message: string;
  data: {
    data: RejectedScheduleItem[];
    meta: {
      total: number;
      skip: number;
      limit: number;
    };
  };
}

export interface ScheduleDetailVenue {
  id: string;
  name: string;
  address: string;
  gmapLink: string;
}

export interface ScheduleDetailSlots {
  bookedSlots: number;
  openSlots: number;
  totalSlots: number;
  gkSlots: number;
  playerSlots: number;
}

export interface ScheduleDetailItem {
  id: string;
  name: string;
  date: string;
  time: string;
  typeEvent: string;
  typeMatch: string;
  community: string;
  team: number;
  feePlayer: number;
  feeGk: number;
  imageUrl: string;
  paymentProof: string;
  isOpen: boolean;
  isActive: boolean;
  isVerified: boolean;
  isRejected: boolean;
  rejectReason: string | null;
  venue: ScheduleDetailVenue;
  slots: ScheduleDetailSlots;
  facilities: { id: string; name: string }[];
  rules: { id: string; description: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleDetailResponse {
  status: boolean;
  code: number;
  message: string;
  data: ScheduleDetailItem;
}

export interface MasterTeam {
  id: string;
  name: string;
  hexColor: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface MasterTeamListMeta {
  total: number;
  skip: number;
  limit: number;
}

export interface MasterTeamListData {
  data: MasterTeam[];
  meta: MasterTeamListMeta;
}

export interface MasterTeamListResponse {
  status: boolean;
  code: number;
  message: string;
  data: MasterTeamListData;
}

export interface MasterTeamDetailResponse {
  status: boolean;
  code: number;
  message: string;
  data: MasterTeam;
}

export interface MasterTeamCreatePayload {
  name: string;
  hexColor?: string;
  image?: string | File | null;
}

export interface MasterTeamUpdatePayload {
  name?: string;
  hexColor?: string | null;
  image?: string | File | null;
}

export interface ScheduleMatchTeam {
  id: string;
  name: string;
  hexColor: string | null;
  image: string | null;
}

export interface ScheduleMatch {
  id: string;
  matchTime: string;
  matchOrder: number;
  teamA: ScheduleMatchTeam;
  teamB: ScheduleMatchTeam;
}

export interface ScheduleMatchListResponse {
  status?: boolean;
  code?: number;
  message?: string;
  data: ScheduleMatch[];
}

export interface ScheduleMatchInput {
  teamAId: string;
  teamBId: string;
  matchTime: string;
}

export interface ScheduleMatchBulkPayload {
  matches: ScheduleMatchInput[];
}

export interface ScheduleMatchUpdatePayload {
  matchTime?: string;
  teamAId?: string;
  teamBId?: string;
}
