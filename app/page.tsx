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
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6 text-center">🎫 Event Ticketing System</h1>

      {user && (
        <div className="flex justify-between mb-4 items-center">
          <p className="text-gray-600">Logged in as: <strong>{user.email}</strong> ({user.role})</p>
          <LogoutButton onLogout={() => setUser(null)} />
        </div>
      )}

      {/* Public event list */}
      <AllEvents user={user} setShowLogin={setShowLogin} />

      {/* Show tickets only if logged in as Attendee */}
      {user?.role === 'Attendee' && <TicketList />}

      {/* Login/Register modals or inline components */}
      {!user && showLogin && <Login onLoginSuccess={setUser} />}
      {!user && showRegister && <Register onRegisterSuccess={setUser} />}

      {!user && !showLogin && !showRegister && (
        <div className="text-center mt-8 space-x-4">
          <button onClick={() => setShowLogin(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Login</button>
          <button onClick={() => setShowRegister(true)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Register</button>
        </div>
      )}
    </main>
  );
}
