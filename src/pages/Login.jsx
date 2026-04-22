import { BellRing } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "demo@nudgeai.dev", password: "password" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!form.email || !form.password) {
      setError("Enter an email and password to continue.");
      return;
    }
    setLoading(true);
    try {
      await login(form);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-mist lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-ink text-white">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-950">NudgeAI</p>
              <p className="text-sm text-slate-500">Context-aware notifications</p>
            </div>
          </div>

          <div className="panel p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-slate-950">Welcome back</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Sign in to your company workspace to monitor API usage, decisions, and customer engagement.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <Alert message={error} />
              <div className="space-y-2">
                <label className="label" htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@company.com"
                />
              </div>
              <div className="space-y-2">
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? "Logging in..." : "Log in"}</button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-500">
              New company? <Link className="font-semibold text-signal hover:text-teal-800" to="/signup">Create an account</Link>
            </p>
          </div>
        </div>
      </section>

      <section className="hidden bg-ink px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-200">Company API portal</p>
          <h2 className="mt-4 text-5xl font-bold leading-tight">Your notification intelligence API, measured in one place.</h2>
          <p className="mt-5 text-base leading-7 text-slate-300">
            NudgeAI observes behavior events, scores timing context, and routes each message through a send-or-schedule decision before it reaches the worker queue.
          </p>
        </div>
        <div className="grid max-w-2xl grid-cols-3 gap-4">
          {[
            ["recently active", "hold"],
            ["healthy window", "send"],
            ["inactive too long", "schedule"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-white/10 bg-white/10 p-4" key={label}>
              <p className="text-xs uppercase tracking-wide text-slate-300">{label}</p>
              <p className="mt-2 text-2xl font-bold capitalize">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
