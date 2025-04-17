"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, User, MapPin, Clock, Download, QrCode } from "lucide-react";
import { toast } from 'sonner';

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState(null);

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

  // Generate a QR code URL for demo purposes
  const generateQrCode = (ticketId) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ticket_id_${ticketId}`;
  };

  // Format date for cleaner display
  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time for cleaner display
  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="ml-3 text-indigo-600 font-medium">Loading tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Ticket className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg font-medium">No tickets found</p>
          <p className="text-gray-400 mt-1">Purchase tickets to events to see them here</p>
          <Button variant="outline" className="mt-4">Browse Events</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">My Tickets</h2>
          <p className="text-gray-500 mt-1">Manage your upcoming event tickets</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row">
              {/* Ticket details */}
              <div className="flex-grow p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{ticket.event.name || 'Event Name'}</h3>
                    <div className="flex items-center text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(ticket.event?.startTime)}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatTime(ticket.event?.startTime)} - {formatTime(ticket.event?.endTime)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{ticket.event?.location || 'Venue TBD'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>1 Attendee</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div>
                    <Badge variant="outline" className="font-medium text-indigo-700 bg-indigo-50 border-indigo-200">
                      {ticket.tier || 'General'}
                    </Badge>
                    <span className="ml-2 text-xl font-bold text-indigo-700">${ticket.price || '0'}</span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1" 
                    onClick={() => setShowQrCode(ticket.id === showQrCode ? null : ticket.id)}
                  >
                    <QrCode className="h-4 w-4" />
                    {ticket.id === showQrCode ? 'Hide' : 'View'} QR
                  </Button>
                </div>
              </div>
              
              {/* QR Code section (visible when toggled) */}
              {ticket.id === showQrCode && (
                <div className="bg-indigo-50 p-4 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-indigo-100">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <img 
                      src={generateQrCode(ticket.id)} 
                      alt="Ticket QR Code" 
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="mt-2 text-xs text-center text-gray-500 max-w-[120px]">
                    Scan at event entrance
                  </p>
                </div>
              )}
            </div>
            
            {/* Ticket footer */}
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t">
              <span className="text-xs text-gray-500">Ticket #{ticket.id}</span>
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                Download PDF
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default TicketList; 