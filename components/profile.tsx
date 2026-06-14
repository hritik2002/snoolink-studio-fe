"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Save, User as UserIcon } from "lucide-react";
import { ProfileSkeleton } from "@/components/skeletons";

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
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      const data = await response.json();
      if (data.success && data.data) {
        setProfile({
          name: data.data.name || "",
          email: data.data.email || user?.email || "",
        });
      }
    } catch (err: unknown) {
      console.error("Error fetching profile:", err);
      // Don't show error for initial load, just use defaults
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess("Profile updated successfully!");
      // Update auth context if needed
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col h-full w-full min-w-0 max-w-2xl mx-auto py-4 sm:py-8 px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-light text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Manage your account information
        </p>
      </div>

      <Card className="bg-card border border-border p-4 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 pb-4 sm:pb-6 border-b border-border">
            <div className="flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex-shrink-0">
              <UserIcon className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-medium text-foreground truncate">
                {profile.name || user?.email?.split("@")[0] || "User"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="text-xs sm:text-sm font-medium text-foreground/80"
              >
                Full Name
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={profile.name}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, name: e.target.value }))
                }
                className="bg-muted/30 border-border text-foreground h-11 sm:h-12 text-base touch-manipulation"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-xs sm:text-sm font-medium text-foreground/80"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={profile.email}
                onChange={(e) =>
                  setProfile((prev) => ({ ...prev, email: e.target.value }))
                }
                className="bg-muted/30 border-border text-muted-foreground h-11 sm:h-12 text-base"
                disabled
              />
              <p className="text-xs text-muted-foreground">
                Managed via Google. Email cannot be changed here.
              </p>
            </div>
          </div>

          {error && (
            <div className="text-red-700 text-xs sm:text-sm bg-red-50 border border-red-200 rounded-md p-2.5 sm:p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-700 text-xs sm:text-sm bg-green-50 border border-green-200 rounded-md p-2.5 sm:p-3">
              {success}
            </div>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-primary hover:bg-primary/90 text-white h-11 sm:h-12 text-sm sm:text-base touch-manipulation"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}

