"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BarChart2, Loader2, Plus, Shield } from "lucide-react";

interface PromptRow {
  id: string;
  model: string;
  prompt: string;
  creator: string;
  created_at: string;
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [model, setModel] = useState("");
  const [prompt, setPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [checkRes, listRes] = await Promise.all([
          fetch("/api/admin/check"),
          fetch("/api/prompts"),
        ]);
        
        const check = await checkRes.json();
        console.log("checkRes", check);
        setIsAdmin(!!check?.isAdmin);
        if (check?.isAdmin && listRes.ok) {
          const list = await listRes.json();
          setPrompts(list?.data || []);
        }
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!model.trim() || !prompt.trim()) {
      setError("Model and prompt are required.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: model.trim(), prompt: prompt.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Failed to add prompt.");
        return;
      }
      setSuccess("Prompt added.");
      setModel("");
      setPrompt("");
      setPrompts((prev) => [data.data, ...prev]);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-svh flex flex-col items-center justify-center p-6">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Access denied</h1>
        <p className="text-gray-600 mb-6">Only admins can access this page.</p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to app
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-svh bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Admin – Prompts</h1>
        <Link href="/admin-analytics" className="ml-auto">
          <Button variant="outline" size="sm" className="gap-2">
            <BarChart2 className="h-4 w-4" /> Platform Analytics
          </Button>
        </Link>
      </header>

      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        <Card className="p-4 sm:p-6">
          <h2 className="text-base font-medium text-gray-900 mb-4">Add new prompt</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
                Model name (unique)
              </label>
              <Input
                id="model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. vision1, vision2"
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                Prompt
              </label>
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter the full prompt text for this model..."
                rows={6}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}
            <Button type="submit" disabled={submitting} className="gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add prompt
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="text-base font-medium text-gray-900 mb-3">Prompts by model</h2>
          <div className="space-y-3">
            {prompts.length === 0 ? (
              <p className="text-sm text-gray-500">No prompts yet. Add one above.</p>
            ) : (
              prompts.map((row) => (
                <Card key={row.id} className="p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-900">{row.model}</span>
                    <span className="text-xs text-gray-500">{row.creator}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">{row.prompt}</p>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
