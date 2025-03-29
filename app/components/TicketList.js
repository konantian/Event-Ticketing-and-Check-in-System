"use client";
import React, { useEffect, useState } from 'react';

function TicketList() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/tickets');
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        setTickets([]);
      }
    };
    fetchTickets();
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-800">My Tickets</h2>
      <ul className="space-y-4">
        {Array.isArray(tickets) && tickets.map((ticket) => (
          <li key={ticket.id} className="p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
            <h3 className="font-semibold text-lg text-gray-700">{ticket.eventName}</h3>
            <p className="text-gray-600">Price: <span className="font-medium">${ticket.price}</span></p>
            <p className="text-gray-600">Tier: <span className="font-medium">{ticket.tier}</span></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TicketList; 