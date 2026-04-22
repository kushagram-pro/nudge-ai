export function formatDate(value) {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelativeFuture(value) {
  if (!value) return "No next action";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  if (diffMinutes <= 0) return "Due now";
  if (diffMinutes < 60) return `in ${diffMinutes} min`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `in ${diffHours} hr`;

  const diffDays = Math.round(diffHours / 24);
  return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
}

export function formatFullDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function notificationNextStep(notification) {
  if (!notification) return "No next step";
  if (notification.next_step) return notification.next_step;

  if (notification.status === "sent") {
    return "Already delivered";
  }

  if (notification.status === "ready") {
    return `Queued for delivery ${formatRelativeFuture(notification.scheduled_time)}`;
  }

  if (notification.status === "scheduled") {
    return `Scheduled ${formatRelativeFuture(notification.scheduled_time)}`;
  }

  return "Awaiting processing";
}

export function statusTone(status) {
  const tones = {
    ready: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    scheduled: "bg-amber-50 text-amber-700 ring-amber-200",
    sent: "bg-blue-50 text-blue-700 ring-blue-200",
    pending: "bg-slate-50 text-slate-700 ring-slate-200",
    failed: "bg-rose-50 text-rose-700 ring-rose-200",
  };
  return tones[status] || tones.pending;
}
