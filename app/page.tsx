'use client';

import { useEffect, useState } from 'react';
import AllEvents from './components/AllEvents';
import Login from './components/Login';
import Register from './components/Register';
import TicketList from './components/TicketList';
import LogoutButton from './components/LogoutButton';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  email: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
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
      <div className="min-h-screen flex items-center justify-center text-gray-600 bg-gradient-to-tr from-yellow-100 to-indigo-100">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-sky-50 to-pink-50 px-6 py-4">
      {/* Toast provider */}
      <Toaster position="top-right" />
      
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
              <Button
                variant="outline"
                onClick={() => {
                  setShowLogin(true);
                  setShowRegister(false);
                }}
              >
                Login
              </Button>
              <Button
                onClick={() => {
                  setShowRegister(true);
                  setShowLogin(false);
                }}
              >
                Register
              </Button>
            </>
          )}
        </div>
      </header>

      <AllEvents
        user={user}
        setShowLogin={setShowLogin}
      />

      {/* My Tickets - Attendee only */}
      {user?.role === 'Attendee' && (
        <div className="mt-10">
          <TicketList />
        </div>
      )}

      {/* Auth Forms */}
      {!user && showLogin && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
            <Login onLoginSuccess={setUser} />
            <div className="p-4 text-center bg-gray-50">
              <Button variant="ghost" onClick={() => setShowLogin(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {!user && showRegister && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-md w-full">
            <Register onRegisterSuccess={setUser} />
            <div className="p-4 text-center bg-gray-50">
              <Button variant="ghost" onClick={() => setShowRegister(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
