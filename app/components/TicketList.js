import React, { useEffect, useState } from 'react';

function TicketList() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    // Fetch tickets from backend API
    const fetchTickets = async () => {
      const response = await fetch('/api/tickets');
      const data = await response.json();
      setTickets(data.tickets);
    };
    fetchTickets();
  }, []);

  return (
    <div className="max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">My Tickets</h2>
      <ul className="space-y-2">
        {tickets.map((ticket) => (
          <li key={ticket.id} className="p-4 border border-gray-300 rounded">
            <h3 className="font-bold">{ticket.eventName}</h3>
            <p>Price: ${ticket.price}</p>
            <p>Tier: {ticket.tier}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TicketList; 