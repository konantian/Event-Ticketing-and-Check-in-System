'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PurchasePage() {
  const { eventId } = useParams();
  const router = useRouter();

  const [event, setEvent] = useState(null);
  const [tier, setTier] = useState<'General' | 'VIP'>('General');
  const [discountCode, setDiscountCode] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || 'Failed to fetch event');

        setEvent(data);
      } catch (err: any) {
        setMessage(`❌ ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          eventId,
          tier,
          discountCode: discountCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Ticket purchase failed');
      }

      setMessage('✅ Ticket purchased successfully!');
      setTimeout(() => router.push('/'), 2000); // redirect to home
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-10 bg-white rounded-lg shadow mt-8">
      <h1 className="text-2xl font-bold text-indigo-700 mb-4">🎟 Complete Your Ticket Purchase</h1>

      {isLoading && <p>Loading event details...</p>}

      {event && (
        <>
          <div className="mb-6 space-y-2">
            <p><strong>Event:</strong> {event.name}</p>
            <p><strong>Description:</strong> {event.description}</p>
            <p><strong>Location:</strong> {event.location}</p>
            <p><strong>Date:</strong> {new Date(event.startTime).toLocaleString()}</p>
            <p><strong>Remaining Tickets:</strong> {event.remaining}</p>
          </div>

          <form onSubmit={handlePurchase} className="space-y-5">
            <div>
              <label className="block font-medium mb-1 text-gray-700">Ticket Tier</label>
              <select
                value={tier}
                onChange={(e) => setTier(e.target.value as 'General' | 'VIP')}
                className="w-full p-3 border border-gray-300 rounded focus:ring-indigo-500"
              >
                <option value="General">General - $50</option>
                <option value="VIP">VIP - $100</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">Discount Code (optional)</label>
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="Enter a code"
                className="w-full p-3 border border-gray-300 rounded focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-medium mb-1 text-gray-700">Payment Info</label>
              <input
                type="text"
                placeholder="Card number (mock)"
                disabled
                className="w-full p-3 border border-gray-200 bg-gray-100 rounded"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 text-white p-3 rounded hover:bg-emerald-700 transition"
            >
              {isSubmitting ? 'Processing...' : 'Purchase Ticket'}
            </button>
          </form>
        </>
      )}

      {message && (
        <div
          className={`mt-6 p-4 rounded font-medium text-sm ${
            message.startsWith('✅')
              ? 'bg-green-100 text-green-800 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
