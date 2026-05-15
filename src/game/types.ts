export type RegionId =
  | "karachi-coastal"
  | "lahore-urban"
  | "islamabad-hills"
  | "gilgit-mountain"
  | "swat-valley"
  | "thar-desert";

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

export type BuildingCategory = "residential" | "public" | "infrastructure";
export type HazardOverlay = "flood" | "seismic" | "drainage" | "heat" | "slope" | "infrastructure";
export type FoundationType = "raft" | "pile" | "strip" | "mat";
export type StructuralSystem = "moment-frame" | "shear-wall" | "braced-frame" | "masonry";
export type MaterialType = "reinforced-concrete" | "steel" | "timber" | "masonry";

export interface RegionProfile {
  id: RegionId;
  name: string;
  biome: string;
  seismicRisk: number;
  floodRisk: number;
  wildfireRisk: number;
  heatRisk: number;
  windRisk: number;
  droughtRisk: number;
  slopeRisk: number;
  baseRainfall: number;
  averageTemp: number;
  codeGuidance: string[];
}

export interface BuildingTemplate {
  id: string;
  name: string;
  category: BuildingCategory;
  cost: number;
  capacity: number;
  baseResilience: number;
  climateEfficiency: number;
  fireSafety: number;
  floodResistance: number;
  seismicResistance: number;
  description: string;
}

export interface BuildingInstance {
  id: string;
  templateId: string;
  name: string;
  category: BuildingCategory;
  condition: number;
  structuralScore: number;
  climateScore: number;
  safetyScore: number;
  occupancy: number;
  resilientFeatures: string[];
  districtId: string;
  blueprint: BuildingBlueprint;
  failure: {
    crack: number;
    settlement: number;
    thermal: number;
    fire: number;
    resonance: number;
    lean: number;
  };
}

export interface BuildingBlueprint {
  foundation: FoundationType;
  structuralSystem: StructuralSystem;
  material: MaterialType;
  reinforcementLevel: number;
  drainageCapacity: number;
  exits: number;
  utilityResilience: number;
  floorCount: number;
  roomDensity: number;
}

export interface MissionObjective {
  id: string;
  text: string;
  done: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  reward: number;
  timeLimitMinutes: number;
  status: "locked" | "available" | "active" | "completed" | "failed";
  progress: number;
  objectives: MissionObjective[];
  tags: string[];
}

export interface ActiveDisaster {
  type: DisasterType;
  intensity: number;
  durationTicks: number;
  elapsedTicks: number;
  impactedCitizens: number;
  infrastructureDamage: number;
}

export interface ClimateState {
  temperatureC: number;
  rainfallMm: number;
  airQuality: number;
  droughtIndex: number;
  seaLevelStress: number;
  urbanHeat: number;
  weather: "clear" | "rain" | "storm" | "smog" | "fog" | "heatwave";
  windKph: number;
  lightningRisk: number;
  seaLevelRiseCm: number;
}

export interface CitizenState {
  total: number;
  safe: number;
  injured: number;
  displaced: number;
  panic: number;
  trust: number;
  health: number;
  happiness: number;
  resilienceAwareness: number;
  evacuationCompliance: number;
  survivalProbability: number;
}

export interface RescueState {
  ambulances: number;
  fireUnits: number;
  drones: number;
  helicopters: number;
  sheltersOpen: number;
  activeOperation: boolean;
  triageEfficiency: number;
  resourceFuel: number;
  commandLatency: number;
  teamsDeployed: number;
  blockedRoutes: number;
  unitReadiness: number;
}

export interface CitizenAgent {
  id: string;
  districtId: string;
  homeDistrictId: string;
  workplaceDistrictId: string;
  health: number;
  panic: number;
  mobility: number;
  awareness: number;
  trust: number;
  evacuated: boolean;
  trapped: boolean;
}

export interface DistrictState {
  id: string;
  name: string;
  center: [number, number];
  polygon: [number, number][];
  terrain: "coastal" | "urban" | "hills" | "river" | "industrial";
  populationDensity: number;
  infrastructureCondition: number;
  hazardExposure: {
    flood: number;
    seismic: number;
    drainage: number;
    heat: number;
    slope: number;
    wildfire: number;
  };
  dynamic: {
    waterLevel: number;
    smoke: number;
    fireIntensity: number;
    trafficLoad: number;
    powerStability: number;
    isolation: number;
  };
}

export interface EconomyState {
  taxesPerTick: number;
  maintenanceCost: number;
  repairCost: number;
  energyDemand: number;
  waterDemand: number;
  powerGridHealth: number;
  waterSystemHealth: number;
  roadHealth: number;
}

export interface LearningState {
  engineeringXP: number;
  skillLevel: number;
  certifications: string[];
  labsCompleted: string[];
  professionalMode: boolean;
}

export interface MapState {
  center: [number, number];
  zoom: number;
  selectedDistrictId: string;
  activeOverlay: HazardOverlay;
}

export interface GameState {
  tick: number;
  day: number;
  hour: number;
  mode: "campaign" | "sandbox";
  region: RegionProfile;
  budget: number;
  resilienceScore: number;
  sustainabilityScore: number;
  engineeringScore: number;
  climateScore: number;
  riskScore: number;
  buildings: BuildingInstance[];
  missions: Mission[];
  activeDisaster: ActiveDisaster | null;
  climate: ClimateState;
  citizens: CitizenState;
  rescue: RescueState;
  economy: EconomyState;
  learning: LearningState;
  map: MapState;
  districts: DistrictState[];
  citizenAgents: CitizenAgent[];
  warnings: string[];
  mentorLog: string[];
  unlockedTech: string[];
  multiplayer: {
    enabled: boolean;
    teammateCount: number;
    coordinationScore: number;
  };
}
