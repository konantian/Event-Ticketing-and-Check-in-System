'use client';

import { useEffect, useState } from 'react';
import AllEvents from './components/AllEvents';
import TicketList from './components/TicketList';
import LogoutButton from './components/LogoutButton';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Menu, Ticket, CalendarDays, User, LogOut } from 'lucide-react';
import AuthForms from './components/AuthForms';

interface User {
  id: string;
  email: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/user', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }

      setIsLoading(false);
    };

    fetchUser();
  }, []);

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : 'U';
  };

  const handleLoginSuccess = (user: User) => {
    setUser(user);
  };

  const handleRegisterSuccess = (user: User) => {
    setUser(user);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-sky-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-indigo-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Toast provider */}
      <Toaster position="top-right" richColors closeButton />

      {/* Modern Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <Ticket className="h-5 w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                <span className="text-indigo-600">Event</span> Ticketing
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-6">
              <nav className="flex items-center space-x-4">
                <a href="#" className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  Events
                </a>
                {user?.role === 'Attendee' && (
                  <a href="#tickets" className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                    <Ticket className="h-4 w-4 inline mr-1" />
                    My Tickets
                  </a>
                )}
                <a href="#" className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                  About
                </a>
                <a href="#" className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                  Contact
                </a>
              </nav>

              <Separator orientation="vertical" className="h-6" />

              {/* Auth Buttons or User Menu */}
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:block">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{user.email}</span>
                      <span className="ml-1 text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <Avatar className="h-8 w-8 border-2 border-white">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`} />
                    <AvatarFallback className="bg-indigo-600 text-white">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <LogoutButton onLogout={() => setUser(null)} />
                </div>
              ) : (
                <></>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="container mx-auto px-4 py-3 space-y-1">
              <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                <CalendarDays className="h-5 w-5 mr-2" />
                Events
              </a>
              {user?.role === 'Attendee' && (
                <a href="#tickets" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                  <Ticket className="h-5 w-5 mr-2" />
                  My Tickets
                </a>
              )}
              <a href="#" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-indigo-50 hover:text-indigo-600">
                <User className="h-5 w-5 mr-2" />
                About
              </a>
              <Separator className="my-2" />
              {user ? (
                <>
                  <div className="px-2 py-2">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{user.email}</span>
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {user.role}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      localStorage.removeItem('token');
                      setUser(null);
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
                  >
                    <LogOut className="h-5 w-5 mr-2" />
                    Logout
                  </button>
                </>
              ) : (
                <></>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user ? (
          <>
            <AllEvents user={user} />

            {/* My Tickets - Attendee only */}
            {user?.role === 'Attendee' && (
              <div id="tickets" className="mt-16">
                <TicketList />
              </div>
            )}
          </>
        ) : (
          <>
            <AllEvents user={user} />
            <AuthForms onLoginSuccess={handleLoginSuccess} onRegisterSuccess={handleRegisterSuccess} />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h2 className="text-2xl font-bold text-white mb-4">Event Ticketing</h2>
              <p className="text-gray-400 mb-4">The ultimate platform for managing events and tickets with ease and security.</p>
              <p className="text-gray-400">© 2025 Event Ticketing. All rights reserved.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Contact</h3>
              <ul className="space-y-2">
                <li>info@eventticketing.com</li>
                <li>+1 (123) 456-7890</li>
                <li>123 Event Street, Toronto, ON</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
