export interface bookingRequest {
  scheduleId: string;
  bookingType: string;
  email: string;
  isGuest: boolean;
  name: string;
  phoneNumber: string;
  isPlayer: boolean;
  isGk: boolean;
  isTeam: boolean;
  teamRoster?: {
    name: string;
    email: string;
    phone: string;
  }[];
}

export interface bookingResponse {}
