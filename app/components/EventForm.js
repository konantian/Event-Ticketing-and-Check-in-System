"use client";
import React, { useState } from 'react';

function EventForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Connect to backend API for event creation
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, capacity }),
    });
    const data = await response.json();
    console.log(data);
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-4">Create Event</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <input
          type="number"
          placeholder="Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
          Create Event
        </button>
      </form>
    </div>
  );
}

export default EventForm; 