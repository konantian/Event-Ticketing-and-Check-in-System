"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CalendarIcon, MapPinIcon, Users2Icon } from "lucide-react";
import { toast } from 'sonner';
import EventForm from './EventForm';

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

function AllEvents({ user }: AllEventsProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error(`Failed to fetch events: ${response.status}`);
        const data = await response.json();

        const isEvent = (obj: any): obj is Event =>
          obj &&
          typeof obj.id === 'number' &&
          typeof obj.name === 'string' &&
          typeof obj.description === 'string' &&
          typeof obj.capacity === 'number' &&
          typeof obj.remaining === 'number' &&
          typeof obj.location === 'string' &&
          typeof obj.startTime === 'string' &&
          typeof obj.endTime === 'string' &&
          typeof obj.createdAt === 'string' &&
          typeof obj.updatedAt === 'string' &&
          typeof obj.organizerId === 'number' &&
          obj.organizer &&
          typeof obj.organizer.id === 'number' &&
          typeof obj.organizer.email === 'string';

        const eventsData = (data.events || []) as unknown[];
        const uniqueEvents: Event[] = Array.from(
          new Map(eventsData.filter(isEvent).map(event => [event.id, event])).values()
        );

        setEvents(uniqueEvents);
      } catch (error: any) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const isOrganizer = user?.role === 'Organizer';
  const isLoggedIn = !!user;

  const getButtonClasses = (user: User | null) => {
    const base = 'w-full text-black hover:text-white hover:bg-white/30';
    if (!user) {
      // Guest: blue-purple gradient
      return `${base} bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600`;
    } else if (user.role === 'Organizer') {
      // Organizer: gray button
      return `${base} bg-slate-100 hover:bg-white/30`;
    } else {
      // Regular user: purple-pink gradient
      return `${base} bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600`;
    }
  };
  
  

  const getButtonText = (user: User | null) => {
    if (!user) return 'Login to Purchase';
    if (user.role === 'Organizer') return 'Cannot Purchase (Organizer)';
    return 'Purchase Ticket';
  };

  const handlePurchaseTicket = async (eventId: string) => {
    if (!user) {
      toast.info('Please login to purchase tickets');
      return;
    }

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          eventId,
          tier: 'General',
          price: 10
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to purchase ticket');

      toast.success('Ticket purchased successfully!');
    } catch (error: any) {
      console.error('Error purchasing ticket:', error);
      toast.error(error?.message || 'Failed to purchase ticket');
    }
  };

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'TBD';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'TBD';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">Exciting Events</h1>
        <p className="text-slate-500 mt-1">Find your next adventure and secure your spot today!</p>
        {user && user.role === 'Organizer' && (
          <Button onClick={() => setShowCreateForm(true)} className="mt-4 md:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
            Create Event
          </Button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-8">
          <Card className="shadow-lg border-2 border-purple-100">
            <CardHeader className="pb-4 bg-gradient-to-r from-purple-100 to-blue-100">
              <CardTitle>Create New Event</CardTitle>
            </CardHeader>
            <CardContent>
              <EventForm
                onSubmit={(newEvent) => {
                  const typedNewEvent = newEvent as unknown as Event;
                  setEvents(prev => [...prev, typedNewEvent].filter((event, index, self) =>
                    index === self.findIndex(e => e.id === event.id)
                  ));
                  setShowCreateForm(false);
                  toast.success('Event created successfully!');
                }}
                onCancel={() => setShowCreateForm(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden h-[400px] animate-pulse">
                <CardContent className="p-4">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6 mb-8"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-slate-200 rounded w-full mt-6"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {events.length === 0 ? (
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-dashed border-2 border-purple-200">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CalendarIcon className="h-8 w-8 text-white" />
                  <h3 className="text-xl font-medium text-purple-700 mb-1">No events found</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    There are no upcoming events at the moment. Check back later or create one if you're an organizer.
                  </p>
                  {user && user.role === 'Organizer' && (
                    <Button onClick={() => setShowCreateForm(true)} className="mt-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      Create an Event
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {events.map((event) => (
                  <Card key={event.id} className="border-0 shadow-lg rounded-xl">
                    <CardContent className="p-6">
                      <h3 className="text-2xl font-bold text-gray-800">{event.name}</h3>
                      <p className="text-slate-600">{event.description || 'No description available.'}</p>
                      <div className="grid grid-cols-2 gap-4 py-3">
                        <div className="flex items-center text-sm">
                          <MapPinIcon className="w-5 h-5 mr-2 text-purple-500" />
                          <p>{event.location || 'TBD'}</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
                          <p>{formatDate(event.startTime)}</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <Users2Icon className="w-5 h-5 mr-2 text-orange-500" />
                          <p>{event.remaining} people</p>
                        </div>
                        <div className="flex items-center text-sm">
                          <div className="w-5 h-5 mr-2 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">$</div>
                          <p>${event.capacity}</p>
                        </div>
                      </div>
                      <Button
                        className={getButtonClasses(user)}
                        onClick={() => handlePurchaseTicket(event.id.toString())}
                        disabled={isOrganizer}
                      >
                        {getButtonText(user)}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AllEvents;
