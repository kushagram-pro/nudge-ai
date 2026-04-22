import { Activity, Bell, CheckCircle2, Clock, MousePointerClick, Users as UsersIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Alert from "../components/common/Alert";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import MetricCard from "../components/dashboard/MetricCard";
import { getCompanyMetrics, getEngagementAnalytics, getEvents, getNotifications, getUserAnalytics, getUsers } from "../lib/api";
import { formatDate, notificationNextStep } from "../lib/format";
import { useAsyncData } from "../hooks/useAsyncData";

async function loadDashboard() {
  const [users, events, notifications, analytics, metrics] = await Promise.all([
    getUsers(),
    getEvents(),
    getNotifications(),
    getEngagementAnalytics(),
    getCompanyMetrics(),
  ]);
  return { users, events, notifications, analytics, metrics };
}

const CHART_COLORS = ["#0f766e", "#f97316", "#2563eb", "#7c3aed", "#dc2626", "#475569"];

function MiniBarChart({ data, dataKey = "value", nameKey = "name" }) {
  if (!data?.length) {
    return <p className="muted">No demographic data yet.</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey={nameKey} tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip cursor={{ fill: "#f1f5f9" }} />
          <Bar dataKey={dataKey} radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Dashboard() {
  const { data, loading, error } = useAsyncData(loadDashboard, []);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedUserAnalytics, setSelectedUserAnalytics] = useState(null);
  const [selectedUserError, setSelectedUserError] = useState("");
  const [selectedUserLoading, setSelectedUserLoading] = useState(false);

  const users = useMemo(() => data?.users || [], [data?.users]);
  const events = useMemo(() => data?.events || [], [data?.events]);
  const notifications = useMemo(() => data?.notifications || [], [data?.notifications]);
  const metrics = data?.metrics || {};
  const demographics = metrics.demographics || {};
  const latestNotifications = notifications.slice(-4).reverse();
  const recentEvents = events.slice(-5).reverse();
  const selectedUser = useMemo(() => users.find((user) => user.user_id === selectedUserId) || null, [users, selectedUserId]);
  const apiKey = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("nudgeai-company-auth") || "{}").apiKey || "nudge_demo_api_key_123";
    } catch {
      return "nudge_demo_api_key_123";
    }
  }, []);

  useEffect(() => {
    if (!selectedUserId && users.length) {
      setSelectedUserId(users[0].user_id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    let active = true;

    async function loadSelectedUser() {
      if (!selectedUserId) {
        setSelectedUserAnalytics(null);
        return;
      }

      setSelectedUserLoading(true);
      setSelectedUserError("");
      try {
        const result = await getUserAnalytics(selectedUserId);
        if (active) {
          setSelectedUserAnalytics(result);
        }
      } catch (requestError) {
        if (active) {
          setSelectedUserError(requestError.message);
        }
      } finally {
        if (active) {
          setSelectedUserLoading(false);
        }
      }
    }

    loadSelectedUser();

    return () => {
      active = false;
    };
  }, [selectedUserId]);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Notification intelligence cockpit"
        description="Company-level analytics for API decisions, user engagement, retention, conversion notifications, and demographic behavior."
      />
      {loading ? <Loading /> : null}
      {!loading && error ? <Alert message={`${error}. Make sure the FastAPI backend is running at http://localhost:8000.`} /> : null}
      {!loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Total Users" value={metrics.total_users ?? users.length} detail="Tenant-scoped customer profiles" icon={UsersIcon} accent="bg-ink" />
            <MetricCard title="Retention" value={`${metrics.user_retention_percentage ?? 0}%`} detail="Users with open or click feedback" icon={MousePointerClick} accent="bg-signal" />
            <MetricCard title="Conversion Notifications" value={metrics.successful_conversion_notifications ?? 0} detail="Notifications that produced clicks" icon={Bell} accent="bg-coral" />
            <MetricCard title="Engagement Score" value={`${Math.round((metrics.engagement_score ?? 0) * 100)}%`} detail="Feedback engagement per notification" icon={CheckCircle2} accent="bg-blue-600" />
          </div>

          <section className="panel p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">Company API access</h2>
                <p className="muted mt-1">Use this bearer token when calling POST /decide, POST /feedback, and GET /metrics.</p>
              </div>
              <code className="max-w-full overflow-x-auto rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white">
                Authorization: Bearer {apiKey}
              </code>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="panel p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">Decision pipeline</h2>
                  <p className="muted">How each notification moves from request to worker queue.</p>
                </div>
                <Link className="btn-secondary" to="/notifications">View all</Link>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Behavior fetch", "Events are collected for the target user.", Activity],
                  ["Timing decision", "Rules classify the request as ready or scheduled.", Clock],
                  ["Async delivery", "Ready messages are handed to Celery for sending.", Bell],
                ].map(([title, copy, Icon]) => (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={title}>
                    <Icon className="h-5 w-5 text-signal" />
                    <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Latest decisions</h2>
              <div className="mt-4 space-y-3">
                {latestNotifications.length ? latestNotifications.map((notification) => (
                  <div className="rounded-lg border border-slate-200 p-3" key={notification.id}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{notification.message}</p>
                      <StatusBadge status={notification.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{notificationNextStep(notification)}</p>
                    <p className="mt-1 text-xs text-slate-500">{notification.user_id} <span aria-hidden="true">-&gt;</span> {formatDate(notification.scheduled_time)}</p>
                  </div>
                )) : <p className="muted">Create a notification to see decision outcomes here.</p>}
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Age demographics</h2>
              <p className="muted mt-1">User distribution by age band.</p>
              <div className="mt-5"><MiniBarChart data={demographics.age} /></div>
            </div>
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Country demographics</h2>
              <p className="muted mt-1">Where the company audience is active.</p>
              <div className="mt-5"><MiniBarChart data={demographics.country} /></div>
            </div>
            <div className="panel p-5">
              <h2 className="text-lg font-bold text-slate-950">Device demographics</h2>
              <p className="muted mt-1">Device mix for notification delivery.</p>
              <div className="mt-5"><MiniBarChart data={demographics.device} /></div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">User activity explorer</h2>
                <p className="muted mt-1">Switch between users to inspect what they open, click, and respond to over time.</p>
              </div>
              <select className="input min-w-64 max-w-xs" value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)}>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name || user.user_id} ({user.user_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                {selectedUser ? (
                  <div className="rounded-lg bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{selectedUser.name || selectedUser.user_id}</p>
                    <p className="mt-1 text-xs text-slate-500">{selectedUser.user_id}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Age</p>
                        <p className="mt-1 font-semibold text-slate-900">{selectedUser.age || "Unknown"}</p>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Country</p>
                        <p className="mt-1 font-semibold text-slate-900">{selectedUser.country || "Unknown"}</p>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Device</p>
                        <p className="mt-1 font-semibold text-slate-900">{selectedUser.device || "Unknown"}</p>
                      </div>
                      <div className="rounded-md bg-white p-3">
                        <p className="text-xs uppercase tracking-wide text-slate-400">Created</p>
                        <p className="mt-1 font-semibold text-slate-900">{formatDate(selectedUser.created_at)}</p>
                      </div>
                    </div>
                    {!selectedUserLoading && selectedUserAnalytics ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Events</p>
                          <p className="mt-1 text-2xl font-bold text-slate-950">{selectedUserAnalytics.total_events}</p>
                        </div>
                        <div className="rounded-md bg-white p-3">
                          <p className="text-xs uppercase tracking-wide text-slate-400">Notifications</p>
                          <p className="mt-1 text-2xl font-bold text-slate-950">{selectedUserAnalytics.total_notifications}</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                {selectedUserLoading ? <div className="mt-4"><Loading label="Loading user activity" /></div> : null}
                {selectedUserError ? <div className="mt-4"><Alert message={selectedUserError} /></div> : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(selectedUserAnalytics?.events || []).slice(0, 6).map((event) => (
                  <div className="rounded-lg border border-slate-200 p-3" key={event.id}>
                    <p className="text-sm font-semibold text-slate-900">{event.event}</p>
                    <p className="mt-2 text-xs text-slate-500">{formatDate(event.timestamp)}</p>
                  </div>
                ))}
                {!selectedUserLoading && !(selectedUserAnalytics?.events || []).length ? (
                  <p className="muted sm:col-span-2 lg:col-span-3">No activity found for this user yet.</p>
                ) : null}
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="text-lg font-bold text-slate-950">Recent user signals</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-5">
              {recentEvents.length ? recentEvents.map((event) => (
                <div className="rounded-lg bg-slate-50 p-3" key={event.id}>
                  <p className="text-sm font-semibold text-slate-900">{event.event}</p>
                  <p className="mt-1 text-xs text-slate-500">{event.user_id}</p>
                  <p className="mt-3 text-xs text-slate-400">{formatDate(event.timestamp)}</p>
                </div>
              )) : <p className="muted md:col-span-5">Record events to populate the live activity stream.</p>}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
