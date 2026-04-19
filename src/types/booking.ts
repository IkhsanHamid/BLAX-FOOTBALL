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
export interface bookingEventReq {
  eventId: string;
  eventTeamId: string;
  bookingType: string;
  email: string;
  isGuest: boolean;
  name: string;
  phoneNumber: string;
  isPlayer: boolean;
  isGk: boolean;
  isTeam: boolean;
  jerseySize: string;
  jerseyName: string;
  jerseyNumber: string;
  // addOns: string[];
  gkQuantity: number;
  playerQuantity: number;
  quantity: number;
  teamRoster?: {
    name: string;
    email: string;
    phone: string;
    jerseySize: string;
    jerseyName: string;
    jerseyNumber: string;
  }[];
  slotDetails?: {
    name: string;
    email: string | undefined;
    phone: string;
    jerseySize: string;
    jerseyName: string;
    jerseyNumber: string;
    role: string | null;
  }[];
}

export interface bookingResponse {}
