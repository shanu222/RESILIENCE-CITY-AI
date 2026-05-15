export type DisasterType =
  | "earthquake"
  | "flood"
  | "urban_flooding"
  | "wildfire"
  | "heatwave"
  | "smog"
  | "cyclone"
  | "landslide"
  | "drought"
  | "storm_surge"
  | "infrastructure_failure"
  | "building_collapse";

export interface ServerGameState {
  tick: number;
  day: number;
  hour: number;
  mode: "campaign" | "sandbox";
  regionId: string;
  budget: number;
  resilienceScore: number;
  sustainabilityScore: number;
  engineeringScore: number;
  climateScore: number;
  riskScore: number;
  citizens: {
    total: number;
    safe: number;
    injured: number;
    displaced: number;
    panic: number;
    trust: number;
    health: number;
    happiness: number;
  };
  buildings: Array<{
    id: string;
    name: string;
    templateId: string;
    condition: number;
    structuralScore: number;
    fireResistance: number;
    floodResistance: number;
    sustainability: number;
  }>;
  climate: {
    temperatureC: number;
    rainfallMm: number;
    airQuality: number;
    droughtIndex: number;
    weather: "clear" | "rain" | "storm" | "smog";
  };
  rescue: {
    sheltersOpen: number;
    triageEfficiency: number;
    activeOperation: boolean;
  };
  activeDisaster: null | {
    type: DisasterType;
    intensity: number;
    elapsedTicks: number;
    durationTicks: number;
    infrastructureDamage: number;
    impactedCitizens: number;
  };
  warnings: string[];
  mentorLog: string[];
}

export type ServerAction =
  | { type: "tick" }
  | { type: "set-mode"; payload: "campaign" | "sandbox" }
  | { type: "set-region"; payload: string }
  | { type: "build"; payload: { templateId: string; name?: string } }
  | { type: "trigger-disaster"; payload: { disaster: DisasterType; intensity: number } }
  | { type: "run-rescue"; payload: { operation: "usar" | "triage" | "evacuate" | "airlift" | "fireline" } }
  | { type: "load"; payload: ServerGameState };
