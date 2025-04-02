'use client';

import { useEffect, useState } from 'react';

interface Ticket {
  id: string;
  eventId: string;
  eventName: string;
  tier: string;
  price: number;
  qrCodeData: string;
}

export default function TicketList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Failed to load tickets');

      setTickets(data.tickets || []);
    } catch (err: any) {
      setError(err.message);
      setTickets([]);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-3xl mx-auto mt-10">
      <h2 className="text-3xl font-semibold mb-6 text-center text-gray-800">🎟 My Tickets</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-200 rounded">
          {error}
        </div>
      )}

      {tickets.length === 0 && !error && (
        <p className="text-center text-gray-500">You have no tickets yet.</p>
      )}

      <ul className="space-y-4">
        {tickets.map((ticket) => (
          <li
            key={ticket.id}
            className="p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm hover:shadow transition"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-gray-800">Event ID: {ticket.eventName}</h3>
              <span className="text-sm text-gray-600">{ticket.tier}</span>
            </div>
            <p className="text-gray-700">Price: <strong>${ticket.price}</strong></p>
            <p className="text-gray-600 text-sm break-all">QR Code: {ticket.qrCodeData}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
