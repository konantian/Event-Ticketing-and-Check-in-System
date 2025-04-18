"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';

// Component that uses useSearchParams, wrapped separately
function CheckInContent() {
  const searchParams = useSearchParams();
  const qrCode = searchParams.get('qr');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Handle automatic check-in on page load
  useEffect(() => {
    if (qrCode) {
      handleCheckIn();
    } else {
      setError('No QR code provided');
    }
  }, [qrCode]);

  const handleCheckIn = async () => {
    if (!qrCode) {
      setError('No QR code provided');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Check-in with token validation
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in as an event organizer to check in attendees');
        toast.error('Authentication required');
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/checkin/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ qrCodeData: qrCode })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Check-in successful!');
        
        // Add a 1-second delay to ensure users can see the toast message
        setTimeout(() => {
          setSuccess(true);
        }, 1000);
      } else {
        setError(data.message || 'Check-in failed');
        toast.error(data.message || 'Check-in failed');
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      setError('Something went wrong during check-in');
      toast.error('Something went wrong during check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      {loading ? (
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="text-indigo-600 font-medium text-lg">Processing check-in...</p>
        </div>
      ) : success ? (
        <div className="flex flex-col items-center space-y-3">
          <div className="rounded-full bg-green-100 p-3">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-green-600">Check-in Successful!</h3>
          <p className="text-gray-600 text-center">
            The attendee has been successfully checked in.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3">
          {error ? (
            <>
              <div className="rounded-full bg-red-100 p-3">
                {error.includes('organizer') ? (
                  <ShieldAlert className="h-12 w-12 text-red-600" />
                ) : (
                  <XCircle className="h-12 w-12 text-red-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-red-600">Check-in Failed</h3>
              {(
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 max-w-md">
                  <p className="text-amber-800 text-sm">
                    <strong>Note:</strong> Only event organizers can check in attendees. 
                    If you are the organizer, please log in with your organizer account.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-gray-600 text-center">
                Processing QR code...
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Loading fallback for suspense
function CheckInLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-6 space-y-6">
      <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
      <p className="text-indigo-600 font-medium text-lg">Loading check-in...</p>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CheckInPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Ticket Check-In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<CheckInLoading />}>
              <CheckInContent />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 