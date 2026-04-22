import { AlertCircle } from "lucide-react";

export default function Alert({ message, tone = "error" }) {
  if (!message) return null;

  const tones = {
    error: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className={`flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm ${tones[tone]}`}>
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
