import { Filter, MousePointerClick, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import { EVENT_TYPES } from "../config";
import { createEvent, getEvents, getUsers } from "../lib/api";
import { formatFullDate } from "../lib/format";
import { useAsyncData } from "../hooks/useAsyncData";

async function loadEventsPage() {
  const [events, users] = await Promise.all([getEvents(), getUsers()]);
  return { events, users };
}

export default function Events() {
  const { data, loading, error, refresh } = useAsyncData(loadEventsPage, []);
  const [form, setForm] = useState({ user_id: "", event: "app_open" });
  const [filter, setFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const events = useMemo(() => data?.events || [], [data?.events]);
  const users = data?.users || [];
  const filteredEvents = useMemo(() => {
    if (filter === "all") return events;
    return events.filter((event) => event.user_id === filter);
  }, [events, filter]);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setFormError("");
    if (!form.user_id.trim()) {
      setFormError("Choose a user or enter a user_id before recording an event.");
      return;
    }
    setSaving(true);
    try {
      await createEvent({
        user_id: form.user_id.trim(),
        event: form.event,
        timestamp: new Date().toISOString(),
      });
      setNotice("Event recorded successfully.");
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
        eyebrow="Events"
        title="Behavior event stream"
        description="Record app opens, clicks, and engagement moments that feed the notification timing engine."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="panel h-fit space-y-4 p-5" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Add event</h2>
            <p className="muted mt-1">Events are timestamped now and sent to POST /events/.</p>
          </div>
          <Alert message={notice} tone="success" />
          <Alert message={formError} />
          <div className="space-y-2">
            <label className="label" htmlFor="user_id">User ID</label>
            <input
              id="user_id"
              className="input"
              list="event-users"
              value={form.user_id}
              onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))}
              placeholder="u_1024"
            />
            <datalist id="event-users">
              {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.name}</option>)}
            </datalist>
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="event">Event type</label>
            <select id="event" className="input" value={form.event} onChange={(event) => setForm((current) => ({ ...current, event: event.target.value }))}>
              {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? "Recording..." : "Record event"}
          </button>
        </form>

        <section className="panel overflow-hidden">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Events</h2>
              <p className="muted mt-1">{filteredEvents.length} visible events</p>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Filter className="h-4 w-4" />
              <select className="input min-w-44 py-2" value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">All users</option>
                {users.map((user) => <option key={user.user_id} value={user.user_id}>{user.user_id}</option>)}
              </select>
            </label>
          </div>
          {loading ? <Loading /> : null}
          {!loading && error ? <div className="p-5"><Alert message={error} /></div> : null}
          {!loading && !error && filteredEvents.length === 0 ? (
            <div className="p-5"><EmptyState icon={MousePointerClick} title="No events found" description="Record a behavior event to begin building user activity context." /></div>
          ) : null}
          {!loading && !error && filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">User ID</th>
                    <th className="px-5 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEvents.map((event) => (
                    <tr className="hover:bg-slate-50" key={event.id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">{event.event}</td>
                      <td className="px-5 py-4 text-slate-600">{event.user_id}</td>
                      <td className="px-5 py-4 text-slate-500">{formatFullDate(event.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </>
  );
}
