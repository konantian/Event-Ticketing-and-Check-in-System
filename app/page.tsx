'use client';

import { useEffect, useState } from 'react';
import AllEvents from './components/AllEvents';
import Login from './components/Login';
import Register from './components/Register';
import TicketList from './components/TicketList';
import LogoutButton from './components/LogoutButton';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [ticketRefreshKey, setTicketRefreshKey] = useState(0);

const handleTicketPurchased = () => {
  setTicketRefreshKey((prev) => prev + 1); // 🔁 triggers re-render of TicketList
};

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }

      setIsLoading(false);
    };

    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gradient-to-tr from-yellow-100 to-indigo-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-sky-50 to-pink-50 px-6 py-4">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-5xl font-extrabold text-indigo-700 tracking-tight">
            🎟️ Event Ticketing System
          </h1>
        </div>

        <div className="space-x-3">
          {user ? (
            <>
              <span className="text-sm text-gray-700">
                Welcome, <strong>{user.email}</strong> ({user.role})
              </span>
              <LogoutButton onLogout={() => setUser(null)} />
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setShowLogin(true);
                  setShowRegister(false);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                Login
              </button>
              <button
                onClick={() => {
                  setShowRegister(true);
                  setShowLogin(false);
                }}
                className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700 transition"
              >
                Register
              </button>
            </>
          )}
        </div>
      </header>

      <AllEvents
        user={user}
        setShowLogin={setShowLogin}
        onTicketPurchased={() => setTicketRefreshKey((prev) => prev + 1)}
      />

      {/* My Tickets - Attendee only */}
      {user?.role === 'Attendee' && (
        <div className="mt-10">
          <TicketList refresh={ticketRefreshKey} />
        </div>
      )}

      {/* Auth Forms */}
      {!user && showLogin && (
        <div className="mt-10">
          <Login onLoginSuccess={setUser} />
        </div>
      )}

      {!user && showRegister && (
        <div className="mt-10">
          <Register onRegisterSuccess={setUser} />
        </div>
      )}
    </main>
  );
}
