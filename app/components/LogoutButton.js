"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';

function LogoutButton({ onLogout }) {
  const handleLogout = () => {
    try {
      // Remove token from localStorage
      localStorage.removeItem('token');
      
      // Call the onLogout callback if provided
      if (onLogout) {
        onLogout();
      }
      
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
    >
      Logout
    </Button>
  );
}

export default LogoutButton; 