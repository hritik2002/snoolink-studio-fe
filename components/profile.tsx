"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { AppPageLoader } from "@/components/app/AppSpinner";
import { SettingsCard } from "@/components/app/SettingsCard";
import { FormField, AppInput } from "@/components/app/FormField";
import { appBtnPrimary } from "@/lib/app-classes";

interface UserProfile {
  name?: string;
  email?: string;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    email: user?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/profile");
      if (!response.ok) throw new Error("Failed to fetch profile");
      const data = await response.json();
      if (data.success && data.data) {
        setProfile({
          name: data.data.name || "",
          email: data.data.email || user?.email || "",
        });
      }
    } catch (err: unknown) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      setProfile((prev) => ({ ...prev, email: user.email || "" }));
    }
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profile.name, email: profile.email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update profile");
      setSuccess("Saved.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        <PageHeader title="Profile" />
        <AppPageLoader />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
      <PageHeader title="Profile" />

      <div className="px-6 pb-8 max-w-[640px] flex flex-col gap-6">
        <form onSubmit={handleSubmit}>
          <SettingsCard
            title="Personal Information"
            description="Update your display name. Email is managed via Google."
            footer={
              <button type="submit" disabled={saving} className={appBtnPrimary}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            }
          >
            <FormField label="Full Name">
              <AppInput
                id="name"
                type="text"
                placeholder="Your name"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </FormField>

            <FormField label="Email Address">
              <AppInput
                id="email"
                type="email"
                value={profile.email}
                disabled
              />
            </FormField>

            {error && (
              <div className="text-red-600 text-sm border border-red-200 bg-red-50 px-3 py-2 rounded-app-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="text-app-2 text-sm border border-app-border bg-app-hover px-3 py-2 rounded-app-sm">
                {success}
              </div>
            )}
          </SettingsCard>
        </form>
      </div>
    </div>
  );
}
