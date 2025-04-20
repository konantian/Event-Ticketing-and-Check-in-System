'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreditCard, Calendar, Clock, DollarSign, MapPin, Users2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function PaymentPage() {
  const router = useRouter();
  const params = useSearchParams();

  const [event, setEvent] = useState<any>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [processing, setProcessing] = useState(false);

  const eventId = params.get('eventId');
  const tier = params.get('tier') || 'General';
  const discountCode = params.get('discountCode') || '';

  useEffect(() => {
    if (!eventId) return;

    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load event');
        setEvent(data.event);

        const basePrice = parseFloat(data.event.price || '0');
        const tierPrice = tier === 'VIP' ? basePrice * 1.5 : basePrice;

        if (discountCode.trim()) {
          const token = localStorage.getItem('token');
          const validateRes = await fetch(`/api/discounts/validate?code=${discountCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          const validateData = await validateRes.json();
          if (!validateRes.ok || !validateData.success) {
            toast.error('Invalid discount code');
            setFinalPrice(tierPrice);
            return;
          }

          const discount = validateData.discount;
          const discounted = discount.type === 'Percentage'
            ? tierPrice * (1 - discount.value / 100)
            : tierPrice - discount.value;

          setFinalPrice(Math.max(0, discounted));
        } else {
          setFinalPrice(tierPrice);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to load payment details');
      }
    };

    fetchEvent();
  }, [eventId, tier, discountCode]);

  const handlePurchase = async () => {
    setProcessing(true);
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventId,
          tier,
          discountCode: discountCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success('🎉 Ticket purchased! Redirecting...');
        setTimeout(() => router.push('/my-tickets'), 2000);
      } else {
        toast.error(data.message || 'Something went wrong');
      }
    } catch (err) {
      toast.error('Purchase failed');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString("en-US", {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-3xl font-bold mb-6">🎟️ Complete Your Purchase</h2>

        {event ? (
          <div className="bg-white shadow-md rounded-xl fancy-card relative group mb-8 overflow-hidden">
            <div className="ticket-top-decoration">
              <div className="ticket-hole"></div>
              <div className="ticket-hole"></div>
              <div className="ticket-hole"></div>
            </div>
            <div className="p-6">
              <div className="fancy-card-gradient absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity"></div>

              <div className="ticket-header mb-4">
                <div className="ticket-event-name">
                  <h3 className="text-2xl font-bold text-gray-800 leading-tight">{event.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge className="bg-green-500">{event.remaining} spots left</Badge>
                  </div>
                </div>
              </div>

              <p className="text-slate-600 mb-4 relative z-10">{event.description}</p>

              <div className="ticket-details-grid mb-4 relative z-10">
                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Date</span>
                    <span className="ticket-detail-value">{formatDate(event.startTime)}</span>
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <Clock className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Time</span>
                    <span className="ticket-detail-value">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <MapPin className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Location</span>
                    <span className="ticket-detail-value">{event.location}</span>
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <Users2 className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Capacity</span>
                    <span className="ticket-detail-value">{event.capacity} total / {event.remaining} left</span>
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <Info className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Tier</span>
                    <span className="ticket-detail-value">{tier}</span>
                  </div>
                </div>

                <div className="ticket-detail-item">
                  <div className="ticket-detail-icon">
                    <DollarSign className="h-4 w-4 text-indigo-500" />
                  </div>
                  <div className="ticket-detail-content">
                    <span className="ticket-detail-label">Total</span>
                    <span className="ticket-detail-value font-semibold text-green-700">${finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">Loading event info...</p>
        )}

        <div className="bg-white rounded-lg p-6 shadow mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Credit / Debit (mock only)
          </label>
          <div className="relative mb-6">
            <input
              type="text"
              className="w-full border rounded px-3 py-2 text-sm text-gray-500 bg-gray-100 pr-10"
              disabled
              placeholder="**** **** **** 4242"
            />
            <CreditCard className="absolute right-3 top-2.5 text-gray-400 w-5 h-5" />
          </div>

          <Button
            onClick={handlePurchase}
            disabled={processing || !event}
            className="w-full fancy-ticket-button"
          >
            {processing ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </div>
      </div>
    </div>
  );
}
