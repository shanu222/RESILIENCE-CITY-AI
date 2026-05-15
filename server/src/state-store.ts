import { prisma } from "./lib/prisma";
import { createInitialServerState } from "./sim/engine";
import type { ServerAction, ServerGameState } from "./sim/types";
import { applyServerAction } from "./sim/engine";

const cityCache = new Map<string, ServerGameState>();

export async function getOrCreateCityState(userId: string): Promise<{ cityId: string; state: ServerGameState }> {
  const existing = await prisma.city.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (existing) {
    const state = existing.gameStateJson as unknown as ServerGameState;
    cityCache.set(existing.id, state);
    return { cityId: existing.id, state };
  }
  const initial = createInitialServerState();
  const city = await prisma.city.create({
    data: {
      userId,
      name: "Primary Resilience City",
      regionId: initial.regionId,
      mode: initial.mode,
      budget: initial.budget,
      resilienceScore: initial.resilienceScore,
      sustainability: initial.sustainabilityScore,
      engineering: initial.engineeringScore,
      climateScore: initial.climateScore,
      riskScore: initial.riskScore,
      tick: initial.tick,
      day: initial.day,
      hour: initial.hour,
      gameStateJson: initial as unknown as object,
    },
  });
  cityCache.set(city.id, initial);
  return { cityId: city.id, state: initial };
}

export async function persistState(cityId: string, state: ServerGameState): Promise<void> {
  cityCache.set(cityId, state);
  await prisma.city.update({
    where: { id: cityId },
    data: {
      regionId: state.regionId,
      mode: state.mode,
      budget: Math.round(state.budget),
      resilienceScore: state.resilienceScore,
      sustainability: state.sustainabilityScore,
      engineering: state.engineeringScore,
      climateScore: state.climateScore,
      riskScore: state.riskScore,
      tick: state.tick,
      day: state.day,
      hour: state.hour,
      gameStateJson: state as unknown as object,
    },
  });
}

export async function dispatchAndPersist(
  cityId: string,
  state: ServerGameState,
  action: ServerAction
): Promise<ServerGameState> {
  const next = applyServerAction(state, action);
  await persistState(cityId, next);
  return next;
}

export function getCachedState(cityId: string): ServerGameState | null {
  return cityCache.get(cityId) ?? null;
}
