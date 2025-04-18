'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast, Toaster } from 'sonner';
import {
  Calendar, Clock, MapPinIcon, Users2Icon, DollarSign, Ticket, Info
} from "lucide-react";

export default function PurchasePage() {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [tier, setTier] = useState("General");
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);

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
        setTimeout(() => {
          router.push("/my-tickets");
        }, 2000);
      } else {
        toast.error(data.message || "Something went wrong");
      }
    } catch (err) {
      toast.error("Error processing purchase");
    } finally {
      setLoading(false);
    }
  };

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

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center text-gray-600">Loading event...</div>;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <Toaster position="top-right" richColors closeButton />
      <div className="container max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white shadow-md rounded-xl p-6 fancy-card relative group">
          {/* Gradient background decoration */}
          <div className="fancy-card-gradient absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"></div>

          <div className="ticket-header mb-4">
            <div className="ticket-event-name">
              <h1 className="text-3xl font-bold text-gray-800 leading-tight">{event.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  <Clock className="h-4 w-4 mr-1 text-indigo-500" />
                  {formatTime(event.startTime)} - {formatTime(event.endTime)}
                </Badge>
                <Badge className={event.remaining <= 0 ? "bg-red-500" : "bg-green-500"}>
                  {event.remaining <= 0 ? "Sold Out" : `${event.remaining} spots left`}
                </Badge>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{event.description || "No description provided."}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="flex items-start gap-2">
              <Calendar className="text-indigo-500 w-4 h-4 mt-1" />
              <div>
                <div className="text-gray-500">Date</div>
                <div className="font-medium text-gray-800">{formatDate(event.startTime)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="text-indigo-500 w-4 h-4 mt-1" />
              <div>
                <div className="text-gray-500">Time</div>
                <div className="font-medium text-gray-800">{formatTime(event.startTime)} - {formatTime(event.endTime)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPinIcon className="text-indigo-500 w-4 h-4 mt-1" />
              <div>
                <div className="text-gray-500">Location</div>
                <div className="font-medium text-gray-800">{event.location}</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users2Icon className="text-indigo-500 w-4 h-4 mt-1" />
              <div>
                <div className="text-gray-500">Capacity</div>
                <div className="font-medium text-gray-800">{event.capacity} total / {event.remaining} left</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <DollarSign className="text-indigo-500 w-4 h-4 mt-1" />
              <div>
                <div className="text-gray-500">Price</div>
                <div className="font-medium text-gray-800">{tier === "VIP" ? "$100 (VIP)" : "$50 (General)"}</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">Select Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="General">General - $50</option>
                <option value="VIP">VIP - $100</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-sm text-gray-700 mb-1">Discount Code (optional)</label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g. SPRING2025"
              />
            </div>

            <Button
              className="w-full py-3 text-white font-bold fancy-ticket-button flex justify-center items-center gap-2"
              onClick={handlePurchase}
              disabled={loading || event.remaining <= 0}
            >
              <Ticket className="w-5 h-5" />
              {loading ? "Processing..." : event.remaining <= 0 ? "Sold Out" : "Confirm Purchase"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
