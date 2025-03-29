import React from 'react';
import Login from './components/Login';
import EventForm from './components/EventForm';
import TicketList from './components/TicketList';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Event Ticketing System</h1>
      <Login />
      <EventForm />
      <TicketList />
    </div>
  );
};

export default HomePage;