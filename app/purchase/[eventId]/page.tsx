'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export default function PurchaseEntryPage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [tier, setTier] = useState('General');
  const [discountCode, setDiscountCode] = useState('');
  const [event, setEvent] = useState<any>(null);
  const [pricePreview, setPricePreview] = useState<number>(0);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load event");
        setEvent(data.event);
        setPricePreview(data.event.price);
      } catch {
        toast.error("Error loading event");
      }
    };

    if (eventId) fetchEvent();
  }, [eventId]);

  useEffect(() => {
    if (event) {
      const base = event.price;
      setPricePreview(tier === 'VIP' ? base * 1.5 : base);
    }
  }, [tier, event]);

  const handleContinue = () => {
    router.push(
      `/purchase/${eventId}/pay?eventId=${eventId}&tier=${tier}&discountCode=${discountCode}`
    );
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 min-h-screen">
      <div className="container max-w-xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-4">Select Ticket Options</h2>

        <label className="block mb-2 text-sm">Select Tier</label>
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value)}
          className="border w-full p-2 mb-4 rounded"
        >
          <option value="General">
            General - ${event?.price?.toFixed(2) ?? '--'}
          </option>
          <option value="VIP">
            VIP - ${event ? (event.price * 1.5).toFixed(2) : '--'}
          </option>
        </select>

        <label className="block mb-2 text-sm">Discount Code (optional)</label>
        <input
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder="SPRING25"
          className="border w-full p-2 mb-6 rounded"
        />

        <p className="text-md font-medium mb-4 text-right">
          Estimated Price: <span className="text-indigo-600 font-semibold">
            {typeof pricePreview === 'number' ? `$${pricePreview.toFixed(2)}` : '--'}
          </span>
        </p>

        <Button className="w-full fancy-ticket-button" onClick={handleContinue}>
          Continue to Payment
        </Button>
      </div>
    </div>
  );
}
