import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setApiToken } from "../services/api";
import { disconnectSocket } from "../services/socket";

interface AuthState {
  token: string | null;
  user: null | {
    id: string;
    email: string;
    displayName: string;
  };
  cityId: string | null;
  ready: boolean;
  setAuth: (input: { token: string; user: { id: string; email: string; displayName: string } }) => void;
  setCityId: (cityId: string) => void;
  setReady: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      cityId: null,
      ready: false,
      setAuth: ({ token, user }) => {
        setApiToken(token);
        set({ token, user });
      },
      setCityId: (cityId) => set({ cityId }),
      setReady: (value) => set({ ready: value }),
      clear: () => {
        setApiToken(null);
        disconnectSocket();
        set({ token: null, user: null, cityId: null });
      },
    }),
    {
      name: "resilience-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiToken(state.token);
        }
      },
    }
  )
);
