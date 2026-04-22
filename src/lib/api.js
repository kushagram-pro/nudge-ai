import axios from "axios";
import { API_BASE_URL } from "../config";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("nudgeai-company-auth") || localStorage.getItem("nudgeai-auth");
  if (raw) {
    try {
      const session = JSON.parse(raw);
      const apiKey = session.apiKey || session.api_key;
      if (apiKey) {
        config.headers.Authorization = `Bearer ${apiKey}`;
      }
    } catch {
      config.headers.Authorization = "Bearer nudge_demo_api_key_123";
    }
  } else {
    config.headers.Authorization = "Bearer nudge_demo_api_key_123";
  }
  return config;
});

function unwrapError(error) {
  const validationErrors = error?.response?.data?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length) {
    return validationErrors
      .map((item) => {
        const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "field";
        return `${field}: ${item.msg}`;
      })
      .join(". ");
  }

  return error?.response?.data?.detail || error?.response?.data?.message || error?.message || "Request failed";
}

export async function signupCompany(payload) {
  try {
    const { data } = await api.post("/companies/signup", payload);
    return data.data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function loginCompany(payload) {
  try {
    const { data } = await api.post("/companies/login", payload);
    return data.data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getUsers() {
  try {
    const { data } = await api.get("/users/");
    return data.users || [];
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function createUser(payload) {
  try {
    const { data } = await api.post("/users/", payload);
    return data.data || data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getEvents() {
  try {
    const { data } = await api.get("/events/");
    return data.events || [];
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function createEvent(payload) {
  try {
    const { data } = await api.post("/events/", payload);
    return data.data || data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getNotifications() {
  try {
    const { data } = await api.get("/notify/");
    return data.data || [];
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function createNotification(payload) {
  try {
    const { data } = await api.post("/notify/", payload);
    if (data.status === "error") {
      throw new Error(data.message);
    }
    return data.data || data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getEngagementAnalytics() {
  try {
    const { data } = await api.get("/analytics/engagement");
    return data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getUserAnalytics(userId) {
  try {
    const { data } = await api.get(`/analytics/user/${userId}`);
    return data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getCompanyMetrics() {
  try {
    const { data } = await api.get("/metrics/");
    return data.data || data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}

export async function getMockUser() {
  try {
    const { data } = await api.get("/mock/user");
    return data.data || data;
  } catch (error) {
    throw new Error(unwrapError(error));
  }
}
