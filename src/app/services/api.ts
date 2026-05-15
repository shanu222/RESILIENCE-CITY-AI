import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export interface AuthPayload {
  token: string;
  user: {
    id: string;
    email: string;
    displayName: string;
  };
}

export async function guestLogin(): Promise<AuthPayload> {
  const response = await api.post<AuthPayload>("/auth/guest");
  return response.data;
}

export async function register(email: string, password: string, displayName: string): Promise<AuthPayload> {
  const response = await api.post<AuthPayload>("/auth/register", { email, password, displayName });
  return response.data;
}

export async function login(email: string, password: string): Promise<AuthPayload> {
  const response = await api.post<AuthPayload>("/auth/login", { email, password });
  return response.data;
}

export async function loadCityState() {
  const response = await api.get<{ cityId: string; state: unknown }>("/game/state");
  return response.data;
}

export async function dispatchGameAction(cityId: string, action: unknown) {
  const response = await api.post<{ state: unknown }>("/game/action", { cityId, action });
  return response.data;
}

export async function saveCityState(cityId: string, state: unknown) {
  await api.post("/game/save", { cityId, state });
}
