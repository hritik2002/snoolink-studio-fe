"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, BarChart3, Loader2, Shield, Users, Search, Upload, FolderPlus, Eye, Zap, Smartphone, Server } from "lucide-react";

type Range = "7" | "30" | "90";

function getRange(r: Range): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - parseInt(r, 10));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

interface Overview {
  activeUsers: number;
  totalEvents: number;
  searches: number;
  uploads: { images: number; videos: number };
  collectionsCreated: number;
  pageViews: number;
  featureUse: number;
  topEventNames: { name: string; count: number }[];
  bySource: { client: number; server: number };
}

interface Trends {
  byDay: Array<{
    date: string;
    activeUsers: number;
    searches: number;
    uploads: number;
    pageViews: number;
    totalEvents: number;
  }>;
}

interface UserRow {
  userId: string;
  email?: string | null;
  name?: string | null;
  totalEvents: number;
  searches: number;
  uploads: number;
  collectionsCreated: number;
  pageViews: number;
  firstSeen: string;
  lastSeen: string;
}

export default function AdminAnalyticsPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [range, setRange] = useState<Range>("30");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [users, setUsers] = useState<{ users: UserRow[]; total: number; hasMore: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPage, setUserPage] = useState(0);
  const limit = 20;

  const { start, end } = getRange(range);
  const q = `startDate=${start}&endDate=${end}`;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/admin/check");
        const d = await r.json();
        setIsAdmin(!!d?.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/admin/analytics/overview?${q}`),
      fetch(`/api/admin/analytics/trends?${q}`),
      fetch(`/api/admin/analytics/users?${q}&limit=${limit}&offset=0`),
    ])
      .then(async ([r1, r2, r3]) => {
        if (cancelled) return;
        const [j1, j2, j3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
        if (!r1.ok) throw new Error(j1?.error || "Failed to load overview");
        if (!r2.ok) throw new Error(j2?.error || "Failed to load trends");
        if (!r3.ok) throw new Error(j3?.error || "Failed to load users");
        setOverview(j1?.data ?? null);
        setTrends(j2?.data ?? null);
        setUsers({ users: j3?.users ?? [], total: j3?.total ?? 0, hasMore: j3?.hasMore ?? false });
        setUserPage(0);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin, start, end]);

  const loadMoreUsers = async () => {
    if (!isAdmin || !users?.hasMore) return;
    const offset = (userPage + 1) * limit;
    try {
      const r = await fetch(`/api/admin/analytics/users?${q}&limit=${limit}&offset=${offset}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error);
      setUsers((prev) => prev ? { ...prev, users: [...prev.users, ...(d.users ?? [])], hasMore: d.hasMore ?? false } : null);
      setUserPage((p) => p + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more users");
    }
  };

  if (loading && isAdmin === null) {
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
        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          Admin – Platform Analytics
        </h1>
        <Link href="/admin">
          <Button variant="outline" size="sm">Prompts</Button>
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Period:</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {loading && !overview ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>
        ) : (
          <>
            {/* Platform KPIs */}
            <Card className="p-4 border border-gray-200">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Platform overview</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Kpi icon={<Users className="h-5 w-5" />} label="Active users" value={overview?.activeUsers ?? 0} />
                <Kpi icon={<BarChart3 className="h-5 w-5" />} label="Total events" value={overview?.totalEvents ?? 0} />
                <Kpi icon={<Search className="h-5 w-5" />} label="Searches" value={overview?.searches ?? 0} />
                <Kpi
                  icon={<Upload className="h-5 w-5" />}
                  label="Uploads"
                  value={(overview?.uploads?.images ?? 0) + (overview?.uploads?.videos ?? 0)}
                  sub={`${overview?.uploads?.images ?? 0} img · ${overview?.uploads?.videos ?? 0} vid`}
                />
                <Kpi icon={<FolderPlus className="h-5 w-5" />} label="Collections created" value={overview?.collectionsCreated ?? 0} />
                <Kpi icon={<Eye className="h-5 w-5" />} label="Page views" value={overview?.pageViews ?? 0} />
                <Kpi icon={<Zap className="h-5 w-5" />} label="Feature use" value={overview?.featureUse ?? 0} />
                <Kpi icon={<Smartphone className="h-5 w-5" />} label="Client events" value={overview?.bySource?.client ?? 0} />
                <Kpi icon={<Server className="h-5 w-5" />} label="Server events" value={overview?.bySource?.server ?? 0} />
              </div>
            </Card>

            {/* Top events */}
            {overview?.topEventNames && overview.topEventNames.length > 0 && (
              <Card className="p-4 border border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 mb-3">Top events</h2>
                <div className="flex flex-wrap gap-3">
                  {overview.topEventNames.map(({ name, count }) => (
                    <span key={name} className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-mono text-gray-800">
                      {name} <span className="ml-1.5 font-semibold text-purple-600">{count}</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Trends by day */}
            {trends?.byDay && trends.byDay.length > 0 && (
              <Card className="p-4 border border-gray-200 overflow-x-auto">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Daily trends</h2>
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 pr-4 text-gray-600 font-medium">Date</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Active users</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Searches</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Uploads</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Page views</th>
                      <th className="text-right py-2 px-2 text-gray-600 font-medium">Events</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(trends.byDay || [])].reverse().map((r) => (
                      <tr key={r.date} className="border-b border-gray-100">
                        <td className="py-2.5 pr-4 text-gray-900">{r.date}</td>
                        <td className="py-2.5 px-2 text-right text-gray-700">{r.activeUsers}</td>
                        <td className="py-2.5 px-2 text-right text-gray-700">{r.searches}</td>
                        <td className="py-2.5 px-2 text-right text-gray-700">{r.uploads}</td>
                        <td className="py-2.5 px-2 text-right text-gray-700">{r.pageViews}</td>
                        <td className="py-2.5 px-2 text-right text-gray-700">{r.totalEvents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}

            {/* Per-user table */}
            <Card className="p-4 border border-gray-200 overflow-x-auto">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Users by activity (sorted by total events)</h2>
              {!users?.users?.length ? (
                <p className="text-sm text-gray-500">No user activity in this period.</p>
              ) : (
                <>
                  <table className="w-full min-w-[720px] text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-2 text-gray-600 font-medium">User / Email</th>
                        <th className="text-right py-2 px-2 text-gray-600 font-medium">Events</th>
                        <th className="text-right py-2 px-2 text-gray-600 font-medium">Searches</th>
                        <th className="text-right py-2 px-2 text-gray-600 font-medium">Uploads</th>
                        <th className="text-right py-2 px-2 text-gray-600 font-medium">Collections</th>
                        <th className="text-right py-2 px-2 text-gray-600 font-medium">Pages</th>
                        <th className="text-left py-2 pl-2 text-gray-600 font-medium">First / Last seen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.users.map((u) => (
                        <tr key={u.userId} className="border-b border-gray-100">
                          <td className="py-2.5 pr-2">
                            <span className="text-gray-900 font-medium">{u.email || u.name || u.userId.slice(0, 8) + "…"}</span>
                            {!u.email && !u.name && <span className="block text-xs text-gray-500 font-mono">{u.userId}</span>}
                          </td>
                          <td className="py-2.5 px-2 text-right text-gray-700">{u.totalEvents}</td>
                          <td className="py-2.5 px-2 text-right text-gray-700">{u.searches}</td>
                          <td className="py-2.5 px-2 text-right text-gray-700">{u.uploads}</td>
                          <td className="py-2.5 px-2 text-right text-gray-700">{u.collectionsCreated}</td>
                          <td className="py-2.5 px-2 text-right text-gray-700">{u.pageViews}</td>
                          <td className="py-2.5 pl-2 text-gray-500 text-xs">
                            {new Date(u.firstSeen).toLocaleDateString()} – {new Date(u.lastSeen).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {users.hasMore && (
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={loadMoreUsers} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Load more"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-purple-600 mb-0.5">{icon}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-600">{label}</div>
      {sub != null && sub !== "" && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}
