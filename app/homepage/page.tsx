"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, Users2Icon, Ticket, LogOut, PlusCircle } from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import EventForm from '../components/EventForm';

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

interface Ticket {
  id: number;
  eventId: number;
  userId: string;
  tier: string;
  createdAt: string;
}

export default function HomepageEvents() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }

      setIsLoading(false);
    };

    fetchUser();
  }, []);

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

  useEffect(() => {
    if (user) {
      fetchUserTickets(user.id);
    }
  }, [user]);

  const fetchUserTickets = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
      
      const response = await fetch(`/api/tickets?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      toast.error("Failed to load tickets.");
    }
  };

  const isOrganizer = user?.role === "Organizer";

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/");
  };

  const handlePurchase = async (eventId: number) => {
    if (!user) {
      toast.info("Please login to purchase tickets.");
      router.push(`/login?redirect=/homepage`);
      return;
    }

    if (isOrganizer) {
      toast.error("Organizers cannot purchase tickets.");
      return;
    }

    try {
      const response = await fetch(`/api/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId,
          tier: 'General', // Example tier
          discountCode: null // Add discount code if applicable
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Ticket purchased successfully!');
        
        // Delay redirect for 1 seconds to show the success message
        setTimeout(() => {
          router.push("/my-tickets");
        }, 1000);
      } else {
        toast.error(data.message || 'Failed to purchase ticket');
      }
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Failed to purchase ticket');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const handleEventCreated = (newEvent: any) => {
    // Add the new event to the events list
    setEvents([...events, newEvent]);
    // Hide the form
    setShowCreateForm(false);
    // Show success message
    toast.success('Event created successfully!');
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Toaster position="top-right" richColors closeButton />
      <div className="container w-full max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Exciting Events
            </h1>
            <p className="text-slate-500 mt-1">Find your next adventure!</p>
          </div>

          <div className="flex gap-3 mt-2 md:mt-0">
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
              <div className="flex items-center gap-3">
                <Link href="/my-tickets">
                  <Button variant="secondary" className="flex items-center gap-2">
                    <Ticket className="w-4 h-4" />
                    View My Tickets
                  </Button>
                </Link>
                {user?.role === 'Organizer' && (
                  <Button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4" />
                    {showCreateForm ? 'Hide Form' : 'Create Event'}
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </div>
            )}
          </div>
        </div>

        {user ? (
          <p className="mb-2 text-sm">Welcome, <span className="font-semibold">{user.email}</span> 
          </p>
        ) : (
          <p className="mb-2 text-sm">Please log in to purchase tickets.</p>
        )}

        {/* Event Creation Form for Organizers */}
        {user?.role === 'Organizer' && showCreateForm && (
          <div className="mb-6">
            <EventForm onSubmit={handleEventCreated} onCancel={() => setShowCreateForm(false)} />
          </div>
        )}

        {isLoading ? (
          <p className="text-center text-slate-500">Loading events...</p>
        ) : events.length === 0 ? (
          <p className="text-center text-slate-500">No events found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
