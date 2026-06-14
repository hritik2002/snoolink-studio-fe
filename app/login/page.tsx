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
    <div className="min-h-screen flex flex-col bg-background hero-blob relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-12">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              priority
            />
            <span className="text-[20px] font-medium text-foreground tracking-tight">
              Snoolink
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-[family-name:var(--font-display)] font-semibold leading-[1.15] tracking-[-0.02em]">
              <span className="block text-[clamp(2rem,8vw,3.5rem)] text-foreground">
                Find any moment
              </span>
              <span className="block text-[clamp(2rem,8vw,3.5rem)] text-[var(--color-accent-orange)]">
                instantly
              </span>
            </h1>
            <p className="mt-6 text-lg text-[var(--color-text-body)] max-w-sm leading-relaxed">
              Semantic search for your media library. Describe what you need — no keywords required.
            </p>
          </div>

          <div className="glue-card p-6 relative">
            {reason === "expired" && (
              <div className="mb-4 px-3 py-2 border border-border bg-secondary text-foreground text-sm rounded-[13px]">
                Session expired. Sign in again.
              </div>
            )}

            <LoginForm />

            <p className="mt-4 text-[15px] text-muted-foreground text-center">
              Google sign-in only. We never access your Google data.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 text-center">
        <p className="text-[15px] text-muted-foreground">© 2026 Snoolink</p>
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
