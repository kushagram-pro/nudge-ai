import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import StatusBadge from "../components/common/StatusBadge";
import { NOTIFICATION_TYPES } from "../config";
import { createNotification, getNotifications, getUsers } from "../lib/api";
import { formatFullDate, notificationNextStep } from "../lib/format";
import { useAsyncData } from "../hooks/useAsyncData";

async function loadNotificationsPage() {
  const [notifications, users] = await Promise.all([getNotifications(), getUsers()]);
  return { notifications, users };
}

export default function Notifications() {
  const { data, loading, error, refresh } = useAsyncData(loadNotificationsPage, []);
  const [form, setForm] = useState({ user_id: "", message: "", type: "general" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const notifications = data?.notifications || [];
  const users = data?.users || [];
  const upcomingNotifications = notifications
    .filter((notification) => notification.status === "ready" || notification.status === "scheduled")
    .slice()
    .sort((left, right) => new Date(left.scheduled_time) - new Date(right.scheduled_time))
    .slice(0, 4);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setFormError("");
    if (!form.user_id.trim() || !form.message.trim()) {
      setFormError("User ID and message are required.");
      return;
    }
    setSaving(true);
    try {
      const created = await createNotification({
        user_id: form.user_id.trim(),
        message: form.message.trim(),
        type: form.type,
      });
      setForm((current) => ({ ...current, message: "" }));
      setNotice(`Decision engine marked this notification as ${created.status}.`);
      await refresh();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Timing decisions"
        description="Create notification requests and see whether the backend sends now or schedules based on user behavior context."
      />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form className="panel h-fit space-y-4 p-5" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Create notification</h2>
            <p className="muted mt-1">The decision engine returns ready or scheduled, then ready items flow to Celery.</p>
          </div>
          <Alert message={notice} tone="success" />
          <Alert message={formError} />
          <div className="space-y-2">
            <label className="label" htmlFor="notify_user_id">User ID</label>
            <input
              id="notify_user_id"
              className="input"
              list="notification-users"
              value={form.user_id}
              onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
              placeholder="u_1024"
            />
            <datalist id="notification-users">
              {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.name}</option>)}
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="message">Message</label>
            <textarea
              id="message"
              className="input min-h-28 resize-y"
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              placeholder="Your evening streak is waiting. Open the app to finish today's goal."
            />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="type">Type</label>
            <select id="type" className="input" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
              {NOTIFICATION_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? "Evaluating..." : "Evaluate notification"}
          </button>
        </form>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">Notification log</h2>
            <p className="muted mt-1">Ready, scheduled, and sent states are color coded for fast scanning. The next steps queue shows what will happen next.</p>
          </div>
          {loading ? <Loading /> : null}
          {!loading && error ? <div className="p-5"><Alert message={error} /></div> : null}
          {!loading && !error && notifications.length === 0 ? (
            <div className="p-5"><EmptyState icon={Bell} title="No notifications yet" description="Send a request through the decision engine to see status, schedule, and payload data here." /></div>
          ) : null}
          {!loading && !error && notifications.length > 0 ? (
            <div>
              <div className="border-b border-slate-200 bg-slate-50/60 p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Next steps</h3>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  {upcomingNotifications.map((notification) => (
                    <div className="rounded-lg border border-slate-200 bg-white p-4" key={`next-${notification.id}`}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-slate-900">{notification.message}</p>
                        <StatusBadge status={notification.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{notificationNextStep(notification)}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatFullDate(notification.scheduled_time)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Message</th>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Next Step</th>
                    <th className="px-5 py-3">Scheduled Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {notifications.slice().reverse().map((notification) => (
                    <tr className="hover:bg-slate-50" key={notification.id}>
                      <td className="max-w-sm px-5 py-4">
                        <p className="line-clamp-2 font-semibold text-slate-900">{notification.message}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">{notification.user_id}</td>
                      <td className="px-5 py-4 text-slate-600">{notification.type}</td>
                      <td className="px-5 py-4"><StatusBadge status={notification.status} /></td>
                      <td className="px-5 py-4 text-slate-600">{notificationNextStep(notification)}</td>
                      <td className="px-5 py-4 text-slate-500">{formatFullDate(notification.scheduled_time)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
