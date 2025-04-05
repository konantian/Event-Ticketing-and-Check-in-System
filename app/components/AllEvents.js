"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from 'sonner';
import EventForm from './EventForm';

function AllEvents({ user, setShowLogin }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await response.json();
        setEvents(data.events || []);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handlePurchaseTicket = async (eventId) => {
    if (!user) {
      setShowLogin(true);
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
          price: 10 // Default price, adjust as needed
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to purchase ticket');
      }
      
      toast.success('Ticket purchased successfully!');
    } catch (error) {
      console.error('Error purchasing ticket:', error);
      toast.error(error.message || 'Failed to purchase ticket');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-sm text-muted-foreground">Loading events...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Available Events</h2>
        {user?.role === 'Organizer' && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Hide Form' : 'Create New Event'}
          </Button>
        )}
      </div>

      {user?.role === 'Organizer' && showCreateForm && (
        <div className="mt-4">
          <EventForm />
        </div>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No events available at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle>{event.name}</CardTitle>
                <CardDescription>
                  {new Date(event.startTime).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-2 flex-grow">
                <p className="text-sm text-gray-600 line-clamp-3">{event.description}</p>
                <div className="mt-2 text-sm text-muted-foreground">
                  <div>Capacity: {event.capacity}</div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t">
                <Button 
                  className="w-full" 
                  onClick={() => handlePurchaseTicket(event.id)}
                  disabled={!user || user.role === 'Organizer'}
                >
                  {!user 
                    ? 'Login to Purchase' 
                    : user.role === 'Organizer' 
                      ? 'Cannot Purchase (Organizer)' 
                      : 'Purchase Ticket'
                  }
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllEvents; 