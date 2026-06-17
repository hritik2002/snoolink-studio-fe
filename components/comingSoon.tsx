"use client";

import { History, CreditCard, type LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <div className="flex-1 flex flex-col bg-white min-h-[60vh]">
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center gap-5 py-24 px-6 text-center flex-1">
        <div className="w-14 h-14 rounded-[10px] bg-app-active flex items-center justify-center">
          <Icon className="w-6 h-6 text-app-4" />
        </div>
        <p className="text-[14px] text-app-3 max-w-[360px] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function HistoryPage() {
  return (
    <ComingSoon
      title="History"
      description="Past searches and quick re-runs. Coming soon."
      icon={History}
    />
  );
}

export function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      description="Plans and usage. Coming soon."
      icon={CreditCard}
    />
  );
}
