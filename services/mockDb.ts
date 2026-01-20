import { Seat, Reservation, User, ReservationStatus } from '../types';

// Initial Mock Data
const MOCK_LIBRARY_ID = 'lib-001';

// Generate Seats
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const floors = [1, 2, 3];
  
  floors.forEach(floor => {
    // 20 seats per floor for MVP
    for (let i = 1; i <= 20; i++) {
      seats.push({
        id: `seat-${floor}-${i}`,
        library_id: MOCK_LIBRARY_ID,
        label: `${floor}F-${i.toString().padStart(2, '0')}`,
        floor: floor,
        is_active: true,
      });
    }
  });
  return seats;
};

// In-memory storage (persists per session refresh in this demo context)
let dbSeats: Seat[] = generateSeats();
let dbReservations: Reservation[] = [];
let dbUsers: User[] = [
  { id: 'user-1', email: 'student@univ.ac.kr', name: 'Student Demo' }
];

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const SeatService = {
  getSeats: async (floor?: number): Promise<Seat[]> => {
    await delay(300);
    
    // Calculate status based on active reservations
    const activeReservations = dbReservations.filter(r => r.status === ReservationStatus.ACTIVE);
    const occupiedSeatIds = new Set(activeReservations.map(r => r.seat_id));

    return dbSeats
      .filter(s => floor ? s.floor === floor : true)
      .map(s => ({
        ...s,
        status: occupiedSeatIds.has(s.id) ? 'OCCUPIED' : 'AVAILABLE'
      }));
  }
};

export const ReservationService = {
  getActiveReservation: async (userId: string): Promise<Reservation | null> => {
    await delay(200);
    return dbReservations.find(r => 
      r.user_id === userId && 
      r.status === ReservationStatus.ACTIVE
    ) || null;
  },

  getHistory: async (userId: string): Promise<Reservation[]> => {
    await delay(300);
    return dbReservations
      .filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.start_at).getTime() - new Date(a.start_at).getTime());
  },

  create: async (userId: string, seatId: string): Promise<Reservation> => {
    await delay(500);

    // 1. Check if user already has an active reservation
    const existing = dbReservations.find(r => r.user_id === userId && r.status === ReservationStatus.ACTIVE);
    if (existing) {
      throw new Error("You already have an active reservation. Please cancel it first.");
    }

    // 2. Check if seat is occupied
    const isOccupied = dbReservations.find(r => r.seat_id === seatId && r.status === ReservationStatus.ACTIVE);
    if (isOccupied) {
      throw new Error("This seat is already reserved by another user.");
    }

    // 3. Create reservation
    const newReservation: Reservation = {
      id: `res-${Date.now()}`,
      seat_id: seatId,
      user_id: userId,
      status: ReservationStatus.ACTIVE,
      start_at: new Date().toISOString(),
      // Auto-expire in 4 hours for logic
      end_at: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), 
    };

    dbReservations.push(newReservation);
    return newReservation;
  },

  cancel: async (reservationId: string): Promise<void> => {
    await delay(400);
    const index = dbReservations.findIndex(r => r.id === reservationId);
    if (index !== -1) {
      dbReservations[index] = {
        ...dbReservations[index],
        status: ReservationStatus.CANCELED,
        canceled_at: new Date().toISOString()
      };
    }
  }
};

export const AuthService = {
  login: async (email: string): Promise<User> => {
    await delay(400);
    // Auto-signup/login for MVP simplicity
    let user = dbUsers.find(u => u.email === email);
    if (!user) {
      user = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0]
      };
      dbUsers.push(user);
    }
    return user;
  }
};