"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { Play, CloudUpload, Search, Sparkles, Check, Users, Shield, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginSkeleton } from "@/components/skeletons";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white relative overflow-hidden py-8 sm:py-12">
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

      <div className="relative z-10 flex flex-col items-center w-full max-w-2xl px-4 sm:px-6">
        {/* Logo and Brand Name - Smaller, Secondary */}
        <div className="flex flex-col items-center mb-3 sm:mb-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 mb-2 sm:mb-3">
            <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white ml-1" fill="white" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium">Snoolink Studio</p>
        </div>

        {/* Primary Value Proposition - H1, Benefit-Focused */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 tracking-tight text-center mb-3 sm:mb-4 max-w-2xl px-2">
          Find any moment in your videos instantly
        </h1>

        {/* Enhanced Subheadline - Benefit Explanation */}
        <p className="text-base sm:text-lg text-gray-700 text-center mb-2 sm:mb-3 max-w-xl px-2 font-medium">
          AI-powered semantic search that understands what you're looking for—no keywords needed
        </p>

        {/* Social Proof - User Count */}
        <div className="flex items-center gap-2 mb-4 sm:mb-5">
          <Users className="w-4 h-4 text-purple-600" />
          <p className="text-sm text-gray-600">
            Join <span className="font-semibold text-gray-900">1,000+</span> creators and media teams
          </p>
        </div>

        {/* Use Case Examples */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-8 text-xs sm:text-sm">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Check className="w-4 h-4 text-purple-600" />
            <span>Find specific moments</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Check className="w-4 h-4 text-purple-600" />
            <span>Organize video libraries</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-600">
            <Check className="w-4 h-4 text-purple-600" />
            <span>Search by description</span>
          </div>
        </div>

        {/* 3-step visual - Enhanced */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 w-full max-w-md">
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
              <CloudUpload className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">Upload</span>
          </div>
          <span className="text-gray-300 text-xl sm:text-2xl">→</span>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">We index</span>
          </div>
          <span className="text-gray-300 text-xl sm:text-2xl">→</span>
          <div className="flex flex-col items-center gap-2 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-purple-100 flex items-center justify-center shadow-sm">
              <Search className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
            </div>
            <span className="text-xs sm:text-sm text-gray-600 font-medium text-center">Search</span>
          </div>
        </div>

        {/* Login Card - Above the fold on mobile */}
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-6 sm:p-8 mb-4">
          {reason === "expired" && (
            <div className="mb-4 p-2.5 sm:p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm text-center">
              Session expired. Sign in again.
            </div>
          )}
          
          {/* Trust Signals */}
          <div className="flex items-center justify-center gap-4 mb-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure sign-in</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>Free to start</span>
            </div>
            <span>•</span>
            <span>No credit card</span>
          </div>

          <LoginForm />

          <p className="mt-4 text-center text-xs text-gray-500">
            We use Google only for sign-in. We don't post or access your Google data.
          </p>
        </div>

        {/* Objection Handling - FAQ Preview */}
        <div className="w-full max-w-md mt-4 sm:mt-6">
          <details className="group">
            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 transition-colors text-center list-none">
              <span className="underline">Common questions</span>
            </summary>
            <div className="mt-4 space-y-3 text-left bg-gray-50 rounded-lg p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">Is it free?</p>
                <p className="text-xs text-gray-600">Yes, you can start for free. No credit card required.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">How does it work?</p>
                <p className="text-xs text-gray-600">Upload your videos and images. Our AI indexes everything automatically. Then search using natural language—no keywords needed.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">What happens after I sign up?</p>
                <p className="text-xs text-gray-600">You'll be taken to your dashboard where you can start uploading media. Your first uploads will be indexed automatically.</p>
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="absolute bottom-4 sm:bottom-6 text-center w-full">
        <p className="text-xs sm:text-sm text-gray-400">© 2024 Snoolink Studio</p>
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
