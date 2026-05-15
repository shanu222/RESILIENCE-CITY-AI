import { useQuery } from "@tanstack/react-query";
import { api } from "../services/api";

interface PlayerProfileResponse {
  user: {
    id: string;
    email: string;
    displayName: string;
    provider: string;
  };
  activeCityId: string | null;
}

export function usePlayerProfile(enabled: boolean) {
  return useQuery({
    queryKey: ["player-profile"],
    queryFn: async () => {
      const response = await api.get<PlayerProfileResponse>("/player/profile");
      return response.data;
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
}
