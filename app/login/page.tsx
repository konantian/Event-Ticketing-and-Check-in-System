"use client";

import { Suspense } from "react";
import LoginPageContent from "./content";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center pt-10">Loading login...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
