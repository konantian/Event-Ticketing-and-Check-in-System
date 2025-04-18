'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Ticket, CalendarDays, User, Home, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();
  const isHomepage = pathname === '/' || pathname === '/homepage';

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/user', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          }
        } catch (err) {
          console.error('Auth check failed:', err);
        }
      }
    };

    checkAuth();
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    toast.success("Logged out successfully.");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap sm:flex-nowrap h-auto sm:h-16 items-center justify-between py-3 sm:py-0">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-start mb-3 sm:mb-0">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Image src="/favicon.ico" alt="Logo" width={56} height={56} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              <span className="text-indigo-600">Event</span> Ticketing
            </h1>
          </div>

          {/* Navigation Actions */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            {/* Back to Homepage Button (only shown on non-homepage routes) */}
            {!isHomepage && (
              <Link href="/homepage" className="w-full sm:w-auto">
                <Button variant="outline" className="fancy-button-secondary group relative overflow-hidden flex items-center gap-2 bg-white border-indigo-200 hover:border-indigo-300 px-4 h-10 w-full sm:w-auto">
                  <Home className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-indigo-700">Back to Homepage</span>
                </Button>
              </Link>
            )}
            
            {/* Logout Button (only shown when logged in) */}
            {user && (
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="fancy-button-danger group relative overflow-hidden flex items-center gap-2 h-10 w-full sm:w-auto"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                <span>Logout</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="container mx-auto px-4 py-3 space-y-1">
            <Link href="/" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
              <CalendarDays className="h-5 w-5 mr-2" />
              Events
            </Link>
            <Link href="/my-tickets" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
              <Ticket className="h-5 w-5 mr-2" />
              My Tickets
            </Link>
            <Link href="/about" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
              <User className="h-5 w-5 mr-2" />
              About
            </Link>
            <Separator className="my-2" />
            {user ? (
              <button 
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                  <User className="h-5 w-5 mr-2" />
                  Login
                </Link>
                <Link href="/register" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                  <User className="h-5 w-5 mr-2" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 