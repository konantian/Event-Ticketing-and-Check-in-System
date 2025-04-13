"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Login from "../components/Login";
import { toast } from "sonner";
import Link from "next/link";

export default function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirect, setRedirect] = useState("/homepage");

  useEffect(() => {
    const param = searchParams.get("redirect");
    if (param) setRedirect(param);
  }, [searchParams]);

  const handleLoginSuccess = (user: any) => {
    toast.success("Login successful!");
    router.push(redirect);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
        <Login onLoginSuccess={handleLoginSuccess} />

        {/* Return to Home Page Button */}
        <div className="mt-6 text-center">
          <Link href="/">
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline">
              ← Return to Home Page
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
