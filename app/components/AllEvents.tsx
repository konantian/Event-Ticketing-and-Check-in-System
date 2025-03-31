'use client';

import { useEffect, useState } from 'react';

interface Event {
  id: string;
  name: string;
  description: string;
  location: string;
  startTime: string;
}

interface User {
  role: string;
}

interface AllEventsProps {
  user: User | null;
  setShowLogin: (show: boolean) => void;
  onTicketPurchased?: () => void;
}

export default function AllEvents({ user, setShowLogin, onTicketPurchased }: AllEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setMessage('Failed to load events.');
      }
    };
    fetchEvents();
  }, []);

  const handlePurchase = async (eventId: string) => {
    if (!user) {
      setMessage('⚠️ Please login to purchase tickets.');
      setShowLogin(true);
      return;
    }

    if (user.role !== 'Attendee') {
      setMessage('❌ Only attendees can purchase tickets.');
      return;
    }

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ eventId, tier: 'General' }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        setMessage(data.message || 'Failed to purchase ticket.');
      } else {
        setMessage('✅ Ticket purchased successfully!');
        if (onTicketPurchased) onTicketPurchased(); 
      }
    } catch (error) {
      console.error('Purchase error:', error);
      setMessage('An error occurred during purchase.');
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-10">
      <h2 className="text-3xl font-bold mb-8 text-indigo-700 flex items-center gap-2">
        🎉 Available Events
      </h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm max-w-2xl ${
            message.startsWith('✅')
              ? 'bg-green-100 text-green-700 border border-green-200'
              : message.startsWith('❌')
              ? 'bg-red-100 text-red-700 border border-red-200'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white shadow-md rounded-xl overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-indigo-600 text-white text-sm uppercase tracking-wide">
            <tr>
              <th className="p-6">Event</th>
              <th className="p-6">Description</th>
              <th className="p-6">Location</th>
              <th className="p-6">Time</th>
              <th className="p-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event, idx) => (
              <tr key={event.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="p-6 font-semibold text-gray-800">{event.name}</td>
                <td className="p-6 text-gray-600 text-sm">{event.description}</td>
                <td className="p-6 text-gray-700">{event.location}</td>
                <td className="p-6 text-sm text-gray-500">
                  {new Date(event.startTime).toLocaleString()}
                </td>
                <td className="p-6 text-center">
                  <button
                    className="bg-emerald-600 text-white px-5 py-2 rounded-md hover:bg-emerald-700 transition"
                    onClick={() => handlePurchase(event.id)}
                  >
                    Purchase
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
