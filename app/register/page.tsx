"use client";

import { Suspense } from "react";
import RegisterPageContent from "./content";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center pt-10">Loading registration...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
} 