"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, User, MapPin, Clock, QrCode, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
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
      <div className="flex justify-center items-center h-32 bg-white p-8 rounded-lg shadow-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600"></div>
        <p className="ml-4 text-indigo-700 font-medium">Loading your tickets...</p>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className="bg-gray-50 border-dashed border-2 border-gray-200 fancy-card overflow-hidden relative">
        <div className="fancy-card-gradient absolute inset-0 opacity-3"></div>
        <CardContent className="flex flex-col items-center justify-center py-12 relative z-10">
          <div className="rounded-full bg-gray-100 p-3 mb-4">
            <Ticket className="h-6 w-6 text-indigo-500" />
          </div>
          <p className="text-gray-700 text-lg font-medium">No tickets found</p>
          <p className="text-gray-500 mt-1">Purchase tickets to events to see them here</p>
          <Link href="/homepage">
            <Button variant="outline" className="mt-6 fancy-button-secondary group relative overflow-hidden">
              <span className="relative z-10 flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4 transition-transform group-hover:scale-110" />
                Browse Events
              </span>
            </Button>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {tickets
                .filter(ticket => {
                  const ticketDate = new Date(ticket.event.startTime);
                  return isSameDay(ticketDate, dateGroup.dateObj);
                })
                .map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className={`ticket-container ${!ticket.checkIn ? 'unchecked' : ''}`}
                  >
                    <div className="ticket-card-wrapper">
                      <div className="ticket-body">
                        {/* Main ticket content */}
                        <div className="ticket-content">
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
                                {ticket.checkIn === null ? 'Not Checked in yet' :
                                `Checked In: ${formatCheckInTime(ticket.checkIn?.timestamp)}`}
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
                                <>
                                  <Button 
                                    variant="default" 
                                    size="default"
                                    className="fancy-button-accent group relative overflow-hidden" 
                                    onClick={() => handleCheckIn(ticket)}
                                    disabled={checkingIn}
                                    onMouseEnter={() => setActiveTicketId(ticket.id)}
                                    onMouseLeave={() => setActiveTicketId(null)}
                                  >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                      <CheckCircle2 className="h-5 w-5 transition-transform group-hover:scale-110" />
                                      {activeTicketId === ticket.id ? 'Check In Now' : 'Check In'}
                                    </span>
                                  </Button>
                                  
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="fancy-button-secondary group relative overflow-hidden" 
                                    onClick={() => setShowQrCode(ticket.id === showQrCode ? null : ticket.id)}
                                  >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                      <QrCode className="h-4 w-4 transition-transform group-hover:rotate-12" />
                                      {ticket.id === showQrCode ? 'Hide QR' : 'View QR'}
                                    </span>
                                  </Button>
                                </>
                              )}

                              {ticket.checkIn && (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  <span className="text-green-600 text-sm font-medium">
                                    Checked In Successfully
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* QR Code section (visible when toggled) */}
                        {ticket.id === showQrCode && !ticket.checkIn && (
                          <div className="ticket-stub">
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
                    </div>
                  </div>
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
        
        /* Ticket design styles */
        .ticket-container {
          margin-bottom: 1.5rem;
          perspective: 1000px;
        }
        
        @media (min-width: 1024px) {
          .grid-cols-3 > .ticket-container,
          .grid-cols-4 > .ticket-container {
            height: 100%;
          }
        }
        
        .ticket-container.unchecked {
          animation: float 3s ease-in-out infinite;
        }
        
        .ticket-card-wrapper {
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: transform 0.3s ease;
        }
        
        .ticket-card-wrapper:hover {
          transform: translateY(-5px) rotateX(5deg);
          box-shadow: 0 15px 30px -10px rgba(0, 0, 0, 0.1);
        }
        
        .ticket-body {
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }
        
        .ticket-content {
          position: relative;
          padding: 1.5rem;
          flex: 1;
          background-color: white;
          background-image: 
            radial-gradient(circle at 50px 50px, rgba(99, 102, 241, 0.05) 20px, transparent 0),
            radial-gradient(circle at 150px 150px, rgba(99, 102, 241, 0.05) 30px, transparent 0),
            radial-gradient(circle at 250px 80px, rgba(99, 102, 241, 0.05) 25px, transparent 0);
        }
        
        .ticket-content::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
        }
        
        .ticket-stub {
          padding: 1.5rem;
          background: #f9fafb;
          border-top: 2px dashed #e5e7eb;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        
        /* Scalloped edges */
        .ticket-body::before,
        .ticket-body::after {
          content: "";
          position: absolute;
          width: 16px;
          height: 16px;
          background-color: #f3f4f6;
          border-radius: 50%;
          z-index: 2;
        }
        
        /* Left side scalloped edge */
        .ticket-body::before {
          left: -8px;
          top: 50%;
          box-shadow: 
            0 -60px 0 #f3f4f6,
            0 -120px 0 #f3f4f6,
            0 -180px 0 #f3f4f6,
            0 60px 0 #f3f4f6,
            0 120px 0 #f3f4f6,
            0 180px 0 #f3f4f6;
        }
        
        /* Right side scalloped edge */
        .ticket-body::after {
          right: -8px;
          top: 50%;
          box-shadow: 
            0 -60px 0 #f3f4f6,
            0 -120px 0 #f3f4f6,
            0 -180px 0 #f3f4f6,
            0 60px 0 #f3f4f6,
            0 120px 0 #f3f4f6,
            0 180px 0 #f3f4f6;
        }
        
        .ticket-content::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 10%;
          width: 80%;
          height: 1px;
          background: repeating-linear-gradient(90deg, #ddd, #ddd 5px, transparent 5px, transparent 10px);
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
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