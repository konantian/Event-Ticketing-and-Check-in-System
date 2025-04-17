"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Register from "../components/Register";
import { toast } from "sonner";
import Link from "next/link";

export default function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirect, setRedirect] = useState("/homepage");

  useEffect(() => {
    const param = searchParams.get("redirect");
    if (param) setRedirect(param);
  }, [searchParams]);

  const handleRegisterSuccess = (user: any) => {
    toast.success("Registration successful!");
    
    // Force reload when redirecting to properly refresh the user state
    if (redirect.startsWith('/homepage')) {
      window.location.href = redirect;
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Register</h1>
        <Register onRegisterSuccess={handleRegisterSuccess} />

        {/* Return to Home Page Button */}
        <div className="mt-6 text-center">
          <Link href="/homepage">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline">
              ← Back to Homepage
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 