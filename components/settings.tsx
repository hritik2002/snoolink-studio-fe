"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Loader2, Save, ArrowUpRight } from "lucide-react";
import { analyticsClient } from "@/lib/analytics";
import { CommandBar, PageBody, PageTitle, PageDescription } from "@/components/ui/page-shell";

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
  const [settings, setSettings] = useState<ModelSettings>({
    search_model: null,
    ingestion_model: null,
    min_score: null,
  });
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
      setSuccess("Saved.");
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
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <CommandBar>
        <PageTitle>Settings</PageTitle>
        <PageDescription className="mt-1">Model and search preferences.</PageDescription>
      </CommandBar>

      <PageBody className="px-4 sm:px-6 py-6 max-w-lg">
        <div className="beetle-card p-6 relative backdrop-blur-3xl">
          <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
          <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
          <span className="beetle-bracket beetle-bracket-br" aria-hidden />

          <p className="text-[13px] font-mono uppercase tracking-wide text-white/90 mb-6">
            Model preferences
          </p>

          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[13px] text-[#71717a]">Search model</label>
              <Select
                value={settings.search_model || ""}
                onValueChange={(v) => setSettings((s) => ({ ...s, search_model: v || null }))}
              >
                <SelectTrigger className="w-full h-11">
                  <span>{settings.search_model || "Default"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  {prompts.map((p) => (
                    <SelectItem key={p.id} value={p.model}>{p.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] text-[#71717a]">Ingestion model</label>
              <Select
                value={settings.ingestion_model || ""}
                onValueChange={(v) => setSettings((s) => ({ ...s, ingestion_model: v || null }))}
              >
                <SelectTrigger className="w-full h-11">
                  <span>{settings.ingestion_model || "Default"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Default</SelectItem>
                  {prompts.map((p) => (
                    <SelectItem key={p.id} value={p.model}>{p.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] text-[#71717a]">Min. score (0–1)</label>
              <input
                type="number"
                min={0}
                max={1}
                step={0.05}
                placeholder={String(DEFAULT_MIN_SCORE)}
                value={settings.min_score ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") setSettings((s) => ({ ...s, min_score: null }));
                  else {
                    const n = parseFloat(v);
                    if (!Number.isNaN(n))
                      setSettings((s) => ({ ...s, min_score: Math.max(0, Math.min(1, n)) }));
                  }
                }}
                className="w-full max-w-[8rem] h-11 px-3 bg-[#0A090D] border border-[rgba(51,51,51,0.5)] text-white text-sm focus:border-primary/50 focus:outline-none"
              />
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

            <Button variant="beetle" onClick={handleSave} disabled={saving} className="group">
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
          </div>
        </div>
      </PageBody>
    </div>
  );
}
