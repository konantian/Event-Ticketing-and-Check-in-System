'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="max-w-xl mx-auto mt-10 p-4 border rounded shadow-sm bg-white">
      <h2 className="text-2xl font-bold mb-2">Complete Your Purchase</h2>

      {event ? (
        <div className="mb-6">
          <p className="text-lg font-semibold">{event.name}</p>
          <p className="text-sm text-gray-600">{new Date(event.startTime).toLocaleString()}</p>
          <p className="text-sm text-gray-600 mb-1">Location: {event.location}</p>
          <p className="text-sm">Tier: <strong>{tier}</strong></p>
          <p className="text-sm">Discount: {discountCode || 'None'}</p>
          <p className="text-lg font-bold mt-2">Total: ${finalPrice.toFixed(2)}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500 mb-4">Loading event info...</p>
      )}

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Credit / Debit (mock only)
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

      <Button onClick={handlePurchase} disabled={processing || !event} className="w-full">
        {processing ? 'Processing...' : 'Confirm Purchase'}
      </Button>
    </div>
  );
}
