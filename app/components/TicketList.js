// app/components/TicketList.tsx
'use client';

import { useEffect, useState } from 'react';

export default function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
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
      } catch (err) {
        setError(err.message);
        setTickets([]);
      }
    };

    fetchTickets();
  }, []);

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-4 text-center">My Tickets</h2>

      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

      <ul className="space-y-4">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="p-4 border rounded shadow-sm">
            <p><strong>Tier:</strong> {ticket.tier}</p>
            <p><strong>Price:</strong> ${ticket.price}</p>
            <p><strong>QR:</strong> {ticket.qrCodeData}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
