"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Save, ArrowUpRight } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons";
import { CommandBar, PageBody, PageTitle } from "@/components/ui/page-shell";

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

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <CommandBar>
        <PageTitle>Profile</PageTitle>
      </CommandBar>

      <PageBody className="px-4 sm:px-6 py-6 max-w-lg">
        <div className="beetle-card p-6 relative backdrop-blur-3xl">
          <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
          <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-br" aria-hidden />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="pb-5 border-b border-[#333333]">
              <p className="text-white font-medium truncate">
                {profile.name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[13px] text-[#71717a] truncate mt-0.5">{user?.email}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-[13px] text-[#71717a]">
                  Name
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-11 bg-[#0A090D] border-[rgba(51,51,51,0.5)]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-[13px] text-[#71717a]">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="h-11 bg-[#0A090D] border-[rgba(51,51,51,0.5)] text-white/50"
                />
                <p className="text-[13px] text-[#71717a]">Managed via Google.</p>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm border border-red-900/50 bg-red-950/30 px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="text-primary text-sm border border-primary/30 bg-primary/5 px-3 py-2">
                {success}
              </div>
            )}

            <Button type="submit" variant="beetle" disabled={saving} className="w-full group">
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  Save
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </>
              )}
            </Button>
          </form>
        </div>
      </PageBody>
    </div>
  );
}
