"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Fetch tickets from backend API
        const token = localStorage.getItem('token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await fetch('/api/tickets', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }
        
        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (error) {
        toast.error(error.message || 'Something went wrong');
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-24">
        <p className="text-sm text-muted-foreground">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-24">
          <p className="text-sm text-muted-foreground">
            You don't have any tickets yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">My Tickets</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden">
              <div className="flex items-center p-4 border-b">
                <div className="flex-1">
                  <h3 className="font-medium">{ticket.eventName}</h3>
                  <p className="text-sm text-muted-foreground">{new Date(ticket.event?.startTime).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${ticket.price}</p>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{ticket.tier}</p>
                </div>
              </div>
              
              <div className="p-4 bg-muted/30 flex justify-between items-center">
                <p className="text-sm">
                  <span className="font-medium">Status:</span> Active
                </p>
                <button className="text-sm text-primary hover:underline">
                  View QR Code
                </button>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default TicketList; 