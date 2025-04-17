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
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();

  // Check if user is authenticated
  useEffect(() => {
    const fetchUser = async () => {
      setIsAuthLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthLoading(false);
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

      setIsAuthLoading(false);
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
            <p className="text-slate-500 mt-1">Find your next adventure!</p>
          </div>

          <div className="flex gap-5 mt-2 md:mt-0">
            {isAuthLoading ? (
              // Show loading indicator instead of login/register buttons
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : !user ? (
              <div className="flex space-x-8">
                <Link href="/login">
                  <Button variant="outline" className="fancy-button-secondary group relative overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center">Login</span>
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="fancy-button group relative overflow-hidden">
                    <span className="relative z-10 flex items-center justify-center">Register</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-8">
                {user?.role !== 'Organizer' && (
                  <Link href="/my-tickets" className="mr-4">
                    <Button variant="secondary" className="fancy-button-accent group relative overflow-hidden">
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Ticket className="w-4 h-4 transition-transform group-hover:rotate-12" />
                        View My Tickets
                      </span>
                    </Button>
                  </Link>
                )}
                {user?.role === 'Organizer' && (
                  <Button 
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    variant="outline"
                    className="fancy-button-secondary group relative overflow-hidden mr-4"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                      {showCreateForm ? 'Hide Form' : 'Create Event'}
                    </span>
                  </Button>
                )}
                <Button variant="outline" onClick={handleLogout} className="fancy-button-danger group relative overflow-hidden">
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    Logout
                  </span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-6">
            {events.map((event) => (
              <Card key={event.id} className="border-0 shadow-md rounded-xl fancy-card overflow-hidden relative group">
                <CardContent className="p-8">
                  <div className="fancy-card-gradient absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  <h3 className="text-2xl font-bold text-gray-800 relative z-10">{event.name}</h3>
                  <p className="text-slate-600 mb-3 relative z-10">{event.description || "No description."}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4 relative z-10">
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
                    className="w-full text-white font-bold py-3 px-6 fancy-ticket-button relative overflow-hidden group"
                    onClick={() => handlePurchase(event.id)}
                    disabled={isOrganizer || event.remaining <= 0}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Ticket className="w-5 h-5 transition-transform group-hover:rotate-12" />
                      {!user
                        ? "Login to Purchase"
                        : isOrganizer
                        ? "Cannot Purchase (Organizer)"
                        : event.remaining <= 0
                        ? "Not available to purchase"
                        : "Purchase Ticket"}
                    </span>
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
