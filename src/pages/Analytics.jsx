import { BarChart3, Bell, MousePointerClick, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import MetricCard from "../components/dashboard/MetricCard";
import { getCompanyMetrics, getEngagementAnalytics, getEvents, getNotifications, getUserAnalytics, getUsers } from "../lib/api";
import { useAsyncData } from "../hooks/useAsyncData";

async function loadAnalyticsPage() {
  const [analytics, events, notifications, users, metrics] = await Promise.all([
    getEngagementAnalytics(),
    getEvents(),
    getNotifications(),
    getUsers(),
    getCompanyMetrics(),
  ]);
  return { analytics, events, notifications, users, metrics };
}

const COLORS = ["#0f766e", "#f97316", "#2563eb", "#7c3aed", "#dc2626", "#475569"];

export default function Analytics() {
  const { data, loading, error } = useAsyncData(loadAnalyticsPage, []);
  const [selectedUser, setSelectedUser] = useState("");
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  const distribution = data?.analytics?.event_distribution || {};
  const eventDistribution = Object.entries(distribution).map(([name, value]) => ({ name, value }));
  const comparison = [
    { name: "Events", value: data?.analytics?.total_events ?? data?.events?.length ?? 0 },
    { name: "Notifications", value: data?.analytics?.total_notifications ?? data?.notifications?.length ?? 0 },
  ];

  const userActivity = useMemo(() => {
    const counts = new Map();
    for (const event of data?.events || []) {
      counts.set(event.user_id, (counts.get(event.user_id) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([user_id, events]) => ({ user_id, events })).slice(0, 8);
  }, [data?.events]);

  async function handleUserChange(userId) {
    setSelectedUser(userId);
    setUserAnalytics(null);
    setUserError("");
    if (!userId) return;
    setUserLoading(true);
    try {
      setUserAnalytics(await getUserAnalytics(userId));
    } catch (requestError) {
      setUserError(requestError.message);
    } finally {
      setUserLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Engagement intelligence"
        description="Visualize event distribution, notification volume, and per-user activity that informs timing decisions."
      />
      {loading ? <Loading /> : null}
      {!loading && error ? <Alert message={error} /> : null}
      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Users" value={data?.metrics?.total_users ?? 0} detail="Company audience size" icon={MousePointerClick} accent="bg-signal" />
            <MetricCard title="Retention" value={`${data?.metrics?.user_retention_percentage ?? 0}%`} detail="Users with engagement feedback" icon={Bell} accent="bg-coral" />
            <MetricCard title="Conversions" value={data?.metrics?.successful_conversion_notifications ?? 0} detail="Clicked notifications" icon={BarChart3} accent="bg-blue-600" />
            <MetricCard title="Click Rate" value={`${Math.round((data?.metrics?.click_rate ?? 0) * 100)}%`} detail="Clicked over feedback events" icon={TrendingUp} accent="bg-slate-900" />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Event distribution</h2>
              <p className="muted mt-1">Behavior signal mix across tracked users.</p>
              <div className="mt-5 h-80">
                {eventDistribution.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {eventDistribution.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={BarChart3} title="No event distribution yet" description="Record events to generate distribution analytics." />}
              </div>
            </section>

            <section className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Notifications vs events</h2>
              <p className="muted mt-1">Volume comparison between behavioral context and notification decisions.</p>
              <div className="mt-5 h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparison}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: "#f1f5f9" }} />
                    <Legend />
                    <Bar dataKey="value" name="Count" fill="#0f766e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {[
              ["Age", data?.metrics?.demographics?.age],
              ["Country", data?.metrics?.demographics?.country],
              ["Device", data?.metrics?.demographics?.device],
            ].map(([label, chartData]) => (
              <section className="panel p-5" key={label}>
                <h2 className="text-lg font-bold text-slate-950">{label} breakdown</h2>
                <p className="muted mt-1">Tenant users grouped by {label.toLowerCase()}.</p>
                <div className="mt-5 h-72">
                  {chartData?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                        <Tooltip cursor={{ fill: "#f1f5f9" }} />
                        <Bar dataKey="value" fill="#0f766e" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <EmptyState icon={BarChart3} title={`No ${label.toLowerCase()} data`} description="Create users with demographic fields to populate this chart." />}
                </div>
              </section>
            ))}
          </div>

          <section className="panel p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">User activity</h2>
                <p className="muted mt-1">Inspect per-user totals from GET /analytics/user/:user_id.</p>
              </div>
              <select className="input max-w-xs" value={selectedUser} onChange={(event) => handleUserChange(event.target.value)}>
                <option value="">Select a user</option>
                {(data?.users || []).map((user) => <option key={user.user_id} value={user.user_id}>{user.user_id}</option>)}
              </select>
            </div>

            <div className="mt-5 grid gap-6 xl:grid-cols-[1fr_320px]">
              <div className="h-72">
                {userActivity.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={userActivity}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="user_id" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip cursor={{ fill: "#f1f5f9" }} />
                      <Bar dataKey="events" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <EmptyState icon={TrendingUp} title="No user activity yet" description="User activity appears after events are tracked." />}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-950">Selected user</h3>
                {userLoading ? <Loading label="Loading user analytics" /> : null}
                {userError ? <Alert message={userError} /> : null}
                {!userLoading && !userError && userAnalytics ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-md bg-white p-3">
                      <p className="text-xs uppercase tracking-wide text-slate-400">User ID</p>
                      <p className="mt-1 font-semibold text-slate-900">{userAnalytics.user_id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Events</p>
                        <p className="mt-1 text-2xl font-bold text-slate-950">{userAnalytics.total_events}</p>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Notifications</p>
                        <p className="mt-1 text-2xl font-bold text-slate-950">{userAnalytics.total_notifications}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
                {!userLoading && !userAnalytics && !userError ? <p className="mt-3 text-sm text-slate-500">Choose a user to load detailed activity.</p> : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
