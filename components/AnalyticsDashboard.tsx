"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, BarChart3 } from "lucide-react";
import { AppPageLoader } from "@/components/app/AppSpinner";
import { PageHeader } from "@/components/app/PageHeader";
import { FilterDropdown } from "@/components/app/FilterDropdown";
import { AppTable } from "@/components/app/AppTable";
import { appBtnSecondary } from "@/lib/app-classes";

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

function MetaCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-app-md border border-app-border px-4 py-4 flex flex-col gap-1.5 bg-white">
      <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-app-4">
        {label}
      </span>
      <span className="text-[15px] font-medium text-app-1 tabular-nums">{value}</span>
    </div>
  );
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
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/analytics/events?startDate=${start}&endDate=${end}&limit=1000`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Export failed");
      const blob = new Blob([JSON.stringify(data.data || [], null, 2)], {
        type: "application/json",
      });
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
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        <PageHeader title="Analytics" description="Usage across search, uploads, and collections." />
        <AppPageLoader />
      </div>
    );
  }

  const noData = !error && (overview?.totalEvents ?? 0) === 0;

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
      <PageHeader
        title="Analytics"
        description="Usage across search, uploads, and collections."
        secondaryActions={
          <>
            <FilterDropdown
              label="30 days"
              value={range}
              options={[
                { label: "7 days", value: "7" },
                { label: "30 days", value: "30" },
                { label: "90 days", value: "90" },
              ]}
              onChange={(v) => setRange(v as Range)}
            />
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className={appBtnSecondary}
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export
            </button>
          </>
        }
      />

      <div className="px-6 pb-8 flex flex-col gap-6">
        {error && (
          <div className="text-red-600 text-sm border border-red-200 bg-red-50 px-3 py-2 rounded-app-sm">
            {error}
          </div>
        )}

        {noData ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <BarChart3 className="w-8 h-8 text-app-4" />
            <p className="text-[16px] font-semibold text-app-1">No data yet</p>
            <p className="text-[14px] text-app-3 max-w-sm">
              Activity will appear here once you search or upload.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <MetaCard label="Searches" value={overview?.searches ?? 0} />
              <MetaCard
                label="Uploads"
                value={
                  (overview?.uploads?.images ?? 0) + (overview?.uploads?.videos ?? 0)
                }
              />
              <MetaCard label="Collections" value={overview?.collectionsCreated ?? 0} />
              <MetaCard label="Page views" value={overview?.pageViews ?? 0} />
              <MetaCard label="Events" value={overview?.totalEvents ?? 0} />
            </div>

            {summary?.byDay && summary.byDay.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[16px] font-semibold text-app-1">Activity</h2>
                <AppTable
                  className="mx-0"
                  columns={[
                    { key: "date", label: "Date" },
                    { key: "searches", label: "Search" },
                    { key: "uploads", label: "Upload" },
                    { key: "pageViews", label: "Views" },
                  ]}
                  data={[...(summary.byDay || [])].reverse().map((r) => ({
                    id: r.date,
                    date: r.date,
                    searches: r.searches,
                    uploads: r.uploads,
                    pageViews: r.pageViews,
                  }))}
                />
              </div>
            )}

            {overview?.topEventNames && overview.topEventNames.length > 0 && (
              <div className="flex flex-col gap-4">
                <h2 className="text-[16px] font-semibold text-app-1">Top events</h2>
                <AppTable
                  className="mx-0"
                  columns={[
                    { key: "name", label: "Event" },
                    { key: "count", label: "Count", width: "100px" },
                  ]}
                  data={overview.topEventNames.map((e) => ({
                    id: e.name,
                    name: e.name,
                    count: e.count,
                  }))}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
