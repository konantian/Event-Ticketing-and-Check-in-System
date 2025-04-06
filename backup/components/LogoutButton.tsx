'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LogoutButton({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);

    // Optional: call backend (can be expanded later for server-side session clearing)
    await fetch('/api/logout', { method: 'POST' });

    // Clear token
    localStorage.removeItem('token');

    // Trigger any logout handler (like clearing user state)
    if (onLogout) onLogout();

    // Optionally reload or redirect to home
    router.refresh(); // or router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
      disabled={loading}
    >
      {loading ? 'Logging out...' : 'Logout'}
    </button>
  );
}
