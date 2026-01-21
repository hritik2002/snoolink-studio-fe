"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Settings, Loader2, Save, Sparkles, Zap } from "lucide-react";
import { analyticsClient } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface PromptRow {
  id: string;
  model: string;
  prompt: string;
  creator: string;
  created_at: string;
}

interface ModelSettings {
  search_model: string | null;
  ingestion_model: string | null;
  min_score: number | null;
}

const DEFAULT_MIN_SCORE = 0.5;

export function SettingsPage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [settings, setSettings] = useState<ModelSettings>({ search_model: null, ingestion_model: null, min_score: null });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [promptsRes, settingsRes] = await Promise.all([
          fetch("/api/prompts"),
          fetch("/api/user-model-settings"),
        ]);
        if (promptsRes.ok) {
          const p = await promptsRes.json();
          setPrompts(p?.data || []);
        }
        if (settingsRes.ok) {
          const s = await settingsRes.json();
          const d = s?.data || {};
          setSettings({
            search_model: d.search_model ?? null,
            ingestion_model: d.ingestion_model ?? null,
            min_score: d.min_score != null ? Number(d.min_score) : null,
          });
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user-model-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          search_model: settings.search_model || null,
          ingestion_model: settings.ingestion_model || null,
          min_score: settings.min_score ?? null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save.");
        return;
      }
      setSuccess("Settings saved.");
      setTimeout(() => setSuccess(null), 3000);
      analyticsClient.feature("settings_saved");
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh] page-animate-fade">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--page-accent-primary)]" />
            <div className="absolute inset-0 bg-[var(--page-accent-primary)]/20 rounded-full blur-xl" />
          </div>
          <p className="text-muted-foreground font-[var(--page-font)]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex-1 flex flex-col min-w-0 max-w-3xl mx-auto w-full",
      "py-6 sm:py-10 px-4 sm:px-6 overflow-x-hidden",
      "page-animate-fade"
    )}>
      {/* Atmospheric background */}
      <div className="fixed inset-0 pointer-events-none -z-10 opacity-30 dark:opacity-10">
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 20% 30%, var(--page-accent-primary) 0%, transparent 50%),
                        radial-gradient(circle at 80% 70%, var(--page-accent-secondary) 0%, transparent 50%)`,
          }}
        />
      </div>

      {/* Header */}
      <div className="mb-8 sm:mb-10 page-animate-slide">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn(
            "relative rounded-xl p-3",
            "bg-gradient-to-br from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)]",
            "shadow-lg shadow-[var(--page-accent-primary)]/20"
          )}>
            <Settings className="h-6 w-6 text-white" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <h1 className={cn(
              "text-3xl sm:text-4xl font-bold",
              "font-[var(--page-font)]",
              "bg-gradient-to-r from-[var(--page-accent-primary)] to-[var(--page-accent-secondary)]",
              "bg-clip-text text-transparent"
            )}>
              Settings
            </h1>
          </div>
        </div>
        <p className={cn(
          "text-muted-foreground text-sm sm:text-base",
          "font-[var(--page-font)] font-medium",
          "ml-[60px]"
        )}>
          Configure AI models and search preferences to customize your experience.
        </p>
      </div>

      {/* Settings Card */}
      <Card className={cn(
        "page-card-premium",
        "p-6 sm:p-8",
        "page-animate-scale"
      )}>
        <div className="flex items-center gap-3 mb-6">
          <div className={cn(
            "rounded-lg p-2",
            "bg-gradient-to-br from-[var(--page-accent-primary)]/10 to-[var(--page-accent-secondary)]/10",
            "border border-[var(--page-accent-primary)]/20"
          )}>
            <Zap className="h-5 w-5 text-[var(--page-accent-primary)]" />
          </div>
          <h2 className={cn(
            "text-xl font-semibold",
            "font-[var(--page-font)]"
          )}>
            Model Preferences
          </h2>
        </div>

        <div className="space-y-6">
          {/* Search Model */}
          <div className="space-y-2">
            <label className={cn(
              "block text-sm font-semibold",
              "font-[var(--page-font)]",
              "text-foreground"
            )}>
              Search Model
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                – Prompt for query expansion
              </span>
            </label>
            <Select
              value={settings.search_model || ""}
              onValueChange={(v) => setSettings((s) => ({ ...s, search_model: v || null }))}
            >
              <SelectTrigger className={cn(
                "w-full max-w-md",
                "page-input-premium",
                "h-12",
                "font-[var(--page-font)]"
              )}>
                <span>{settings.search_model || "Default (system prompt)"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default (system prompt)</SelectItem>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.model}>
                    {p.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={cn(
              "text-xs text-muted-foreground mt-1.5",
              "font-[var(--page-font)]"
            )}>
              Used when you search videos and images. Expands your query with AI for better results.
            </p>
          </div>

          {/* Ingestion Model */}
          <div className="space-y-2">
            <label className={cn(
              "block text-sm font-semibold",
              "font-[var(--page-font)]",
              "text-foreground"
            )}>
              Ingestion Model
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                – Prompt for describing media
              </span>
            </label>
            <Select
              value={settings.ingestion_model || ""}
              onValueChange={(v) => setSettings((s) => ({ ...s, ingestion_model: v || null }))}
            >
              <SelectTrigger className={cn(
                "w-full max-w-md",
                "page-input-premium",
                "h-12",
                "font-[var(--page-font)]"
              )}>
                <span>{settings.ingestion_model || "Default (system prompt)"}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Default (system prompt)</SelectItem>
                {prompts.map((p) => (
                  <SelectItem key={p.id} value={p.model}>
                    {p.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={cn(
              "text-xs text-muted-foreground mt-1.5",
              "font-[var(--page-font)]"
            )}>
              Used when ingesting (uploading) images and videos. Generates semantic descriptions.
            </p>
          </div>

          {/* Minimum Score */}
          <div className="space-y-2">
            <label className={cn(
              "block text-sm font-semibold",
              "font-[var(--page-font)]",
              "text-foreground"
            )}>
              Minimum Search Score
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                – Vector similarity threshold
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder={`${DEFAULT_MIN_SCORE} (default)`}
                value={settings.min_score ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setSettings((s) => ({ ...s, min_score: null }));
                  else {
                    const n = parseFloat(v);
                    if (!Number.isNaN(n)) setSettings((s) => ({ ...s, min_score: Math.max(0, Math.min(1, n)) }));
                  }
                }}
                className={cn(
                  "w-full max-w-[12rem]",
                  "page-input-premium",
                  "h-12 px-4",
                  "rounded-lg",
                  "font-[var(--page-font)]",
                  "text-foreground"
                )}
              />
            </div>
            <p className={cn(
              "text-xs text-muted-foreground mt-1.5",
              "font-[var(--page-font)]"
            )}>
              Results below this threshold are filtered out (0–1). Default: 0.5. Higher = stricter matching.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <div className={cn(
              "p-3 rounded-lg",
              "bg-red-50 dark:bg-red-950/20",
              "border border-red-200 dark:border-red-800",
              "text-red-700 dark:text-red-300",
              "text-sm font-[var(--page-font)]",
              "page-animate-fade"
            )}>
              {error}
            </div>
          )}
          {success && (
            <div className={cn(
              "p-3 rounded-lg",
              "bg-emerald-50 dark:bg-emerald-950/20",
              "border border-emerald-200 dark:border-emerald-800",
              "text-emerald-700 dark:text-emerald-300",
              "text-sm font-[var(--page-font)]",
              "page-animate-fade"
            )}>
              {success}
            </div>
          )}

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className={cn(
              "page-button-premium",
              "h-12 px-6",
              "text-white",
              "font-[var(--page-font)] font-semibold",
              "gap-2",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
