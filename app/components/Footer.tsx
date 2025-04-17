import React from 'react';

export default function Footer() {
  return (
    <>
      {/* Divider */}
      <div className="w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 my-8 shadow-md"></div>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
            <p>Designed with 💜 by Event Ticketing Team</p>
          </div>
        </div>
      </footer>
    </>
  );
} 