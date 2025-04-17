"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, User, MapPin, Clock, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { toast } from 'sonner';

interface TicketType {
  id: number;
  eventId: number;
  userId: string;
  tier: string;
  price?: number;
  checkIn?: {
    timestamp: string;
  } | null;
  event: {
    name: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  qrCodeData?: string;
}

interface GroupedTicketType {
  eventId: number;
  tickets: TicketType[];
  event: {
    name: string;
    startTime: string;
    endTime: string;
    location: string;
  };
  count: number;
  price?: number;
  tier: string;
  firstTicketId: number;
  checkedInCount: number;
}

function TicketList() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [groupedTickets, setGroupedTickets] = useState<GroupedTicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);

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
        // Ensure all tickets have qrCodeData
        const ticketsWithQR = data.tickets?.map((ticket: TicketType) => {
          if (!ticket.qrCodeData) {
            // Generate a unique QR code data if not present
            ticket.qrCodeData = `ticket-${ticket.id}-${ticket.eventId}-${Date.now()}`;
          }
          return ticket;
        }) || [];
        setTickets(ticketsWithQR);
      } catch (error) {
        toast.error(error.message || 'Something went wrong');
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  // Group tickets by event when tickets change
  useEffect(() => {
    const groupTicketsByEvent = () => {
      // Create a map to group tickets by eventId
      const ticketGroups = new Map<number, TicketType[]>();
      
      tickets.forEach(ticket => {
        const eventId = ticket.eventId;
        if (!ticketGroups.has(eventId)) {
          ticketGroups.set(eventId, []);
        }
        ticketGroups.get(eventId)?.push(ticket);
      });
      
      // Convert the map to an array of grouped tickets
      const grouped = Array.from(ticketGroups.entries()).map(([eventId, eventTickets]) => {
        const firstTicket = eventTickets[0];
        // Count how many tickets have been checked in
        const checkedInCount = eventTickets.filter(ticket => ticket.checkIn !== null).length;
        
        return {
          eventId,
          tickets: eventTickets,
          event: firstTicket.event,
          count: eventTickets.length,
          price: firstTicket.price,
          tier: firstTicket.tier,
          firstTicketId: firstTicket.id,
          checkedInCount
        };
      });
      
      setGroupedTickets(grouped);
    };
    
    groupTicketsByEvent();
  }, [tickets]);

  // Generate a QR code URL using the ticket's actual QR code data
  const generateQrCode = (ticket: TicketType) => {
    // If ticket doesn't have qrCodeData, generate one based on ticket ID and event ID
    if (!ticket.qrCodeData) {
      ticket.qrCodeData = `ticket-${ticket.id}-${ticket.eventId}-${Date.now()}`;
    }
    
    // Create a URL that can be opened on a mobile device to check in
    // Points directly to the auto check-in page
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const checkInUrl = `${baseUrl}/check-in?qr=${encodeURIComponent(ticket.qrCodeData)}`;
    
    // URL encode the entire check-in URL for the QR code
    const encodedUrl = encodeURIComponent(checkInUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`;
  };

  // Format date for cleaner display
  const formatDate = (dateString?: string) => {
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
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format check-in timestamp
  const formatCheckInTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Handle self check-in
  const handleCheckIn = async (ticket: TicketType) => {
    if (ticket.checkIn) {
      toast.info('This ticket has already been checked in.');
      return;
    }

    if (!ticket.qrCodeData) {
      toast.error('No QR code data available for this ticket.');
      return;
    }

    setCheckingIn(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeData: ticket.qrCodeData })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Check-in successful!');
        // Update the ticket in the state
        const updatedTickets = tickets.map(t => {
          if (t.id === ticket.id) {
            return {
              ...t,
              checkIn: {
                timestamp: data.checkIn.timestamp || new Date().toISOString()
              }
            };
          }
          return t;
        });
        setTickets(updatedTickets);
      } else {
        toast.error(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      toast.error('Something went wrong during check-in');
    } finally {
      setCheckingIn(false);
    }
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groupedTickets.map((groupedTicket) => (
          <Card key={groupedTicket.eventId} className={`overflow-hidden hover:shadow-md transition-shadow ${!groupedTicket.tickets[0].checkIn ? 'border-green-400 border-2' : ''}`}>
            <div className="flex flex-col sm:flex-row">
              {/* Ticket details */}
              <div className="flex-grow p-4 sm:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{groupedTicket.event?.name || 'Event Name'}</h3>
                    <div className="flex items-center text-gray-500 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(groupedTicket.event?.startTime)}</span>
                    </div>
                  </div>
                  <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{formatTime(groupedTicket.event?.startTime)} - {formatTime(groupedTicket.event?.endTime)}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{groupedTicket.event?.location || 'Venue TBD'}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <User className="h-4 w-4 mr-2 text-gray-400" />
                    <span>{groupedTicket.count} {groupedTicket.count === 1 ? 'Attendee' : 'Attendees'}</span>
                  </div>
                  <div className="flex items-center">
                    {groupedTicket.checkedInCount > 0 ? (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2 text-amber-500" />
                    )}
                    <span className={`text-sm ${groupedTicket.checkedInCount > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                      {groupedTicket.tickets[0].checkIn === null ? 'Not checked in yet' : 
                       `Checked in: ${formatCheckInTime(groupedTicket.tickets[0].checkIn?.timestamp)}`}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-6">
                    <Badge variant="outline" className="font-medium text-white bg-purple-600 border-purple-700 hover:bg-purple-700">
                      {groupedTicket.tier || 'General'}
                    </Badge>
                    <span className="text-xl font-bold text-indigo-700">${groupedTicket.price || '0'}</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    {!groupedTicket.tickets[0].checkIn && (
                      <Button 
                        variant="default" 
                        size="default"
                        className="gap-1 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 shadow-lg pulse-animation" 
                        onClick={() => handleCheckIn(groupedTicket.tickets[0])}
                        disabled={checkingIn}
                        onMouseEnter={() => setActiveTicketId(groupedTicket.firstTicketId)}
                        onMouseLeave={() => setActiveTicketId(null)}
                      >
                        <CheckCircle2 className="h-5 w-5 mr-1" />
                        {activeTicketId === groupedTicket.firstTicketId ? 'Check In Now' : 'Check In'}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1" 
                      onClick={() => setShowQrCode(groupedTicket.firstTicketId === showQrCode ? null : groupedTicket.firstTicketId)}
                    >
                      <QrCode className="h-4 w-4" />
                      {groupedTicket.firstTicketId === showQrCode ? 'Hide' : 'View'} QR
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* QR Code section (visible when toggled) */}
              {groupedTicket.firstTicketId === showQrCode && (
                <div className="bg-indigo-50 p-4 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-indigo-100">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <img 
                      src={generateQrCode(groupedTicket.tickets[0])} 
                      alt="Ticket QR Code" 
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="mt-2 text-xs text-center text-gray-500 max-w-[180px]">
                    Scan with your camera app to check in
                  </p>
                  <p className="mt-1 text-xs text-center text-indigo-500 max-w-[180px]">
                    Camera will open a web link to complete check-in
                  </p>
                  <p className="mt-1 text-xs text-center text-gray-600 font-medium max-w-[180px]">
                    QR ID: {groupedTicket.tickets[0].qrCodeData?.substring(0, 8)}...
                  </p>
                  {groupedTicket.count > 1 && (
                    <p className="mt-2 text-xs text-center font-medium text-indigo-700">
                      +{groupedTicket.count - 1} more {groupedTicket.count - 1 === 1 ? 'ticket' : 'tickets'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <style jsx global>{`
        .pulse-animation {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(52, 211, 153, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(52, 211, 153, 0);
          }
        }
      `}</style>
    </div>
  );
}

export default TicketList; 