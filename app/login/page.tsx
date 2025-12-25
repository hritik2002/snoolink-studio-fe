"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Play } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden">
      {/* Grid Pattern - Top Left */}
      <div 
        className="absolute top-0 left-0 w-80 h-80 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* Grid Pattern - Bottom Right */}
      <div 
        className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
            <Play className="w-9 h-9 text-white ml-1" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Snoolink AI</h1>
        </div>

        {/* Purple Gradient Line */}
        <div className="w-full max-w-sm h-1 rounded-full bg-gradient-to-r from-transparent via-purple-500 to-transparent mb-10" />

        {/* Login Card */}
        <div className="w-full bg-white p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Studio</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              The semantic video search platform.
              <br />
              Sign in to continue to your workspace.
            </p>
          </div>

          <LoginForm />

        </div>
      </div>

      {/* Copyright */}
      <div className="absolute bottom-6 text-center">
        <p className="text-sm text-gray-400">© 2024 Snoolink AI</p>
      </div>
    </div>
  );
}
