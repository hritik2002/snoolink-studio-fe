"use client";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Snoolink Studio</h1>
          <p className="text-white/60">Sign in with your Google account to get started</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}

