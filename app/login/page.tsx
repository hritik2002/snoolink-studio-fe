"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LoginSkeleton } from "@/components/skeletons";
import Image from "next/image";
import { PageShell, Section, Container } from "@/components/layout/page-shell-layout";
import { cardFeature, cardSurface, bodyLg, headingHero } from "@/lib/cg-classes";
import { cn } from "@/lib/utils";

function LoginContent() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");

  return (
    <PageShell className="hero-blob relative overflow-hidden flex flex-col">
      <Section className="flex-1 justify-center py-16">
        <Container className="max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <Image
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="object-contain"
              priority
            />
            <span className="font-ui text-body font-medium text-cg-ink tracking-tight">
              Snoolink
            </span>
          </div>

          <div className="mb-8 text-left">
            <h1 className={cn(headingHero, "text-left text-[clamp(2rem,8vw,3.5rem)] md:text-h2")}>
              Find any moment{" "}
              <span className="text-cg-orange">instantly</span>
            </h1>
            <p className={cn(bodyLg, "mt-6 max-w-sm")}>
              Semantic search for your media library. Describe what you need — no keywords required.
            </p>
          </div>

          <div className={cn(cardFeature, "p-1")}>
            <div className={cn(cardSurface, "border-0 shadow-none")}>
              {reason === "expired" && (
                <div className="mb-4 px-3 py-2 border border-cg-line bg-cg-bg-alt text-cg-ink text-sm rounded-badge">
                  Session expired. Sign in again.
                </div>
              )}

              <LoginForm />

              <p className="mt-4 font-body text-sm text-cg-ink-4 text-center">
                Google sign-in only. We never access your Google data.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <footer className="py-6 text-center">
        <p className="font-body text-sm text-cg-ink-4">© 2026 Snoolink</p>
      </footer>
    </PageShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginSkeleton />}>
      <LoginContent />
    </Suspense>
  );
}
