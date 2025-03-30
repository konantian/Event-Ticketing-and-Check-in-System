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
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">🎉 Available Events</h2>
      
          {message && (
            <div
              className={`mb-4 max-w-2xl mx-auto text-center px-4 py-2 rounded ${
                message.includes('success')
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message}
            </div>
          )}
      
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse shadow-md bg-white rounded-lg overflow-hidden">
              <thead className="bg-indigo-600 text-white">
                <tr>
                  <th className="p-4 text-sm uppercase tracking-wide">Event</th>
                  <th className="p-4 text-sm uppercase tracking-wide">Location</th>
                  <th className="p-4 text-sm uppercase tracking-wide">Time</th>
                  <th className="p-4 text-sm uppercase tracking-wide text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event, idx) => (
                  <tr key={event.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-medium text-gray-900">{event.name}</td>
                    <td className="p-4 text-gray-700">{event.location}</td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(event.startTime).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handlePurchase(event.id)}
                        className="bg-emerald-600 text-white text-sm px-4 py-2 rounded hover:bg-emerald-700 transition"
                      >
                        Purchase
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      
  }
  