"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, User, MapPin, Clock, QrCode, CheckCircle2, XCircle } from "lucide-react";
import { toast, Toaster } from 'sonner';
import Link from 'next/link';

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

function TicketList() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showQrCode, setShowQrCode] = useState<number | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<number | null>(null);
  const [networkIP, setNetworkIP] = useState<string>("");

  // Set up local network IP notice for development
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // Show instructions for a better QR code in development
        console.log('DEVELOPER NOTICE: For QR code scanning from mobile devices:');
        console.log('1. Find your computer\'s local IP on your network (e.g., 192.168.x.x)');
        console.log('2. Set "NEXT_PUBLIC_LOCAL_IP=your-ip-address" in your .env file');
        console.log('3. Restart the development server');
      }
      
      // Try to get the IP from environment variable if set
      if (process.env.NEXT_PUBLIC_LOCAL_IP) {
        setNetworkIP(process.env.NEXT_PUBLIC_LOCAL_IP);
      }
    }
  }, []);

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
        
        // Sort tickets by event start time and then by check-in status (unchecked first)
        const sortedTickets = ticketsWithQR.sort((a: TicketType, b: TicketType) => {
          // First sort by event date
          const dateA = new Date(a.event.startTime).getTime();
          const dateB = new Date(b.event.startTime).getTime();
          
          if (dateA !== dateB) {
            return dateA - dateB; // Sort by date ascending
          }
          
          // Then by check-in status (null/unchecked tickets first)
          if (a.checkIn === null && b.checkIn !== null) {
            return -1;
          }
          if (a.checkIn !== null && b.checkIn === null) {
            return 1;
          }
          
          return 0;
        });
        
        setTickets(sortedTickets);
      } catch (error) {
        toast.error(error.message || 'Something went wrong');
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  // Generate a QR code URL using the ticket's actual QR code data
  const generateQrCode = (ticket: TicketType) => {
    // If ticket doesn't have qrCodeData, generate one based on ticket ID and event ID
    if (!ticket.qrCodeData) {
      ticket.qrCodeData = `ticket-${ticket.id}-${ticket.eventId}-${Date.now()}`;
    }
    
    // Build the base URL with proper handling for local development
    let baseUrl = "";
    if (typeof window !== "undefined") {
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : "";
      const protocol = window.location.protocol;
      
      // If running in local development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (networkIP) {
          // Use the configured network IP instead of localhost
          baseUrl = `${protocol}//${networkIP}${port}`;
        } else {
          // Alert developers with a visual cue
          baseUrl = `${protocol}//${hostname}${port}`;
          console.warn('⚠️ QR will not work on mobile devices! Set NEXT_PUBLIC_LOCAL_IP in .env');
        }
      } else {
        // Production: use the actual hostname
        baseUrl = `${protocol}//${hostname}${port}`;
      }
    }
    
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
        // Show a detailed success toast with event name
        toast.success("Check-in successful!");
        
        // Add a 1-second delay to ensure users can see the toast message
        setTimeout(() => {
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
        }, 1000);
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
          <Link href="/homepage">
            <Button variant="outline" className="mt-4">Browse Events</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <div className="space-y-4">
      <Toaster position="top-right" richColors closeButton />
        {/* Event date grouping headers */}
        {getDateGroups(tickets).map(dateGroup => (
          <div key={dateGroup.date}>
            <h3 className="font-semibold text-lg text-gray-700 mb-3 mt-6 border-b pb-2">{dateGroup.label}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets
                .filter(ticket => {
                  const ticketDate = new Date(ticket.event.startTime);
                  return isSameDay(ticketDate, dateGroup.dateObj);
                })
                .map((ticket) => (
                  <Card 
                    key={ticket.id} 
                    className={`overflow-hidden hover:shadow-md transition-shadow ${!ticket.checkIn ? 'border-green-400 border-2' : 'border-gray-200'}`}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Ticket details */}
                      <div className="flex-grow p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-bold text-xl text-gray-900">{ticket.event?.name || 'Event Name'}</h3>
                            <div className="flex items-center text-gray-500 mt-1">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>{formatDate(ticket.event?.startTime)}</span>
                            </div>
                          </div>
                          <Badge className={ticket.checkIn ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"}>
                            {ticket.checkIn ? "Checked In" : "Not Checked In"}
                          </Badge>
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
                            <Ticket className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Ticket ID: {ticket.id}</span>
                          </div>
                          <div className="flex items-center">
                            {ticket.checkIn ? (
                              <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2 text-amber-500" />
                            )}
                            <span className={`text-sm ${ticket.checkIn ? 'text-green-600' : 'text-amber-600'}`}>
                              {ticket.checkIn === null ? 'Not checked in yet' : 
                              `Checked in: ${formatCheckInTime(ticket.checkIn?.timestamp)}`}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-6">
                            <Badge variant="outline" className="font-medium text-white bg-purple-600 border-purple-700 hover:bg-purple-700">
                              {ticket.tier || 'General'}
                            </Badge>
                            <span className="text-xl font-bold text-indigo-700">${ticket.price || '0'}</span>
                          </div>
                          
                          <div className="flex space-x-2">
                            {!ticket.checkIn && (
                              <Button 
                                variant="default" 
                                size="default"
                                className="gap-1 bg-green-600 hover:bg-green-700 text-white font-bold px-5 py-2 shadow-lg pulse-animation" 
                                onClick={() => handleCheckIn(ticket)}
                                disabled={checkingIn}
                                onMouseEnter={() => setActiveTicketId(ticket.id)}
                                onMouseLeave={() => setActiveTicketId(null)}
                              >
                                <CheckCircle2 className="h-5 w-5 mr-1" />
                                {activeTicketId === ticket.id ? 'Check In Now' : 'Check In'}
                              </Button>
                            )}
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
                      </div>
                      
                      {/* QR Code section (visible when toggled) */}
                      {ticket.id === showQrCode && (
                        <div className="bg-indigo-50 p-4 flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-indigo-100">
                          <div className="bg-white p-2 rounded shadow-sm">
                            <img 
                              src={generateQrCode(ticket)} 
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
                          {!networkIP && typeof window !== 'undefined' && 
                           (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                            <p className="mt-1 text-xs text-center text-red-500 max-w-[180px] font-medium">
                              ⚠️ QR won't work on mobile! Set NEXT_PUBLIC_LOCAL_IP in .env
                            </p>
                          )}
                          <p className="mt-1 text-xs text-center text-gray-600 font-medium max-w-[180px]">
                            QR ID: {ticket.qrCodeData?.substring(0, 8)}...
                          </p>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
            </div>
          </div>
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

// Helper function to group tickets by date
function getDateGroups(tickets: TicketType[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  
  // Group dates
  const uniqueDates = new Set<string>();
  tickets.forEach(ticket => {
    const date = new Date(ticket.event.startTime);
    date.setHours(0, 0, 0, 0);
    uniqueDates.add(date.toISOString());
  });
  
  // Sort dates
  const sortedDates = Array.from(uniqueDates).map(dateStr => new Date(dateStr))
    .sort((a, b) => a.getTime() - b.getTime());
  
  // Create date groups
  return sortedDates.map(date => {
    let label = formatDateLabel(date, today, tomorrow, nextWeek);
    return { date: date.toISOString(), dateObj: date, label };
  });
}

// Helper to format date labels
function formatDateLabel(date: Date, today: Date, tomorrow: Date, nextWeek: Date): string {
  if (date.getTime() === today.getTime()) {
    return "Today";
  } else if (date.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else if (date < nextWeek) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  }
}

// Helper to check if two dates are the same day
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
}

export default TicketList; 