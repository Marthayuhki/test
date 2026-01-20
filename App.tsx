import React, { useState, useEffect, useCallback } from 'react';
import { User, Seat, Reservation, ViewState, ReservationStatus } from './types';
import { AuthService, SeatService, ReservationService } from './services/mockDb';
import { FLOORS } from './constants';
import Button from './components/Button';
import Input from './components/Input';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  // Global State
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>(ViewState.LOGIN);
  const [activeReservation, setActiveReservation] = useState<Reservation | null>(null);
  
  // Data State
  const [seats, setSeats] = useState<Seat[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    setError('');
    try {
      const loggedInUser = await AuthService.login(email);
      setUser(loggedInUser);
      setView(ViewState.HOME);
    } catch (err: any) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSeats = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await SeatService.getSeats(selectedFloor);
      setSeats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedFloor]);

  const loadMyReservations = useCallback(async () => {
    if (!user) return;
    try {
      const active = await ReservationService.getActiveReservation(user.id);
      setActiveReservation(active);
      const history = await ReservationService.getHistory(user.id);
      setReservations(history);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  // Handle View Changes
  useEffect(() => {
    if (view === ViewState.HOME) {
      loadSeats();
      loadMyReservations();
      // Poll for seat updates
      const interval = setInterval(loadSeats, 10000);
      return () => clearInterval(interval);
    } else if (view === ViewState.MY_RESERVATIONS) {
      loadMyReservations();
    }
  }, [view, selectedFloor, loadSeats, loadMyReservations]);

  const handleReserve = async () => {
    if (!user || !selectedSeat) return;
    
    setIsLoading(true);
    try {
      await ReservationService.create(user.id, selectedSeat.id);
      await loadMyReservations();
      await loadSeats();
      setSelectedSeat(null);
      alert(`Success! Seat ${selectedSeat.label} reserved.`);
    } catch (err: any) {
      alert(err.message || 'Reservation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    setIsLoading(true);
    try {
      await ReservationService.cancel(reservationId);
      await loadMyReservations();
      await loadSeats();
    } catch (err) {
      alert('Failed to cancel');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderers ---

  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">LibSeat</h1>
            <p className="text-slate-500 mt-2">Reserve your study spot</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label="Email" 
              type="email" 
              placeholder="student@univ.ac.kr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
              Sign In
            </Button>
            <div className="text-center text-xs text-slate-400 mt-4">
              Demo Mode: Use any email/password
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg text-primary flex items-center gap-2" onClick={() => setView(ViewState.HOME)}>
            <span className="cursor-pointer">LibSeat</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 hidden sm:inline">{user?.name}</span>
            <button 
              onClick={() => { setUser(null); setView(ViewState.LOGIN); }}
              className="text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {view === ViewState.HOME && (
          <>
            {/* Active Reservation Banner */}
            {activeReservation && (
              <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">Active Reservation</p>
                  <p className="font-medium text-slate-900 mt-0.5">
                    {reservations.find(r => r.id === activeReservation.id)?.seat_id ? 
                      `Seat ${seats.find(s => s.id === activeReservation.seat_id)?.label || 'Reserved'}` : 
                      'You have a seat reserved'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Expires: {new Date(activeReservation.end_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setView(ViewState.MY_RESERVATIONS)} className="!px-3 !py-2 text-xs">
                  View
                </Button>
              </div>
            )}

            {/* Floor Selector */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
              {FLOORS.map(floor => (
                <button
                  key={floor}
                  onClick={() => { setSelectedFloor(floor); setSelectedSeat(null); }}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedFloor === floor 
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {floor}st Floor
                </button>
              ))}
            </div>

            {/* Seat Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="font-semibold text-slate-800">Seat Map</h2>
                 <div className="flex gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border border-slate-300"></div> Avail</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-200"></div> Taken</div>
                 </div>
              </div>
              
              {isLoading && seats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-slate-400">Loading map...</div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                  {seats.map(seat => {
                    const isSelected = selectedSeat?.id === seat.id;
                    const isOccupied = seat.status === 'OCCUPIED';
                    const isMine = activeReservation?.seat_id === seat.id;
                    
                    return (
                      <button
                        key={seat.id}
                        disabled={isOccupied}
                        onClick={() => setSelectedSeat(isSelected ? null : seat)}
                        className={`
                          relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all
                          ${isOccupied && !isMine ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : ''}
                          ${!isOccupied && !isSelected ? 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary' : ''}
                          ${isSelected ? 'bg-primary text-white shadow-lg shadow-blue-500/30 scale-105 z-10' : ''}
                          ${isMine ? 'bg-success text-white border-none' : ''}
                        `}
                      >
                        <span className="opacity-70 text-[10px]">Seat</span>
                        <span>{seat.label.split('-')[1]}</span>
                        {isMine && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-success"></span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="h-24"></div> {/* Spacer for sticky footer */}
          </>
        )}

        {view === ViewState.MY_RESERVATIONS && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-900">My Reservations</h2>
            
            {reservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-500">No reservation history.</p>
                <Button variant="ghost" className="mt-2" onClick={() => setView(ViewState.HOME)}>Back to Map</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map(res => (
                  <div key={res.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-slate-900">
                          Seat {seats.find(s => s.id === res.seat_id)?.label || 'Unknown'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          res.status === ReservationStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                          res.status === ReservationStatus.CANCELED ? 'bg-red-50 text-red-600' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {res.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(res.start_at).toLocaleString()}
                      </p>
                    </div>
                    {res.status === ReservationStatus.ACTIVE && (
                      <Button variant="danger" className="!py-2 !px-3 text-xs" onClick={() => handleCancel(res.id)}>
                        Cancel
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Sticky Bottom Actions */}
      {view === ViewState.HOME && selectedSeat && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
             <div>
               <p className="text-xs text-slate-500">Selected</p>
               <p className="font-bold text-lg text-slate-900">{selectedSeat.label}</p>
             </div>
             <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setSelectedSeat(null)}>Cancel</Button>
               <Button onClick={handleReserve} isLoading={isLoading}>
                 Confirm Reservation
               </Button>
             </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex sm:hidden z-10 pb-safe">
        <button 
          onClick={() => setView(ViewState.HOME)}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${view === ViewState.HOME ? 'text-primary' : 'text-slate-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span className="text-[10px] font-medium">Map</span>
        </button>
        <button 
          onClick={() => setView(ViewState.MY_RESERVATIONS)}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${view === ViewState.MY_RESERVATIONS ? 'text-primary' : 'text-slate-400'}`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>
          <span className="text-[10px] font-medium">My Seats</span>
        </button>
      </div>

      {/* AI Chat FAB */}
      {!isChatOpen && view !== ViewState.LOGIN && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 hover:scale-105 transition-transform z-40"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </button>
      )}

      {/* Chat Bot Modal/Overlay */}
      {isChatOpen && <ChatBot onClose={() => setIsChatOpen(false)} />}

    </div>
  );
};

export default App;