"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast, Toaster } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
}

interface RegisterProps {
  onRegisterSuccess: (user: User) => void;
}

function Register({ onRegisterSuccess }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [role, setRole] = useState('Attendee');
  const [isLoading, setIsLoading] = useState(false);

  // Validate passwords match when confirmPassword changes
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(true);
    } else {
      setPasswordError(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Connect to backend API for registration
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Check for specific error codes or messages
        if (response.status === 409 || 
            data.code === 'user_exists' || 
            data.message?.toLowerCase().includes('already exists') ||
            data.message?.toLowerCase().includes('email already registered')) {
          toast.error('User with this email already exists');
        } else {
          toast.error(data.message || 'Registration failed');
        }
        setIsLoading(false);
        return;
      }
      
      // Store token in localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      // Show success toast
      toast.success('Registration successful!');
      
      // Add a 1-second delay to ensure users can see the toast message
      setTimeout(() => {
        // Call the onRegisterSuccess callback if provided
        if (onRegisterSuccess && data.user) {
          onRegisterSuccess(data.user);
        }
      }, 1000);
    } catch (error: any) {
      // Display a generic error message in case of network errors or other exceptions
      console.error('Registration error:', error);
      toast.error('Something went wrong. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateConfirmPassword = () => {
    if (confirmPassword && password !== confirmPassword) {
      toast.error('Passwords do not match');
      setPasswordError(true);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <Toaster position="top-right" richColors closeButton />
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
        <CardDescription className="text-center">Enter your details to sign up</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password</label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder=""
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={validateConfirmPassword}
              className={passwordError ? "border-red-500" : ""}
              required
              disabled={isLoading}
            />
            {passwordError && (
              <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input"
              required
            >
              <option value="">Select a role</option>
              <option value="Organizer">Organizer</option>
              <option value="Attendee">Attendee</option>
            </select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || passwordError}
          >
            {isLoading ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default Register; 