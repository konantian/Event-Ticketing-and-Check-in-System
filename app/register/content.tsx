"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Register from "../components/Register";

export default function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirect, setRedirect] = useState("/homepage");

  useEffect(() => {
    const param = searchParams.get("redirect");
    if (param) setRedirect(param);
  }, [searchParams]);

  const handleRegisterSuccess = (user: any) => {
    
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
        <h1 className="text-2xl font-bold text-center mb-4">Register</h1>
        <Register onRegisterSuccess={handleRegisterSuccess} />
      </div>
    </div>
  );
} 