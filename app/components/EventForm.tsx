"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';

interface Event {
  id: string;
  name: string;
  description?: string;
  category?: string;
  location?: string;
  date?: string;
  time?: string;
  capacity?: number;
  price?: number;
  attendees?: Array<any>;
  picture?: string;
}

interface EventFormProps {
  onSubmit?: (event: Event) => void;
  onCancel?: () => void;
}

function EventForm({ onSubmit, onCancel }: EventFormProps) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Connect to backend API for event creation
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, description, capacity: parseInt(capacity) || 0 }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create event');
      }
      
      toast.success('Event created successfully!');
      
      // If an onSubmit callback was provided, call it with the new event
      if (onSubmit && data.event) {
        onSubmit(data.event);
      }
      
      // Reset form
      setName('');
      setDescription('');
      setCapacity('');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      console.error('Event creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Create Event</CardTitle>
        <CardDescription>Fill out the form below to create a new event</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Event Name</label>
            <Input
              id="name"
              type="text"
              placeholder="Enter event name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <textarea
              id="description"
              placeholder="Enter event description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="capacity" className="text-sm font-medium">Capacity</label>
            <Input
              id="capacity"
              type="number"
              placeholder="Enter maximum capacity"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="flex gap-2 mt-6">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default EventForm; 