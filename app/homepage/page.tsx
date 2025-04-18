"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPinIcon, Users2Icon, Ticket, 
  PlusCircle, LogIn, UserPlus, Clock, DollarSign, 
  Calendar, Info
} from "lucide-react";
import Link from "next/link";
import { toast, Toaster } from "sonner";
import EventForm from '../components/EventForm';
import { Badge } from "@/components/ui/badge";
import "../components/ticketList.css"; // Reuse ticket styles

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

  const handlePurchase = (eventId: number) => {
    if (!user) {
      toast.info("Please login to purchase tickets.");
      router.push(`/login?redirect=/homepage`);
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

  const handleEventCreated = (newEvent: any) => {
    // Add the new event to the events list
    setEvents([...events, newEvent]);
    // Hide the form
    setShowCreateForm(false);
    // Show success message
    toast.success('Event created successfully!');
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeUntilEvent = (eventDate: string) => {
    if (!eventDate) return '';
    
    const eventTime = new Date(eventDate).getTime();
    const now = new Date().getTime();
    
    const timeRemaining = eventTime - now;
    
    if (timeRemaining <= 0) {
      return 'Event has started';
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} min`;
    } else {
      const minutes = Math.floor(timeRemaining / (1000 * 60));
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Toaster position="top-right" richColors closeButton />
      <div className="container w-full max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-2">
          <div className="mb-3 md:mb-0">
            <p className="text-slate-500">Find your next adventure!</p>
          </div>

          <div className="flex w-full md:w-auto gap-5 mt-2 md:mt-0">
            {isAuthLoading ? (
              // Show loading indicator instead of login/register buttons
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            ) : !user ? (
              <div className="flex w-full justify-between gap-4 login-register-container">
                <Link href="/login" className="w-full">
                  <Button variant="outline" className="fancy-button group relative overflow-hidden w-full h-10">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <LogIn className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      <span>Login</span>
                    </span>
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button className="fancy-button group relative overflow-hidden w-full h-10">
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4 transition-transform group-hover:scale-110" />
                      <span>Register</span>
                    </span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3 header-button-container">
                {user?.role !== 'Organizer' && (
                  <Link href="/my-tickets">
                    <Button variant="secondary" className="fancy-button-accent group relative overflow-hidden w-36 h-10">
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
                    className="fancy-ticket-button group relative overflow-hidden w-36 h-10"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <PlusCircle className="w-4 h-4 transition-transform group-hover:scale-110" />
                      {showCreateForm ? 'Hide Form' : 'Create Event'}
                    </span>
                  </Button>
                )}
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
              <Card key={event.id} className="border-0 shadow-md rounded-xl fancy-card event-card overflow-hidden relative group">
                <div className="ticket-top-decoration">
                  <div className="ticket-hole"></div>
                  <div className="ticket-hole"></div>
                  <div className="ticket-hole"></div>
                </div>
                <CardContent className="p-6">
                  <div className="fancy-card-gradient absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"></div>
                  
                  {/* Event header with title and time info */}
                  <div className="ticket-header mb-4">
                    <div className="ticket-event-name">
                      <h3 className="text-2xl font-bold text-gray-800 leading-tight">{event.name}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 countdown-badge">
                          <Clock className="h-3 w-3 mr-1 text-indigo-500" />
                          {getTimeUntilEvent(event.startTime)}
                        </Badge>
                        <Badge className={event.remaining <= 0 ? "bg-red-500" : "bg-green-500"}>
                          {event.remaining <= 0 ? "Sold Out" : `${event.remaining} spots left`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  {/* Event description */}
                  <p className="text-slate-600 mb-4 relative z-10">{event.description || "No description."}</p>
                  
                  {/* Event details in a grid layout similar to ticket */}
                  <div className="ticket-details-grid mb-4 relative z-10">
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <Calendar className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Date</span>
                        <span className="ticket-detail-value">{formatDate(event.startTime)}</span>
                      </div>
                    </div>
                    
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <Clock className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Time</span>
                        <span className="ticket-detail-value">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                      </div>
                    </div>
                    
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <MapPinIcon className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Location</span>
                        <span className="ticket-detail-value">{event.location}</span>
                      </div>
                    </div>
                    
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <Users2Icon className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Capacity</span>
                        <span className="ticket-detail-value">{event.capacity} total / {event.remaining} left</span>
                      </div>
                    </div>
                    
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <Info className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Organizer</span>
                        <span className="ticket-detail-value">{event.organizer?.email?.split('@')[0] || 'Unknown'}</span>
                      </div>
                    </div>
                    
                    <div className="ticket-detail-item">
                      <div className="ticket-detail-icon">
                        <DollarSign className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div className="ticket-detail-content">
                        <span className="ticket-detail-label">Price</span>
                        <span className="ticket-detail-value font-semibold">${event.capacity}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Purchase button with bottom ticket decoration */}
                  <div className="ticket-pricing-tier">
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
                          ? "Sold Out"
                          : "Purchase Ticket"}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
