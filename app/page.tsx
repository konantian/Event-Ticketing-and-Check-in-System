import React from 'react';
import Login from './components/Login';
import EventForm from './components/EventForm';
import TicketList from './components/TicketList';
import { AuthProvider } from './components/AuthContext';

export default function HomePage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-100">
        <h1 className="text-3xl font-bold text-center py-6">Welcome to Event Ticketing System</h1>
        <Login />
        <EventForm />
        <TicketList />
      </div>
    </AuthProvider>
  );
}