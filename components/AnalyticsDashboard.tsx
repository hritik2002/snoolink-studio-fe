"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, Search, Upload, FolderPlus, Eye, Loader2, Download, Calendar } from "lucide-react";

type Range = "7" | "30" | "90";

interface Overview {
  totalEvents: number;
  searches: number;
  uploads: { images: number; videos: number };
  collectionsCreated: number;
  pageViews: number;
  topEventNames: { name: string; count: number }[];
}

interface Summary {
  byDay: Array<{ date: string; searches: number; uploads: number; pageViews: number }>;
  byEvent: Record<string, number>;
}

function getRange(r: Range): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  const d = parseInt(r, 10);
  start.setDate(start.getDate() - d);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function AnalyticsDashboard() {
  const [range, setRange] = useState<Range>("30");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { start, end } = getRange(range);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/analytics/overview?startDate=${start}&endDate=${end}`),
      fetch(`/api/analytics/summary?startDate=${start}&endDate=${end}`),
    ])
      .then(async ([r1, r2]) => {
        if (cancelled) return;
        const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
        if (!r1.ok) throw new Error(j1?.error || "Failed to load overview");
        if (!r2.ok) throw new Error(j2?.error || "Failed to load summary");
        setOverview(j1?.data ?? null);
        setSummary(j2?.data ?? null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [start, end]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/analytics/events?startDate=${start}&endDate=${end}&limit=1000`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Export failed");
      const blob = new Blob([JSON.stringify(data.data || [], null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${start}-to-${end}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 max-w-5xl mx-auto w-full py-6 sm:py-8 px-4 sm:px-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-purple-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Usage, search patterns, and content performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            aria-label="Date range"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-md bg-[#7c3aed] px-3 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-60"
          >
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <StatCard
          icon={<Search className="h-5 w-5" />}
          label="Searches"
          value={overview?.searches ?? 0}
        />
        <StatCard
          icon={<Upload className="h-5 w-5" />}
          label="Uploads"
          value={(overview?.uploads?.images ?? 0) + (overview?.uploads?.videos ?? 0)}
          sub={`${overview?.uploads?.images ?? 0} img, ${overview?.uploads?.videos ?? 0} vid`}
        />
        <StatCard
          icon={<FolderPlus className="h-5 w-5" />}
          label="Collections created"
          value={overview?.collectionsCreated ?? 0}
        />
        <StatCard
          icon={<Eye className="h-5 w-5" />}
          label="Page views"
          value={overview?.pageViews ?? 0}
        />
        <StatCard
          icon={<BarChart3 className="h-5 w-5" />}
          label="Total events"
          value={overview?.totalEvents ?? 0}
        />
      </div>

      {/* Activity over time */}
      {summary?.byDay && summary.byDay.length > 0 && (
        <Card className="p-4 sm:p-6 border border-gray-200 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            Activity over time
          </h2>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-2 text-gray-600 font-medium">Date</th>
                  <th className="text-right py-2 px-2 text-gray-600 font-medium">Searches</th>
                  <th className="text-right py-2 px-2 text-gray-600 font-medium">Uploads</th>
                  <th className="text-right py-2 px-2 text-gray-600 font-medium">Page views</th>
                </tr>
              </thead>
              <tbody>
                {[...(summary.byDay || [])].reverse().map((r) => (
                  <tr key={r.date} className="border-b border-gray-100">
                    <td className="py-2.5 px-2 text-gray-900">{r.date}</td>
                    <td className="py-2.5 px-2 text-right text-gray-700">{r.searches}</td>
                    <td className="py-2.5 px-2 text-right text-gray-700">{r.uploads}</td>
                    <td className="py-2.5 px-2 text-right text-gray-700">{r.pageViews}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Top events */}
      {overview?.topEventNames && overview.topEventNames.length > 0 && (
        <Card className="p-4 sm:p-6 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top events</h2>
          <ul className="space-y-2">
            {overview.topEventNames.map(({ name, count }) => (
              <li key={name} className="flex justify-between items-center text-sm">
                <span className="text-gray-700 font-mono">{name}</span>
                <span className="text-gray-900 font-medium">{count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!loading && !error && (overview?.totalEvents ?? 0) === 0 && (
        <Card className="p-8 border border-gray-200 border-dashed text-center">
          <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">No analytics data yet for this period.</p>
          <p className="text-gray-500 text-sm mt-1">Searches, uploads, and page views will appear here.</p>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <Card className="p-4 border border-gray-200">
      <div className="flex items-center gap-2 text-purple-600 mb-1">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
      {sub != null && sub !== "" && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </Card>
  );
}
