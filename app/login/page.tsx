"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Play, CloudUpload, Search, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginSkeleton } from "@/components/skeletons";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
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
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-80 h-80 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-6">
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 mb-4">
            <Play className="w-9 h-9 text-white ml-1" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Snoolink Studio</h1>
        </div>

        {/* One-line promise above the fold */}
        <p className="text-center text-gray-700 text-base font-medium mb-2 max-w-md">
          Upload your media → we index it → search by meaning.
        </p>

        {/* 3-step visual */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mb-8">
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <CloudUpload className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Upload</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">We index</span>
          </div>
          <span className="text-gray-300">→</span>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Search className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Search</span>
          </div>
        </div>

        <div className="w-full max-w-sm h-px bg-gray-200 mb-8" />

        {/* Login Card */}
        <div className="w-full bg-white p-8">
          {reason === "expired" && (
            <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
              Session expired. Sign in again.
            </div>
          )}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome</h2>
            <p className="text-gray-500 text-sm">Sign in with Google to continue.</p>
          </div>

          <LoginForm />

          <p className="mt-4 text-center text-xs text-gray-400">
            We use Google only for sign-in. We don’t post or access your Google data.
          </p>
        </div>
      </div>

      <div className="absolute bottom-6 text-center">
        <p className="text-sm text-gray-400">© 2024 Snoolink Studio</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
