'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Menu, Ticket, CalendarDays, User, ArrowLeft, Home } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHomepage = pathname === '/' || pathname === '/homepage';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <Image src="/favicon.ico" alt="Logo" width={56} height={56} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              <span className="text-indigo-600">Event</span> Ticketing
            </h1>
          </div>

          {/* Back to Homepage Button (only shown on non-homepage routes) */}
          {!isHomepage && (
            <div className="flex items-center">
              <Link href="/homepage">
                <Button variant="outline" className="fancy-button-secondary group relative overflow-hidden flex items-center gap-2 bg-white border-indigo-200 hover:border-indigo-300 px-4">
                  <Home className="h-4 w-4 text-indigo-600" />
                  <span className="font-medium text-indigo-700">Back to Homepage</span>
                </Button>
              </Link>
            </div>
          )}
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
            <Link href="/login" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
              <User className="h-5 w-5 mr-2" />
              Login
            </Link>
            <Link href="/register" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
              <User className="h-5 w-5 mr-2" />
              Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
} 