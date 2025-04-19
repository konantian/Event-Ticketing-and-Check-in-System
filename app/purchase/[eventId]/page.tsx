'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Calendar, Clock, MapPin, Users2Icon, DollarSign, Ticket, CreditCard
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

export default function PurchasePage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState<any>(null);
  const [tier, setTier] = useState("General");
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRedirectToast, setShowRedirectToast] = useState(false);
  const [redirectTimeout, setRedirectTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (res.ok) setEvent(data.event);
        else toast.error(data.message || "Failed to load event");
      } catch (err) {
        toast.error("Error loading event");
      }
    };
    fetchEvent();
  }, [eventId]);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          eventId,
          tier,
          discountCode: discountCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("🎉 Ticket purchased successfully!");
        setShowRedirectToast(true);

        const timeout = setTimeout(() => {
          router.push("/my-tickets");
        }, 2000);

        setRedirectTimeout(timeout);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Error processing purchase");
    } finally {
      setLoading(false);
    }
  };

  const cancelRedirect = () => {
    if (redirectTimeout) clearTimeout(redirectTimeout);
    setShowRedirectToast(false);
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading event...
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="ticket-container">
          <div className="ticket-card-wrapper">
            <div className="ticket-body">
              <div className="ticket-top-decoration">
                <div className="ticket-hole"></div>
                <div className="ticket-hole"></div>
                <div className="ticket-hole"></div>
              </div>

              <div className="ticket-content">
                <div className="ticket-header">
                  <div className="ticket-event-name">
                    <h3 className="text-2xl font-bold text-gray-800">{event.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        <Clock className="w-4 h-4 mr-1" />
                        {formatTime(event.startTime)} - {formatTime(event.endTime)}
                      </Badge>
                      <Badge className={event.remaining <= 0 ? "bg-red-500" : "bg-green-500"}>
                        {event.remaining <= 0 ? "Sold Out" : `${event.remaining} spots left`}
                      </Badge>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">{event.description || "No description provided."}</p>

                <div className="ticket-details-grid mb-6">
                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon"><Calendar className="h-4 w-4 text-indigo-500" /></div>
                    <div className="ticket-detail-content">
                      <span className="ticket-detail-label">Date</span>
                      <span className="ticket-detail-value">{formatDate(event.startTime)}</span>
                    </div>
                  </div>
                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon"><MapPin className="h-4 w-4 text-indigo-500" /></div>
                    <div className="ticket-detail-content">
                      <span className="ticket-detail-label">Location</span>
                      <span className="ticket-detail-value">{event.location}</span>
                    </div>
                  </div>
                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon"><Users2Icon className="h-4 w-4 text-indigo-500" /></div>
                    <div className="ticket-detail-content">
                      <span className="ticket-detail-label">Capacity</span>
                      <span className="ticket-detail-value">{event.capacity} total / {event.remaining} left</span>
                    </div>
                  </div>
                  <div className="ticket-detail-item">
                    <div className="ticket-detail-icon"><DollarSign className="h-4 w-4 text-indigo-500" /></div>
                    <div className="ticket-detail-content">
                      <span className="ticket-detail-label">Price</span>
                      <span className="ticket-detail-value font-semibold">
                        {tier === "VIP" ? "$100" : "$50"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tier Dropdown */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Select Ticket Tier
                  </label>
                  <select
                    value={tier}
                    onChange={(e) => setTier(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="General">General - $50</option>
                    <option value="VIP">VIP - $100</option>
                  </select>
                </div>

                {/* Discount Code */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Discount Code (optional)
                  </label>
                  <input
                    type="text"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    className="w-full border rounded px-3 py-2 text-sm"
                    placeholder="e.g. SPRING2025"
                  />
                </div>

                {/* Mock Credit/Debit */}
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Credit / Debit (mock)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full border rounded px-3 py-2 text-sm text-gray-500 bg-gray-100 pr-10"
                      disabled
                      placeholder="**** **** **** 4242"
                    />
                    <CreditCard className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
                  </div>
                </div>

                {/* Purchase Button */}
                <div className="ticket-pricing-tier">
                  <Button
                    onClick={handlePurchase}
                    disabled={loading || event.remaining <= 0}
                    className="w-full py-3 text-white font-bold fancy-ticket-button flex justify-center items-center gap-2"
                  >
                    <Ticket className="w-5 h-5" />
                    {loading ? "Processing..." : event.remaining <= 0 ? "Sold Out" : "Confirm Purchase"}
                  </Button>
                </div>

                {/* Redirect Toast */}
                {showRedirectToast && (
                  <div className="mt-4 p-4 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-md flex justify-between items-center">
                    <span>
                      ✅ Purchase complete. Redirecting to your ticket page in <b>2 seconds</b>...
                    </span>
                    <Button onClick={cancelRedirect} variant="ghost" className="text-sm text-indigo-700 hover:underline">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
