// app/components/AuthForms.tsx
"use client";

import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthFormsProps {
  onLoginSuccess: (user: User) => void;
  onRegisterSuccess: (user: User) => void;
}

function AuthForms({ onLoginSuccess, onRegisterSuccess }: AuthFormsProps) {
  const [showLogin, setShowLogin] = useState(true);

  const toggleForm = () => {
    setShowLogin(!showLogin);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full">
      <div className="w-full md:w-1/2 p-8">
        {showLogin ? (
          <Login onLoginSuccess={onLoginSuccess} />
        ) : (
          <Register onRegisterSuccess={onRegisterSuccess} />
        )}
      </div>
      <div className="w-full md:w-1/2 p-8">
        <div className="text-center">
          {showLogin ? (
            <p>
              Don't have an account?{' '}
              <button onClick={toggleForm} className="underline text-primary">
                Register
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button onClick={toggleForm} className="underline text-primary">
                Login
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthForms;