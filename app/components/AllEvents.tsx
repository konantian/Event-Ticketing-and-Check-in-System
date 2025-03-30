'use client';

import { useEffect, useState } from 'react';

export default function AllEvents({ user, setShowLogin }) {
    const [events, setEvents] = useState([]);
    const [message, setMessage] = useState('');
  
    useEffect(() => {
      const fetchEvents = async () => {
        const res = await fetch('/api/events');
        const data = await res.json();
        setEvents(data.events || []);
      };
      fetchEvents();
    }, []);
  
    const handlePurchase = async (eventId) => {
      if (!user) {
        setMessage('Please login to purchase tickets.');
        setShowLogin(true); // 👈 trigger login view
        return;
      }
  
      if (user.role !== 'Attendee') {
        setMessage('Only attendees can purchase tickets.');
        return;
      }
  
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ eventId, tier: 'General' }),
      });
  
      const data = await res.json();
  
      if (!res.ok) {
        setMessage(data.message || 'Failed to purchase ticket.');
      } else {
        setMessage('🎉 Ticket purchased!');
      }
    };
  
    return (
      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-center">Available Events</h2>
        {message && <p className="text-center text-yellow-600 mb-4">{message}</p>}
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <div key={event.id} className="p-4 border rounded shadow bg-white">
              <h3 className="text-lg font-bold">{event.name}</h3>
              <p>{event.description}</p>
              <p className="text-sm text-gray-500 mt-2">{event.location}</p>
              <p className="text-sm text-gray-500">{new Date(event.startTime).toLocaleString()}</p>
  
              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                onClick={() => handlePurchase(event.id)}
              >
                Purchase Ticket
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }
  