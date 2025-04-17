"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';

interface Event {
  id: string;
  name: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  capacity?: number;
  remaining?: number;
}

interface EventFormProps {
  onSubmit?: (event: Event) => void;
  onCancel?: () => void;
}

function EventForm({ onSubmit, onCancel }: EventFormProps) {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [endTimeError, setEndTimeError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [minDateTime, setMinDateTime] = useState<string>('');

  // Set minimum date-time to current time on component mount
  useEffect(() => {
    updateMinDateTime();
  }, []);

  // Update min date-time value
  const updateMinDateTime = () => {
    const now = new Date();
    // Format to YYYY-MM-DDThh:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setMinDateTime(formattedDateTime);
  };

  // Validate times whenever start or end time changes
  useEffect(() => {
    validateTimes();
  }, [startTime, endTime]);

  const validateTimes = () => {
    let isValid = true;
    
    // Clear previous errors
    setEndTimeError('');
    
    // Validate end time is after start time
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (end <= start) {
        setEndTimeError('End time must be after start time');
        isValid = false;
      }
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate times before submission
    if (!validateTimes()) {
      toast.error(endTimeError);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Connect to backend API for event creation
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          description, 
          capacity: parseInt(capacity) || 0, 
          location, 
          startTime,
          endTime 
        }),
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
      setLocation('');
      setStartTime('');
      setEndTime('');
      setEndTimeError('');
    } catch (error: any) {
      toast.error(error.message || 'Something went wrong');
      console.error('Event creation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEndTime(e.target.value);
  };

  // Label styling class
  const labelClass = "block text-md font-semibold mb-2 text-gray-800";

  return (
    <div className="flex justify-center items-center w-full px-4">
      <div className="w-full sm:w-4/5 md:w-3/4 lg:w-1/2">
        <Card className="w-full shadow-lg my-8">
          <CardContent className="pt-6 px-4 sm:px-6">
            <h2 className="text-2xl font-bold mb-6 text-center">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Event Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter event name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full p-3"
                />
              </div>
              
              <div>
                <label htmlFor="description" className={labelClass}>
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter event description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="capacity" className={labelClass}>
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="Enter maximum capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full p-3"
                  />
                </div>
                <div>
                  <label htmlFor="location" className={labelClass}>
                    Location <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full p-3"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className={labelClass}>
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    placeholder="Enter start time"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    min={minDateTime}
                    required
                    disabled={isLoading}
                    className="w-full p-3"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className={labelClass}>
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    placeholder="Enter end time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    min={startTime || minDateTime}
                    className={`w-full p-3 ${endTimeError ? "border-red-500" : ""}`}
                    required
                    disabled={isLoading}
                  />
                  {endTimeError && (
                    <p className="text-red-500 text-sm mt-1">{endTimeError}</p>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 mt-12">
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="flex-1 h-12 sm:h-16 text-lg sm:text-xl font-semibold"
                    size="lg"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1 h-12 sm:h-16 text-lg sm:text-xl font-semibold" 
                  disabled={isLoading || !!endTimeError}
                  size="lg"
                >
                  {isLoading ? 'Creating...' : 'Create Event'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventForm; 