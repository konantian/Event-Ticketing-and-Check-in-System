import React from 'react';

export default function Footer() {
  return (
    <>
      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 my-8 shadow-md"></div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-row justify-between items-start">
            <div className="w-1/3 pr-4">
              <h2 className="text-2xl font-bold text-white mb-4">Event Ticketing</h2>
              <p className="text-gray-400 mb-4">The ultimate platform for managing events and tickets with ease and security.</p>
              <p className="text-gray-400">© 2025 Event Ticketing. All rights reserved.</p>
            </div>
            <div className="w-1/4">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
} 