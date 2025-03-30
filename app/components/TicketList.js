"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';

const TicketList = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const res = await fetch('/api/tickets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const enriched = await Promise.all(
        data.tickets.map(async (ticket) => {
          const ev = await fetch(`/api/events/${ticket.eventId}`);
          const evData = await ev.json();
          return { ...ticket, eventName: evData.name };
        })
      );
      setTickets(enriched);
    };
    fetchTickets();
  }, [token]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">My Tickets</h2>
      {tickets.map((ticket) => (
        <div key={ticket.id} className="border p-4 mb-2 rounded">
          <p><strong>Event:</strong> {ticket.eventName}</p>
          <p><strong>Price:</strong> ${ticket.price}</p>
          <p><strong>Tier:</strong> {ticket.tier}</p>
        </div>
      ))}
    </div>
  );
};

export default TicketList;