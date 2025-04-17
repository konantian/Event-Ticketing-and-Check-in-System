"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { CalendarDays, Clock, MapPin, Users, PenBox, ClipboardList, PlusCircle } from 'lucide-react';

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
  const labelClass = "flex items-center gap-2 text-sm font-medium text-gray-800";
  const inputClass = "w-full p-3 border-indigo-100 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all";

  return (
    <div className="flex justify-center items-center w-full px-4">
      <div className="w-full sm:w-4/5 md:w-3/4 lg:w-2/3">
        <Card className="w-full shadow-lg my-8 fancy-card overflow-hidden relative">
          <div className="fancy-card-gradient absolute inset-0 opacity-5"></div>
          <CardContent className="pt-6 px-4 sm:px-6 relative z-10">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Event</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className={labelClass}>
                  <PenBox className="h-4 w-4 text-indigo-500" />
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
                  className={inputClass}
                />
              </div>
              
              <div>
                <label htmlFor="description" className={labelClass}>
                  <ClipboardList className="h-4 w-4 text-indigo-500" />
                  Description
                </label>
                <textarea
                  id="description"
                  placeholder="Enter event description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`${inputClass} min-h-[100px] rounded-md border border-input bg-background`}
                  disabled={isLoading}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="capacity" className={labelClass}>
                    <Users className="h-4 w-4 text-indigo-500" />
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
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="location" className={labelClass}>
                    <MapPin className="h-4 w-4 text-indigo-500" />
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
                    className={inputClass}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className={labelClass}>
                    <CalendarDays className="h-4 w-4 text-indigo-500" />
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
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className={labelClass}>
                    <Clock className="h-4 w-4 text-indigo-500" />
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    placeholder="Enter end time"
                    value={endTime}
                    onChange={handleEndTimeChange}
                    min={startTime || minDateTime}
                    className={`${inputClass} ${endTimeError ? "border-red-500" : ""}`}
                    required
                    disabled={isLoading}
                  />
                  {endTimeError && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <span className="text-red-500 text-xs">●</span> {endTimeError}
                    </p>
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
                    className="flex-1 fancy-button-secondary group relative overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Cancel
                    </span>
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="flex-1 fancy-button group relative overflow-hidden" 
                  disabled={isLoading || !!endTimeError}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isLoading ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Create Event</span>
                      </>
                    )}
                  </span>
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