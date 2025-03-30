// app/page.tsx
'use client';

import Login from './components/Login';
import EventForm from './components/EventForm';
import TicketList from './components/TicketList';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const res = await fetch('/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };

    fetchUser();
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">Welcome to Event Ticketing System</h1>

      {!user && <Login onLoginSuccess={setUser} />}

      {user?.role === 'Organizer' && <EventForm />}
      {user?.role === 'Attendee' && <TicketList />}
    </main>
  );
}
