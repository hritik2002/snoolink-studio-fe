"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Settings, Loader2, Save } from "lucide-react";

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
}

export function SettingsPage() {
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [settings, setSettings] = useState<ModelSettings>({ search_model: null, ingestion_model: null });
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
          setSettings(s?.data || { search_model: null, ingestion_model: null });
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
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to save.");
        return;
      }
      setSuccess("Settings saved.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-2xl mx-auto w-full py-4 sm:py-8 px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Settings</h1>
        <p className="text-gray-600 text-xs sm:text-sm">
          Choose which prompt model to use for search and ingestion.
        </p>
      </div>

      <Card className="p-4 sm:p-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-5 w-5 text-purple-600" />
          <h2 className="text-base font-medium text-gray-900">Model preferences</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search – prompt for query expansion
            </label>
            <Select
              value={settings.search_model || ""}
              onValueChange={(v) => setSettings((s) => ({ ...s, search_model: v || null }))}
            >
              <SelectTrigger className="w-full max-w-xs border-gray-300 text-gray-900">
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
            <p className="text-xs text-gray-500 mt-1">Used when you search videos and images.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingestion – prompt for describing media
            </label>
            <Select
              value={settings.ingestion_model || ""}
              onValueChange={(v) => setSettings((s) => ({ ...s, ingestion_model: v || null }))}
            >
              <SelectTrigger className="w-full max-w-xs border-gray-300 text-gray-900">
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
            <p className="text-xs text-gray-500 mt-1">Used when ingesting (uploading) images and videos.</p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </Card>
    </div>
  );
}
