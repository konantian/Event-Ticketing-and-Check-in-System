'use client';

import TicketList from '../components/TicketList';

export default function TicketListPage() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container w-full max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">🎟️ My Tickets</h1>
        <TicketList />
      </div>
    </div>
  );
}
