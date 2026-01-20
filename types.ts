// Enums
export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum ViewState {
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  HOME = 'HOME',
  MY_RESERVATIONS = 'MY_RESERVATIONS',
}

// Entities
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Seat {
  id: string;
  library_id: string;
  label: string;
  floor: number;
  is_active: boolean;
  // Computed status for UI
  status?: 'AVAILABLE' | 'OCCUPIED' | 'SELECTED'; 
}

export interface Reservation {
  id: string;
  seat_id: string;
  user_id: string;
  status: ReservationStatus;
  start_at: string; // ISO string
  end_at?: string; // ISO string
  canceled_at?: string; // ISO string
}

export interface Library {
  id: string;
  name: string;
  campus?: string;
}

// API Responses
export interface AuthResponse {
  user: User;
  token: string;
}

export interface SeatResponse {
  seats: Seat[];
}