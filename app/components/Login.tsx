"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { LogIn, Mail, Lock } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
}

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      toast.success('Login successful!');
      setTimeout(() => {
        onLoginSuccess(data.user);
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Something went wrong');
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto fancy-card overflow-hidden relative">
      <div className="fancy-card-gradient absolute inset-0 opacity-5"></div>
      <CardHeader className="space-y-4 mb-6 relative z-10 pt-8">
        <CardTitle className="text-3xl font-bold text-center">Welcome Back</CardTitle>
        <CardDescription className="text-center text-gray-500 text-lg">Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 pb-8 px-8">
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-5 w-5 text-indigo-500" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="border-indigo-100 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all p-6 text-lg"
            />
          </div>
          <div className="space-y-4">
            <label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-5 w-5 text-indigo-500" />
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder=""
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="border-indigo-100 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-all p-6 text-lg"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full fancy-ticket-button group relative overflow-hidden mt-8 py-6 text-lg" 
            disabled={isLoading}
          >
            <span className="relative z-10 flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5 transition-transform group-hover:rotate-12" />
                  <span>Login</span>
                </>
              )}
            </span>
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default Login;
