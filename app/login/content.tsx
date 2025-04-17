"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Login from "../components/Login";
import { toast } from "sonner";

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
    
    // Force reload when redirecting to properly refresh the user state
    if (redirect.startsWith('/homepage')) {
      window.location.href = redirect;
    } else {
      router.push(redirect);
    }
  };

  return (
    <div className="py-10 px-4">
      <div className="w-full max-w-md mx-auto bg-white shadow-xl rounded-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    </div>
  );
}
