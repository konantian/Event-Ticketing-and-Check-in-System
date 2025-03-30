'use client';
import { useEffect, useState } from 'react';
import Login from './components/Login';
import EventForm from './components/EventForm';
import TicketList from './components/TicketList';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Event Ticketing System</h1>

      {!user && <Login onLoginSuccess={setUser} />}
      {user?.role === 'Organizer' && <EventForm />}
      {user?.role === 'Attendee' && <TicketList />}
    </main>
  );
}
