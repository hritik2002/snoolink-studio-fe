"use client";

import { Card } from "@/components/ui/card";
import { History, BarChart3, Settings, CreditCard, Sparkles, Clock } from "lucide-react";

interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  features?: string[];
}

export function ComingSoon({ title, description, icon, features }: ComingSoonProps) {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] py-12">
      <Card className="max-w-2xl w-full p-8 md:p-12 bg-white border border-gray-200">
        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
            <div className="text-purple-600">
              {icon}
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {description}
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Coming Soon</span>
          </div>

          {/* Features Preview */}
          {features && features.length > 0 && (
            <div className="w-full mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-700 mb-4">What to expect:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                {features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className="mt-8 pt-6 border-t border-gray-200 w-full">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>We&apos;re working hard to bring you this feature</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function HistoryPage() {
  return (
    <ComingSoon
      title="Search History"
      description="Track and revisit your past searches to quickly find what you're looking for."
      icon={<History className="h-10 w-10" />}
      features={[
        "View your complete search history",
        "Quick access to recent queries",
        "Save favorite searches",
        "Export search results"
      ]}
    />
  );
}

export function AnalyticsPage() {
  return (
    <ComingSoon
      title="Analytics Dashboard"
      description="Gain insights into your video library usage, search patterns, and content performance."
      icon={<BarChart3 className="h-10 w-10" />}
      features={[
        "Search analytics and trends",
        "Content usage statistics",
        "Performance metrics",
        "Custom reports and exports"
      ]}
    />
  );
}

export function SettingsPage() {
  return (
    <ComingSoon
      title="Settings"
      description="Customize your Snoolink Studio experience with personalized preferences and configurations."
      icon={<Settings className="h-10 w-10" />}
      features={[
        "Account preferences",
        "Search settings and filters",
        "Notification preferences",
        "API keys and integrations"
      ]}
    />
  );
}

export function BillingPage() {
  return (
    <ComingSoon
      title="Billing & Subscription"
      description="Manage your subscription, view usage, and update payment methods all in one place."
      icon={<CreditCard className="h-10 w-10" />}
      features={[
        "View and manage subscription",
        "Usage statistics and limits",
        "Payment method management",
        "Billing history and invoices"
      ]}
    />
  );
}

