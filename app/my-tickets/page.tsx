"use client";

import TicketList from "../components/TicketList";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MyTicketsPage() {
  const [user, setUser] = useState(null);
  const [tickets, setTickets] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("You must be logged in to view tickets.");
      router.push("/login?redirect=/my-tickets");
    } else {
      setUser({ email: "user@example.com" }); // replace with real user fetch
      fetchTickets(token);
    }
  }, []);

  const fetchTickets = async (token: string) => {
    try {
      const res = await fetch("/api/tickets", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTickets(data.tickets);
      } else {
        toast.error("Failed to fetch tickets");
      }
    } catch (err) {
      toast.error("Error loading tickets");
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="border rounded-lg shadow-sm p-4 bg-white flex flex-col sm:flex-row sm:justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {ticket.event.name}
              </h2>
              <p className="text-sm text-gray-600">
                {new Date(ticket.event.startTime).toLocaleDateString()} — {ticket.tier} Tier
              </p>
              <p className="text-sm text-gray-700 mt-1">
                Paid: <span className="font-medium">${ticket.price.toFixed(2)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

