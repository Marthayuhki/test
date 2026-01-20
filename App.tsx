import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Seat, Reservation, ViewState, ReservationStatus } from './types';
import { AuthService, SeatService, ReservationService } from './services/mockDb';
import { FLOORS } from './constants';
import Button from './components/Button';
import Input from './components/Input';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();

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
      setError(t('login.failed'));
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
      alert(t('home.successMessage', { seatLabel: selectedSeat.label }));
    } catch (err: any) {
      alert(err.message || t('home.errorMessage'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm(t('home.cancelConfirm'))) return;
    
    setIsLoading(true);
    try {
      await ReservationService.cancel(reservationId);
      await loadMyReservations();
      await loadSeats();
    } catch (err) {
      alert(t('home.cancelFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // --- Renderers ---

  if (view === ViewState.LOGIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 text-purple-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m4 6 8-4 8 4"/><path d="m18 10 4 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 5v17"/><path d="M6 5v17"/><circle cx="12" cy="9" r="2"/></svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="text-gray-500 mt-2">{t('login.subtitle')}</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <Input 
              label={t('login.emailLabel')}
              type="email" 
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input 
              label={t('login.passwordLabel')}
              type="password" 
              placeholder={t('login.passwordPlaceholder')}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <Button type="submit" fullWidth isLoading={isLoading} className="mt-2">
              {t('login.signInButton')}
            </Button>
            <div className="text-center text-xs text-gray-400 mt-4">
              {t('login.demoMode')}
            </div>
          </form>

          <div className="mt-6 flex justify-center gap-4">
            <Button variant="ghost" onClick={() => i18n.changeLanguage('en')}>English</Button>
            <Button variant="ghost" onClick={() => i18n.changeLanguage('ko')}>한국어</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-lg text-purple-600 flex items-center gap-2" onClick={() => setView(ViewState.HOME)}>
            <span className="cursor-pointer">{t('login.title')}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:inline">{user?.name}</span>
            <button 
              onClick={() => { setUser(null); setView(ViewState.LOGIN); }}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              {t('navbar.logout')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {view === ViewState.HOME && (
          <>
            {/* Active Reservation Banner */}
            {activeReservation && (
              <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wide">{t('home.activeReservation')}</p>
                  <p className="font-medium text-gray-900 mt-0.5">
                    {reservations.find(r => r.id === activeReservation.id)?.seat_id ? 
                      `${t('home.seat')} ${seats.find(s => s.id === activeReservation.seat_id)?.label || t('myReservations.unknownSeat')}` : 
                      'You have a seat reserved'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires: {new Date(activeReservation.end_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setView(ViewState.MY_RESERVATIONS)} className="!px-3 !py-2 text-xs">
                  {t('home.viewButton')}
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
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {floor}st Floor
                </button>
              ))}
            </div>

            {/* Seat Grid */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="font-semibold text-gray-800">{t('home.seatMap')}</h2>
                 <div className="flex gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div> {t('home.legend.available')}</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-200"></div> {t('home.legend.taken')}</div>
                 </div>
              </div>
              
              {isLoading && seats.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-gray-400">{t('home.loadingMap')}</div>
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
                          ${isOccupied && !isMine ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : ''}
                          ${!isOccupied && !isSelected ? 'bg-white border border-gray-200 text-gray-600 hover:border-purple-600 hover:text-purple-600' : ''}
                          ${isSelected ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 scale-105 z-10' : ''}
                          ${isMine ? 'bg-green-500 text-white border-none' : ''}
                        `}
                      >
                        <span className="opacity-70 text-[10px]">{t('home.seat')}</span>
                        <span>{seat.label.split('-')[1]}</span>
                        {isMine && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full border-2 border-green-500"></span>}
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
            <h2 className="text-xl font-bold text-gray-900">{t('myReservations.title')}</h2>
            
            {reservations.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500">{t('myReservations.noHistory')}</p>
                <Button variant="ghost" className="mt-2" onClick={() => setView(ViewState.HOME)}>{t('myReservations.backToMap')}</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map(res => (
                  <div key={res.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">
                          {t('myReservations.seat')} {seats.find(s => s.id === res.seat_id)?.label || t('myReservations.unknownSeat')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          res.status === ReservationStatus.ACTIVE ? 'bg-green-100 text-green-700' :
                          res.status === ReservationStatus.CANCELED ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {t(`myReservations.status.${res.status.toLowerCase()}` as const)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(res.start_at).toLocaleString()}
                      </p>
                    </div>
                    {res.status === ReservationStatus.ACTIVE && (
                      <Button variant="danger" className="!py-2 !px-3 text-xs" onClick={() => handleCancel(res.id)}>
                        {t('home.cancelButton')}
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
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
             <div>
               <p className="text-xs text-gray-500">{t('home.selected')}</p>
               <p className="font-bold text-lg text-gray-900">{selectedSeat.label}</p>
             </div>
             <div className="flex gap-3">
               <Button variant="ghost" onClick={() => setSelectedSeat(null)}>{t('home.cancelButton')}</Button>
               <Button onClick={handleReserve} isLoading={isLoading}>
                 {t('home.confirmReservationButton')}
               </Button>
             </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs (Mobile) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex sm:hidden z-10 pb-safe">
        <button 
          onClick={() => setView(ViewState.HOME)}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${view === ViewState.HOME ? 'text-purple-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          <span className="text-[10px] font-medium">{t('tabs.map')}</span>
        </button>
        <button 
          onClick={() => setView(ViewState.MY_RESERVATIONS)}
          className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 ${view === ViewState.MY_RESERVATIONS ? 'text-purple-600' : 'text-gray-400'}`}
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M9 16l2 2 4-4"/></svg>
          <span className="text-[10px] font-medium">{t('tabs.mySeats')}</span>
        </button>
      </div>

      {/* AI Chat FAB */}
      {!isChatOpen && view !== ViewState.LOGIN && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 bg-purple-600 text-white p-4 rounded-full shadow-lg shadow-purple-600/30 hover:scale-105 transition-transform z-40"
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