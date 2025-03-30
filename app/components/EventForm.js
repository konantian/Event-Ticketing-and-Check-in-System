"use client";
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

const EventForm = () => {
  const { token } = useAuth();
  const [form, setForm] = useState({ name: '', description: '', capacity: '', location: '', startTime: '', endTime: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...form, capacity: Number(form.capacity) }),
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">Create Event</h2>
      <form onSubmit={handleSubmit}>
        {['name', 'description', 'location', 'startTime', 'endTime', 'capacity'].map((field) => (
          <input
            key={field}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={handleChange}
            className="w-full p-2 border mb-2"
            type={field === 'capacity' ? 'number' : field.includes('Time') ? 'datetime-local' : 'text'}
          />
        ))}
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">Create Event</button>
      </form>
    </div>
  );
};

export default EventForm;