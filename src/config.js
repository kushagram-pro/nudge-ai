export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "http://localhost:8000" : "/api");

export const EVENT_TYPES = ["app_open", "click", "page_view", "purchase", "notification_open"];

export const NOTIFICATION_TYPES = ["general", "reminder", "promotion", "engagement", "retention"];
