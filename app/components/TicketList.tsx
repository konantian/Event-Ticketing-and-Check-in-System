"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Calendar, User, MapPin, Clock, QrCode, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { toast, Toaster } from 'sonner';
import Link from 'next/link';
import './ticketList.css';

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
  const [networkIP, setNetworkIP] = useState<string>("");

  // Helper function to determine price class based on price range
  const getPriceClass = (price: number) => {
    if (price >= 200) return 'price-premium';
    if (price >= 100) return 'price-high';
    if (price >= 50) return 'price-medium';
    return 'price-standard';
  };

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
                              {ticket.tier?.toLowerCase() === 'vip' ? (
                                <div className="fancy-tier vip-tier">
                                  <span className="vip-star">★</span>
                                  <span className="tier-text">VIP</span>
                                </div>
                              ) : ticket.tier?.toLowerCase().includes('premium') || ticket.tier?.toLowerCase().includes('platinum') ? (
                                <div className="fancy-tier premium-tier">
                                  <span className="premium-diamond">♦</span>
                                  <span className="tier-text">{ticket.tier}</span>
                                </div>
                              ) : ticket.tier?.toLowerCase().includes('gold') ? (
                                <div className="fancy-tier gold-tier">
                                  <span className="gold-symbol">●</span>
                                  <span className="tier-text">{ticket.tier}</span>
                                </div>
                              ) : (
                                <div className="fancy-tier standard-tier">
                                  <span className="tier-text">{ticket.tier || 'General'}</span>
                                </div>
                              )}
                              <div className={`price-badge ${getPriceClass(ticket.price || 0)}`}>
                                <span className="price-currency">$</span>
                                <span className="price-amount">{ticket.price || '0'}</span>
                                {ticket.price && ticket.price >= 100 && (
                                  <span className="price-sparkle">✨</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex space-x-2">
                              {!ticket.checkIn && (
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
                            <div className="fancy-qr-container">
                              <div className="qr-outer-glow"></div>
                              <div className="qr-scanner-line"></div>
                              <div className="qr-frame">
                                <img 
                                  src={generateQrCode(ticket)} 
                                  alt="Ticket QR Code" 
                                  className="fancy-qr-code"
                                />
                                <div className="qr-corner top-left"></div>
                                <div className="qr-corner top-right"></div>
                                <div className="qr-corner bottom-left"></div>
                                <div className="qr-corner bottom-right"></div>
                              </div>
                            </div>
                            <p className="qr-caption">
                              Show this QR code to the event organizer to check you in
                            </p>
                            {!networkIP && typeof window !== 'undefined' && 
                              (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
                              <p className="mt-1 text-xs text-center text-red-500 max-w-[200px] font-medium">
                                ⚠️ QR won't work on mobile! Set NEXT_PUBLIC_LOCAL_IP in .env
                              </p>
                            )}
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