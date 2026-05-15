import { randomUUID } from "node:crypto";
import type { ServerAction, ServerGameState } from "./types";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createInitialServerState(regionId = "karachi-coastal"): ServerGameState {
  return {
    tick: 0,
    day: 1,
    hour: 8,
    mode: "campaign",
    regionId,
    budget: 4_000_000,
    resilienceScore: 52,
    sustainabilityScore: 48,
    engineeringScore: 44,
    climateScore: 45,
    riskScore: 64,
    citizens: {
      total: 12500,
      safe: 12500,
      injured: 0,
      displaced: 0,
      panic: 12,
      trust: 60,
      health: 76,
      happiness: 67,
    },
    buildings: [],
    climate: {
      temperatureC: 31,
      rainfallMm: 280,
      airQuality: 58,
      droughtIndex: 42,
      weather: "clear",
    },
    rescue: {
      sheltersOpen: 1,
      triageEfficiency: 45,
      activeOperation: false,
    },
    activeDisaster: null,
    warnings: ["City simulation initialized."],
    mentorLog: ["Start with resilient infrastructure before high-intensity disaster testing."],
  };
}

export function applyServerAction(state: ServerGameState, action: ServerAction): ServerGameState {
  switch (action.type) {
    case "tick": {
      const nextHour = (state.hour + 1) % 24;
      const nextDay = state.day + (nextHour === 0 ? 1 : 0);
      const panicDrift = state.activeDisaster ? 0.9 : -0.2;
      const disaster = state.activeDisaster
        ? {
            ...state.activeDisaster,
            elapsedTicks: state.activeDisaster.elapsedTicks + 1,
            impactedCitizens: clamp(
              state.activeDisaster.impactedCitizens + Math.round(state.activeDisaster.intensity * 13),
              0,
              state.citizens.total
            ),
            infrastructureDamage: clamp(
              state.activeDisaster.infrastructureDamage + state.activeDisaster.intensity * 1.9,
              0,
              100
            ),
          }
        : null;
      const disasterActive = disaster && disaster.elapsedTicks < disaster.durationTicks ? disaster : null;
      const conditionLoss = disasterActive ? disasterActive.intensity * 0.6 : 0.08;
      const buildings = state.buildings.map((building) => ({
        ...building,
        condition: clamp(building.condition - conditionLoss, 0, 100),
      }));
      const collapsed = buildings.filter((building) => building.condition < 15).length;
      const injuredDelta = (disasterActive?.intensity ?? 0) * 2 + collapsed * 8;
      const injured = clamp(state.citizens.injured + injuredDelta, 0, state.citizens.total);
      const displaced = clamp(state.citizens.displaced + collapsed * 6 + (disasterActive ? 4 : 0), 0, state.citizens.total);
      const safe = clamp(state.citizens.total - injured - displaced, 0, state.citizens.total);
      const weather =
        state.climate.airQuality < 45 ? "smog" : state.climate.rainfallMm > 780 ? "storm" : state.climate.rainfallMm > 520 ? "rain" : "clear";

      return {
        ...state,
        tick: state.tick + 1,
        day: nextDay,
        hour: nextHour,
        buildings,
        activeDisaster: disasterActive,
        climate: {
          ...state.climate,
          temperatureC: clamp(state.climate.temperatureC + (state.sustainabilityScore > 65 ? -0.1 : 0.2), 12, 48),
          rainfallMm: clamp(state.climate.rainfallMm + Math.sin(state.tick / 6) * 14, 25, 1100),
          airQuality: clamp(state.climate.airQuality + (state.sustainabilityScore > 60 ? 0.5 : -0.4), 15, 100),
          droughtIndex: clamp(state.climate.droughtIndex + (state.climate.rainfallMm < 200 ? 0.8 : -0.4), 0, 100),
          weather,
        },
        citizens: {
          ...state.citizens,
          injured,
          displaced,
          safe,
          panic: clamp(state.citizens.panic + panicDrift - state.rescue.triageEfficiency * 0.02, 0, 100),
          trust: clamp(state.citizens.trust + (state.rescue.activeOperation ? 0.2 : -0.05), 0, 100),
          health: clamp(state.citizens.health - injuredDelta * 0.015 + state.rescue.triageEfficiency * 0.02, 0, 100),
          happiness: clamp(state.citizens.happiness + (disasterActive ? -0.35 : 0.08), 0, 100),
        },
        engineeringScore: clamp(
          buildings.length > 0
            ? buildings.reduce((acc, building) => acc + building.structuralScore * (building.condition / 100), 0) /
                buildings.length
            : state.engineeringScore,
          0,
          100
        ),
        resilienceScore: clamp(
          state.engineeringScore * 0.35 +
            state.sustainabilityScore * 0.25 +
            state.citizens.trust * 0.2 +
            (100 - (disaster?.infrastructureDamage ?? 0)) * 0.2,
          0,
          100
        ),
        budget: Math.round(state.budget + 2800 - injuredDelta * 900 - (disasterActive ? 7500 : 1100)),
        warnings: [
          disasterActive
            ? `${disasterActive.type.toUpperCase()} active, impact ${Math.round(disasterActive.infrastructureDamage)}%.`
            : "No active disaster. Continue resilience upgrades.",
          ...state.warnings,
        ].slice(0, 6),
      };
    }
    case "set-mode":
      return { ...state, mode: action.payload };
    case "set-region":
      return {
        ...state,
        regionId: action.payload,
        warnings: [`Region switched to ${action.payload}.`, ...state.warnings].slice(0, 6),
      };
    case "build": {
      const costs: Record<string, number> = {
        "single-family": 120000,
        "elevated-home": 180000,
        "apartment-complex": 2500000,
        school: 1800000,
        hospital: 5000000,
        shelter: 800000,
        drainage: 300000,
        "flood-barrier": 450000,
        "solar-grid": 600000,
        "green-corridor": 150000,
      };
      const cost = costs[action.payload.templateId] ?? 200000;
      if (state.budget < cost) {
        return {
          ...state,
          warnings: ["Build blocked: insufficient budget.", ...state.warnings].slice(0, 6),
        };
      }
      const structural = clamp(45 + Math.random() * 40, 20, 95);
      const fire = clamp(40 + Math.random() * 45, 15, 98);
      const flood = clamp(35 + Math.random() * 50, 10, 99);
      const sustain = clamp(35 + Math.random() * 50, 10, 99);
      return {
        ...state,
        budget: state.budget - cost,
        buildings: [
          ...state.buildings,
          {
            id: randomUUID(),
            name: action.payload.name ?? action.payload.templateId,
            templateId: action.payload.templateId,
            condition: 100,
            structuralScore: structural,
            fireResistance: fire,
            floodResistance: flood,
            sustainability: sustain,
          },
        ],
        engineeringScore: clamp(state.engineeringScore + 1.2, 0, 100),
        sustainabilityScore: clamp(state.sustainabilityScore + 0.9, 0, 100),
        warnings: [`Construction completed: ${action.payload.name}.`, ...state.warnings].slice(0, 6),
      };
    }
    case "trigger-disaster":
      return {
        ...state,
        activeDisaster: {
          type: action.payload.disaster,
          intensity: clamp(action.payload.intensity, 1, 10),
          elapsedTicks: 0,
          durationTicks: 8 + action.payload.intensity,
          infrastructureDamage: 0,
          impactedCitizens: 0,
        },
        rescue: { ...state.rescue, activeOperation: true },
        warnings: [`${action.payload.disaster.toUpperCase()} simulation started.`, ...state.warnings].slice(0, 6),
      };
    case "run-rescue": {
      const boosts = {
        usar: { panic: -4.5, injured: -16, trust: 2.2, budget: -90000 },
        triage: { panic: -3.3, injured: -12, trust: 1.5, budget: -65000 },
        evacuate: { panic: -6.1, injured: -9, trust: 2.8, budget: -120000 },
        airlift: { panic: -4.2, injured: -19, trust: 2.4, budget: -160000 },
        fireline: { panic: -5.2, injured: -10, trust: 2.0, budget: -105000 },
      }[action.payload.operation];
      return {
        ...state,
        budget: state.budget + boosts.budget,
        citizens: {
          ...state.citizens,
          panic: clamp(state.citizens.panic + boosts.panic, 0, 100),
          injured: clamp(state.citizens.injured + boosts.injured, 0, state.citizens.total),
          trust: clamp(state.citizens.trust + boosts.trust, 0, 100),
        },
        rescue: {
          ...state.rescue,
          activeOperation: true,
          triageEfficiency: clamp(state.rescue.triageEfficiency + 3.6, 0, 100),
        },
        warnings: [`Rescue action executed: ${action.payload.operation}.`, ...state.warnings].slice(0, 6),
      };
    }
    case "load":
      return action.payload;
    default:
      return state;
  }
}
