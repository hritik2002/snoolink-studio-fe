"use client";

import { History, BarChart3, CreditCard } from "lucide-react";
import { EmptyPanel } from "@/components/ui/page-shell";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export function ComingSoon({ title, description, icon: Icon }: ComingSoonProps) {
  return (
    <EmptyPanel
      icon={Icon}
      title={title}
      description={description}
      className="min-h-[60vh]"
    />
  );
}

export function HistoryPage() {
  return (
    <ComingSoon
      title="History"
      description="Past searches and quick re-runs. In development."
      icon={History}
    />
  );
}

export function BillingPage() {
  return (
    <ComingSoon
      title="Billing"
      description="Plans and usage. In development."
      icon={CreditCard}
    />
  );
}
