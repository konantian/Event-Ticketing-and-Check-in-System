"use client";

import TicketList from "../components/TicketList";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
        <Link href="/homepage">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Homepage
          </Button>
        </Link>
      </div>
      <TicketList />
    </div>
  );
}
