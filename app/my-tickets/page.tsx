"use client";

import TicketList from "../components/TicketList";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MyTicketsPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Fake auth check from token — replace this with real user logic later
    const token = localStorage.getItem("token");
    if (!token) {
      toast.info("You must be logged in to view tickets.");
      router.push("/login?redirect=/my-tickets");
    } else {
      setUser({ email: "user@example.com" }); // replace with real user fetch
    }
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">My Tickets</h1>
      <TicketList />
    </div>
  );
}
