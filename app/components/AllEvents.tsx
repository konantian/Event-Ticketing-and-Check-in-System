"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, Users2Icon, Ticket } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Event {
  id: number;
  name: string;
  description: string;
  capacity: number;
  remaining: number;
  location: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  organizerId: number;
  organizer: {
    id: number;
    email: string;
  };
}

interface AllEventsProps {
  user: User | null;
}

export default function AllEvents({ user }: AllEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        const data = await response.json();
        setEvents(data.events || []);
      } catch (err) {
        toast.error("Failed to load events.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const isOrganizer = user?.role === "Organizer";

  const handlePurchase = (eventId: number) => {
    if (!user) {
      toast.info("Please login to purchase tickets.");
      return;
    }

    if (isOrganizer) {
      toast.error("Organizers cannot purchase tickets.");
      return;
    }

    router.push(`/purchase/${eventId}`);
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            Exciting Events
          </h1>
          <p className="text-slate-500 mt-1">Find your next adventure!</p>
        </div>

        <div className="flex gap-3 mt-4 md:mt-0">
          {!user ? (
            <>
              <Link href="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Register</Button>
              </Link>
            </>
          ) : (
            <Link href="/my-tickets">
              <Button variant="secondary" className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                View My Tickets
              </Button>
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500">Loading events...</p>
      ) : events.length === 0 ? (
        <p className="text-center text-slate-500">No events found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="border-0 shadow-md rounded-xl">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-gray-800">{event.name}</h3>
                <p className="text-slate-600 mb-3">{event.description || "No description."}</p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2 text-purple-500" />
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                    {formatDate(event.startTime)}
                  </div>
                  <div className="flex items-center">
                    <Users2Icon className="w-5 h-5 mr-2 text-orange-500" />
                    {event.remaining} spots left
                  </div>
                  <div className="flex items-center">
                    <span className="mr-2 text-green-600 font-semibold">$</span>
                    {event.capacity}
                  </div>
                </div>
                <Button
                  className="w-full text-black hover:text-white hover:bg-white/30 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => handlePurchase(event.id)}
                  disabled={isOrganizer}
                >
                  {!user
                    ? "Login to Purchase"
                    : isOrganizer
                    ? "Cannot Purchase (Organizer)"
                    : "Purchase Ticket"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
