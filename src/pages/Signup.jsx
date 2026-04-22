import { BrainCircuit } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Alert from "../components/common/Alert";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  function validateForm() {
    if (!form.name.trim()) {
      return "Enter your company name.";
    }

    if (!form.email.trim()) {
      return "Enter your company email.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(form.email)) {
      return "Enter a valid email address.";
    }

    if (!form.password) {
      return "Create a password.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setLoading(true);
    try {
      await signup(form);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-mist px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-signal text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">Create your company workspace</h1>
          <p className="mt-2 text-sm text-slate-500">Get a tenant API key and access your notification intelligence dashboard.</p>
        </div>
        <form className="panel space-y-4 p-6 sm:p-8" onSubmit={handleSubmit}>
          <Alert message={error} />
          <div className="space-y-2">
            <label className="label" htmlFor="name">Company name</label>
            <input id="name" className="input" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" className="input" type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
          </div>
          <button className="btn-primary w-full" type="submit" disabled={loading}>{loading ? "Creating..." : "Create company"}</button>
          <p className="text-center text-sm text-slate-500">
            Already have access? <Link className="font-semibold text-signal hover:text-teal-800" to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </main>
  );
}
