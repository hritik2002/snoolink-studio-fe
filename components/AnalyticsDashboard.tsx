"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ArrowUpRight } from "lucide-react";
import {
  CommandBar,
  PageBody,
  PageTitle,
  StatBlock,
  EmptyPanel,
} from "@/components/ui/page-shell";

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
  start.setDate(start.getDate() - parseInt(r, 10));
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
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const noData = !error && (overview?.totalEvents ?? 0) === 0;

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
      <CommandBar>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <PageTitle>Analytics</PageTitle>
          <div className="flex items-center gap-2">
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              className="h-9 px-3 text-[13px] bg-[#0A090D] border border-[rgba(51,51,51,0.5)] text-white/80 focus:border-primary/50 focus:outline-none"
              aria-label="Date range"
            >
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
            </select>
            <Button
              variant="beetle-green"
              size="sm"
              onClick={handleExport}
              disabled={exporting}
              className="group"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </Button>
          </div>
        </div>
      </CommandBar>

      <PageBody className="px-4 sm:px-6 py-6">
        {error && (
          <div className="mb-4 text-red-400 text-sm border border-red-900/50 bg-red-950/30 px-3 py-2">
            {error}
          </div>
        )}

        {noData ? (
          <EmptyPanel
            title="No data yet"
            description="Activity will appear here once you search or upload."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              <StatBlock label="Searches" value={overview?.searches ?? 0} />
              <StatBlock
                label="Uploads"
                value={(overview?.uploads?.images ?? 0) + (overview?.uploads?.videos ?? 0)}
              />
              <StatBlock label="Collections" value={overview?.collectionsCreated ?? 0} />
              <StatBlock label="Page views" value={overview?.pageViews ?? 0} />
              <StatBlock label="Events" value={overview?.totalEvents ?? 0} />
            </div>

            {summary?.byDay && summary.byDay.length > 0 && (
              <div className="beetle-card p-4 mb-6 relative backdrop-blur-3xl">
                <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
                <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
                <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
                <span className="beetle-bracket beetle-bracket-br" aria-hidden />
                <p className="text-[13px] font-mono uppercase tracking-wide text-white/90 mb-4">
                  Activity
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[360px] text-sm">
                    <thead>
                      <tr className="border-b border-[#333333]">
                        <th className="text-left py-2 text-[13px] text-[#71717a] font-normal">Date</th>
                        <th className="text-right py-2 text-[13px] text-[#71717a] font-normal">Search</th>
                        <th className="text-right py-2 text-[13px] text-[#71717a] font-normal">Upload</th>
                        <th className="text-right py-2 text-[13px] text-[#71717a] font-normal">Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...(summary.byDay || [])].reverse().map((r) => (
                        <tr key={r.date} className="border-b border-[#333333]/50">
                          <td className="py-2 text-white/80">{r.date}</td>
                          <td className="py-2 text-right font-mono-beetle text-primary">{r.searches}</td>
                          <td className="py-2 text-right font-mono-beetle text-primary">{r.uploads}</td>
                          <td className="py-2 text-right font-mono-beetle text-primary">{r.pageViews}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {overview?.topEventNames && overview.topEventNames.length > 0 && (
              <div className="beetle-card p-4 relative backdrop-blur-3xl">
                <span className="beetle-bracket beetle-bracket-tl" aria-hidden />
                <span className="beetle-bracket beetle-bracket-tr" aria-hidden />
                <span className="beetle-bracket beetle-bracket-bl" aria-hidden />
                <span className="beetle-bracket beetle-bracket-br" aria-hidden />
                <p className="text-[13px] font-mono uppercase tracking-wide text-white/90 mb-4">
                  Top events
                </p>
                <ul className="space-y-2">
                  {overview.topEventNames.map(({ name, count }) => (
                    <li key={name} className="flex justify-between items-center text-sm">
                      <span className="text-white/70 font-mono text-[13px]">{name}</span>
                      <span className="font-mono-beetle text-primary">{count}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </PageBody>
    </div>
  );
}
