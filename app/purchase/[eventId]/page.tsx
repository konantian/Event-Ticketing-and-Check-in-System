'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function PurchasePage() {
  const { eventId } = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<any>(null);
  const [tier, setTier] = useState('General');
  const [discountCode, setDiscountCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}`);
        const data = await res.json();
        if (res.ok) {
          setEvent(data.event);
        } else {
          setMessage(data.message || 'Failed to load event');
        }
      } catch (err) {
        setMessage('Error fetching event');
      }
    };

    fetchEvent();
  }, [eventId]);

  const handlePurchase = async () => {
    setLoading(true);
    setMessage('');

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
        setMessage('🎉 Ticket purchased successfully!');

        // Fetch updated event data to reflect remaining tickets
        const updatedRes = await fetch(`/api/events/${eventId}`);
        const updatedData = await updatedRes.json();
        if (updatedRes.ok) {
          setEvent(updatedData.event);
        }

        // Delay for 2 seconds before redirecting to My Tickets page
        setTimeout(() => {
          router.push('/my-tickets');
        }, 2000);
      } else {
        setMessage(data.message || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Error processing purchase');
    } finally {
      setLoading(false);
    }
  };

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading event...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-800 text-white py-12 px-6">
      <div className="max-w-2xl mx-auto bg-white text-gray-800 shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-indigo-700">
          🎟 Complete Your Ticket Purchase
        </h1>

        <div className="space-y-3 mb-6 text-sm">
          <p><strong>Event:</strong> {event.name}</p>
          <p><strong>Description:</strong> {event.description}</p>
          <p><strong>Location:</strong> {event.location}</p>
          <p><strong>Date:</strong> {new Date(event.startTime).toLocaleString()}</p>
          <p><strong>Remaining Tickets:</strong> {event.remaining}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Ticket Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              <option value="General">General - $50</option>
              <option value="VIP">VIP - $100</option>
            </select>
          </div>

          <div>
            <label className="block font-medium mb-1">Discount Code (optional)</label>
            <input
              type="text"
              placeholder="Enter a code"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Payment Info (mock)</label>
            <input
              type="text"
              placeholder="Card number (mock)"
              className="w-full border rounded px-3 py-2 text-gray-500 bg-gray-100"
              disabled
            />
          </div>

          {message && (
            <div
              className={`px-4 py-2 rounded mt-2 text-sm ${
                message.includes('success')
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}
            >
              {message}
            </div>
          )}

          <button
            disabled={loading}
            onClick={handlePurchase}
            className="bg-indigo-600 hover:bg-indigo-700 text-white w-full mt-4 py-3 rounded font-semibold disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Purchase Ticket'}
          </button>
        </div>
      </div>
    </div>
  );
}