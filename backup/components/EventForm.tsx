// app/components/EventForm.tsx
'use client';

import { useState, FormEvent } from 'react';

export default function EventForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError(false);

    const token = localStorage.getItem('token');
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        description,
        capacity: parseInt(capacity),
        location: 'TBD',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(true);
      setMessage(data.message || 'Failed to create event');
    } else {
      setMessage('Event created successfully!');
      setName('');
      setDescription('');
      setCapacity('');
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-md mx-auto mb-10">
      <h2 className="text-2xl font-bold mb-4 text-center">Create Event</h2>

      {message && (
        <div className={`mb-4 p-3 rounded ${error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border p-3 rounded"
        />
        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full border p-3 rounded"
        />
        <button type="submit" className="w-full bg-green-500 text-white p-3 rounded hover:bg-green-600">
          Create Event
        </button>
      </form>
    </div>
  );
}
