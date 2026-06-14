"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginSkeleton } from "@/components/skeletons";
import Image from "next/image";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <div className="min-h-screen flex flex-col bg-[#010010] dot-grid relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-md mx-auto">
          {/* Wordmark */}
          <div className="flex items-center gap-2 mb-12">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              priority
            />
            <span className="text-[1.25rem] font-semibold text-white tracking-tight">
              Snoolink
            </span>
          </div>

          {/* Hero — word stack */}
          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-display)] font-medium leading-[1.1] tracking-[-0.02em]">
              {["FIND", "ANY", "MOMENT"].map((word) => (
                <span
                  key={word}
                  className="block text-[clamp(2.5rem,8vw,4.5rem)] text-white uppercase"
                >
                  {word}
                </span>
              ))}
              <span className="block text-[clamp(2.5rem,8vw,4.5rem)] text-primary uppercase">
                INSTANTLY
              </span>
            </h1>
            <p className="mt-6 text-base text-white/80 max-w-sm leading-relaxed font-[family-name:var(--font-body)]">
              Semantic search for your media library. Describe what you need — no keywords required.
            </p>
          </div>

          {/* Sign-in card */}
          <div className="beetle-card backdrop-blur-3xl p-6 relative">
            <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
            <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
            <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
            <span className="beetle-bracket beetle-bracket-br" aria-hidden />

            {reason === "expired" && (
              <div className="mb-4 px-3 py-2 border border-[#333333] bg-[#050505] text-white/80 text-sm">
                Session expired. Sign in again.
              </div>
            )}

            <LoginForm />

            <p className="mt-4 text-[13px] text-[#71717a] text-center font-[family-name:var(--font-body)]">
              Google sign-in only. We never access your Google data.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center">
        <p className="text-[13px] text-[#71717a]">© 2026 Snoolink</p>
      </footer>
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
