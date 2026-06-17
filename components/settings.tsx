"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppPageLoader } from "@/components/app/AppSpinner";
import { analyticsClient } from "@/lib/analytics";
import { PageHeader } from "@/components/app/PageHeader";
import { SettingsCard } from "@/components/app/SettingsCard";
import { FormField, AppInput } from "@/components/app/FormField";
import { FilterDropdown } from "@/components/app/FilterDropdown";
import { appBtnPrimary } from "@/lib/app-classes";

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

  const modelOptions = [
    { label: "Default", value: "" },
    ...prompts.map((p) => ({ label: p.model, value: p.model })),
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        <PageHeader title="Settings" description="Model and search preferences." />
        <AppPageLoader />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
      <PageHeader
        title="Settings"
        description="Model and search preferences."
      />

      <div className="px-6 pb-8 max-w-[640px] flex flex-col gap-6">
        <SettingsCard
          title="Model preferences"
          description="Choose which models power search and ingestion."
          footer={
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={appBtnPrimary}
            >
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
          <FormField label="Search model">
            <FilterDropdown
              label="Default"
              value={settings.search_model || ""}
              options={modelOptions}
              onChange={(v) =>
                setSettings((s) => ({ ...s, search_model: v || null }))
              }
            />
          </FormField>

          <FormField label="Ingestion model">
            <FilterDropdown
              label="Default"
              value={settings.ingestion_model || ""}
              options={modelOptions}
              onChange={(v) =>
                setSettings((s) => ({ ...s, ingestion_model: v || null }))
              }
            />
          </FormField>

          <FormField label="Min. score (0–1)">
            <AppInput
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
                    setSettings((s) => ({
                      ...s,
                      min_score: Math.max(0, Math.min(1, n)),
                    }));
                }
              }}
              className="max-w-[8rem]"
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
      </div>
    </div>
  );
}
