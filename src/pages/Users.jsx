import { Plus, Users as UsersIcon } from "lucide-react";
import { useState } from "react";
import Alert from "../components/common/Alert";
import EmptyState from "../components/common/EmptyState";
import Loading from "../components/common/Loading";
import PageHeader from "../components/common/PageHeader";
import { createUser, getUsers } from "../lib/api";
import { formatFullDate } from "../lib/format";
import { useAsyncData } from "../hooks/useAsyncData";

export default function Users() {
  const { data: users = [], loading, error, refresh } = useAsyncData(getUsers, []);
  const [form, setForm] = useState({ user_id: "", name: "", age: "", country: "", device: "iOS" });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice("");
    setFormError("");
    if (!form.user_id.trim()) {
      setFormError("User ID is required.");
      return;
    }
    setSaving(true);
    try {
      await createUser({
        user_id: form.user_id.trim(),
        name: form.name.trim() || null,
        age: form.age ? Number(form.age) : null,
        country: form.country.trim() || null,
        device: form.device || null,
      });
      setForm({ user_id: "", name: "", age: "", country: "", device: "iOS" });
      setNotice("User created successfully.");
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
        eyebrow="Users"
        title="Customer profiles"
        description="Create and inspect users that NudgeAI can score for event history and notification timing."
      />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form className="panel h-fit space-y-4 p-5" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-lg font-bold text-slate-950">Create user</h2>
            <p className="muted mt-1">The backend expects a stable user_id plus an optional display name.</p>
          </div>
          <Alert message={notice} tone="success" />
          <Alert message={formError} />
          <div className="space-y-2">
            <label className="label" htmlFor="user_id">User ID</label>
            <input id="user_id" className="input" value={form.user_id} onChange={(event) => setForm((current) => ({ ...current, user_id: event.target.value }))} placeholder="u_1024" />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="name">Name</label>
            <input id="name" className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Aarav Mehta" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="label" htmlFor="age">Age</label>
              <input id="age" className="input" type="number" min="13" value={form.age} onChange={(event) => setForm((current) => ({ ...current, age: event.target.value }))} placeholder="27" />
            </div>
            <div className="space-y-2">
              <label className="label" htmlFor="device">Device</label>
              <select id="device" className="input" value={form.device} onChange={(event) => setForm((current) => ({ ...current, device: event.target.value }))}>
                <option>iOS</option>
                <option>Android</option>
                <option>Web</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="country">Country</label>
            <input id="country" className="input" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} placeholder="India" />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={saving}>
            <Plus className="h-4 w-4" />
            {saving ? "Creating..." : "Create user"}
          </button>
        </form>

        <section className="panel overflow-hidden">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-bold text-slate-950">All users</h2>
            <p className="muted mt-1">{users?.length || 0} profiles in the system</p>
          </div>
          {loading ? <Loading /> : null}
          {!loading && error ? <div className="p-5"><Alert message={error} /></div> : null}
          {!loading && !error && users.length === 0 ? (
            <div className="p-5"><EmptyState icon={UsersIcon} title="No users yet" description="Create your first profile to begin tracking behavior and notification decisions." /></div>
          ) : null}
          {!loading && !error && users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">User ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Age</th>
                    <th className="px-5 py-3">Country</th>
                    <th className="px-5 py-3">Device</th>
                    <th className="px-5 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr className="hover:bg-slate-50" key={user.user_id}>
                      <td className="px-5 py-4 font-semibold text-slate-900">{user.user_id}</td>
                      <td className="px-5 py-4 text-slate-600">{user.name || "Unnamed user"}</td>
                      <td className="px-5 py-4 text-slate-500">{user.age || "Unknown"}</td>
                      <td className="px-5 py-4 text-slate-500">{user.country || "Unknown"}</td>
                      <td className="px-5 py-4 text-slate-500">{user.device || "Unknown"}</td>
                      <td className="px-5 py-4 text-slate-500">{formatFullDate(user.created_at)}</td>
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
