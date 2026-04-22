import { statusTone } from "../../lib/format";

export default function StatusBadge({ status }) {
  const label = status || "pending";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusTone(label)}`}>
      {label}
    </span>
  );
}
