import { BUILDING_TEMPLATES, CAMPAIGN_MISSIONS, getRegionById } from "./data";
import { DEFAULT_DISTRICTS } from "./map-data";
import type {
  ActiveDisaster,
  BuildingBlueprint,
  BuildingInstance,
  DisasterType,
  GameState,
  HazardOverlay,
  Mission,
  RegionId,
} from "./types";

const SAVE_VERSION = 2;
const STORAGE_KEY = "resilience-city-ai-save-v2";
const TICK_SECONDS = 4;

export type GameAction =
  | { type: "tick" }
  | { type: "set-mode"; payload: GameState["mode"] }
  | { type: "set-region"; payload: RegionId }
  | {
      type: "build";
      payload: { templateId: string; districtId?: string; blueprint?: Partial<BuildingBlueprint> };
    }
  | { type: "trigger-disaster"; payload: { disaster: DisasterType; intensity: number } }
  | { type: "run-rescue"; payload: "usar" | "triage" | "evacuate" | "airlift" | "fireline" }
  | { type: "toggle-multiplayer" }
  | { type: "add-teammate" }
  | { type: "start-mission"; payload: { missionId: string } }
  | { type: "select-district"; payload: { districtId: string } }
  | { type: "set-overlay"; payload: { overlay: HazardOverlay } }
  | { type: "toggle-professional-mode" }
  | { type: "load"; payload: GameState }
  | { type: "reset" };

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function appendLog(state: GameState, line: string): string[] {
  return [line, ...state.mentorLog].slice(0, 10);
}

function defaultBlueprint(partial?: Partial<BuildingBlueprint>): BuildingBlueprint {
  return {
    foundation: partial?.foundation ?? "raft",
    structuralSystem: partial?.structuralSystem ?? "moment-frame",
    material: partial?.material ?? "reinforced-concrete",
    reinforcementLevel: partial?.reinforcementLevel ?? 60,
    drainageCapacity: partial?.drainageCapacity ?? 50,
    exits: partial?.exits ?? 2,
    utilityResilience: partial?.utilityResilience ?? 50,
    floorCount: partial?.floorCount ?? 3,
    roomDensity: partial?.roomDensity ?? 55,
  };
}

function weatherByClimate(state: GameState): GameState["climate"]["weather"] {
  if (state.climate.airQuality < 42) return "smog";
  if (state.climate.temperatureC > 37) return "heatwave";
  if (state.climate.rainfallMm > 980) return "storm";
  if (state.climate.rainfallMm > 740) return "rain";
  if (state.climate.rainfallMm < 150 && state.climate.airQuality < 50) return "fog";
  return "clear";
}

function riskFromRegion(regionId: RegionId): number {
  const region = getRegionById(regionId);
  return Math.round(
    ((region.seismicRisk +
      region.floodRisk +
      region.wildfireRisk +
      region.heatRisk +
      region.windRisk +
      region.droughtRisk +
      region.slopeRisk) /
      7) *
      100
  );
}

function createCitizenAgents(count: number): GameState["citizenAgents"] {
  const districtIds = DEFAULT_DISTRICTS.map((district) => district.id);
  return Array.from({ length: count }).map((_, index) => {
    const homeDistrictId = districtIds[index % districtIds.length];
    const workplaceDistrictId = districtIds[(index * 3 + 2) % districtIds.length];
    return {
      id: uid("cit"),
      districtId: homeDistrictId,
      homeDistrictId,
      workplaceDistrictId,
      health: 80 + (index % 20) * 0.8,
      panic: 12 + (index % 6),
      mobility: 45 + (index % 50),
      awareness: 30 + (index % 55),
      trust: 50 + (index % 35),
      evacuated: false,
      trapped: false,
    };
  });
}

function createBuilding(
  templateId: string,
  regionId: RegionId,
  districtId: string,
  blueprintInput?: Partial<BuildingBlueprint>
): BuildingInstance | null {
  const template = BUILDING_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return null;
  const blueprint = defaultBlueprint(blueprintInput);
  const region = getRegionById(regionId);
  const district = DEFAULT_DISTRICTS.find((item) => item.id === districtId) ?? DEFAULT_DISTRICTS[0];
  const engineeringFactor =
    blueprint.reinforcementLevel * 0.32 +
    blueprint.utilityResilience * 0.08 +
    blueprint.drainageCapacity * 0.18 +
    blueprint.exits * 3 +
    (blueprint.foundation === "pile" ? 8 : 2) +
    (blueprint.structuralSystem === "shear-wall" ? 7 : 0);
  const hazardPenalty =
    district.hazardExposure.seismic * (1 - template.seismicResistance) * 0.15 +
    district.hazardExposure.flood * (1 - template.floodResistance) * 0.1 +
    region.heatRisk * 100 * (1 - template.climateEfficiency) * 0.05;
  const structuralScore = clamp(template.baseResilience * 100 + engineeringFactor - hazardPenalty, 12, 99);
  const climateScore = clamp(
    template.climateEfficiency * 100 +
      blueprint.utilityResilience * 0.25 +
      (blueprint.material === "timber" ? 6 : 0) -
      district.hazardExposure.heat * 0.1,
    10,
    99
  );
  const safetyScore = clamp(
    template.fireSafety * 100 + blueprint.exits * 4 + blueprint.reinforcementLevel * 0.18 - district.hazardExposure.wildfire * 0.12,
    8,
    99
  );
  return {
    id: uid("b"),
    templateId: template.id,
    name: template.name,
    category: template.category,
    condition: 100,
    structuralScore,
    climateScore,
    safetyScore,
    occupancy: template.capacity,
    districtId,
    blueprint,
    resilientFeatures: [
      blueprint.foundation,
      blueprint.structuralSystem,
      blueprint.material,
      blueprint.drainageCapacity > 65 ? "advanced-drainage" : "basic-drainage",
    ],
    failure: {
      crack: 0,
      settlement: 0,
      thermal: 0,
      fire: 0,
      resonance: 0,
      lean: 0,
    },
  };
}

function impactFromDisaster(disaster: ActiveDisaster): number {
  return disaster.intensity * (0.75 + disaster.elapsedTicks / 22);
}

function missionProgress(state: GameState, mission: Mission): Mission {
  const buildingNames = new Set(state.buildings.map((building) => building.name));
  const objectives = mission.objectives.map((objective) => {
    if (objective.id === "m1o1" && buildingNames.has("Emergency Hospital")) return { ...objective, done: true };
    if (objective.id === "m1o2" && state.engineeringScore > 65) return { ...objective, done: true };
    if (objective.id === "m1o3" && state.citizens.injured < state.citizens.total * 0.02) return { ...objective, done: true };
    if (objective.id === "m2o1" && state.buildings.filter((item) => item.name === "Drainage System").length >= 2)
      return { ...objective, done: true };
    if (objective.id === "m2o2" && state.buildings.some((item) => item.name === "Flood Barrier")) return { ...objective, done: true };
    if (objective.id === "m2o3" && state.activeDisaster?.type === "flood" && state.activeDisaster.elapsedTicks > 6)
      return { ...objective, done: true };
    if (objective.id === "m3o1" && state.rescue.sheltersOpen >= 2) return { ...objective, done: true };
    if (objective.id === "m3o2" && state.rescue.activeOperation) return { ...objective, done: true };
    if (objective.id === "m3o3" && state.citizens.panic < 35) return { ...objective, done: true };
    if (objective.id === "m4o2" && state.resilienceScore > 80) return { ...objective, done: true };
    if (objective.id === "m4o3" && state.citizens.trust > 75) return { ...objective, done: true };
    return objective;
  });
  const progress = objectives.filter((item) => item.done).length / objectives.length;
  return {
    ...mission,
    objectives,
    progress,
    status: progress >= 1 ? "completed" : mission.status,
  };
}

function summarizeCitizens(state: GameState, agents: GameState["citizenAgents"]): GameState["citizens"] {
  const injured = agents.filter((item) => item.health < 35).length;
  const trapped = agents.filter((item) => item.trapped).length;
  const evacuated = agents.filter((item) => item.evacuated).length;
  const panicAvg = agents.reduce((acc, item) => acc + item.panic, 0) / agents.length;
  const trustAvg = agents.reduce((acc, item) => acc + item.trust, 0) / agents.length;
  const healthAvg = agents.reduce((acc, item) => acc + item.health, 0) / agents.length;
  const awarenessAvg = agents.reduce((acc, item) => acc + item.awareness, 0) / agents.length;
  const safe = clamp(state.citizens.total - injured - trapped, 0, state.citizens.total);
  return {
    ...state.citizens,
    injured,
    displaced: trapped,
    safe,
    panic: clamp(panicAvg, 0, 100),
    trust: clamp(trustAvg, 0, 100),
    health: clamp(healthAvg, 0, 100),
    resilienceAwareness: clamp(awarenessAvg, 0, 100),
    evacuationCompliance: clamp(agents.filter((item) => item.evacuated).length / agents.length * 100, 0, 100),
    survivalProbability: clamp((safe + evacuated * 0.5) / state.citizens.total * 100, 0, 100),
  };
}

export function createInitialState(): GameState {
  const region = getRegionById("karachi-coastal");
  return {
    tick: 0,
    day: 1,
    hour: 8,
    mode: "campaign",
    region,
    budget: 4_000_000,
    resilienceScore: 52,
    sustainabilityScore: 48,
    engineeringScore: 42,
    climateScore: 46,
    riskScore: riskFromRegion(region.id),
    buildings: [],
    missions: CAMPAIGN_MISSIONS,
    activeDisaster: null,
    climate: {
      temperatureC: region.averageTemp,
      rainfallMm: region.baseRainfall,
      airQuality: 58,
      droughtIndex: region.droughtRisk * 100,
      seaLevelStress: region.id === "karachi-coastal" ? 65 : 18,
      urbanHeat: 38,
      weather: "clear",
      windKph: 19,
      lightningRisk: 24,
      seaLevelRiseCm: 2,
    },
    citizens: {
      total: 12500,
      safe: 12500,
      injured: 0,
      displaced: 0,
      panic: 14,
      trust: 62,
      health: 75,
      happiness: 68,
      resilienceAwareness: 40,
      evacuationCompliance: 35,
      survivalProbability: 92,
    },
    rescue: {
      ambulances: 6,
      fireUnits: 5,
      drones: 8,
      helicopters: 2,
      sheltersOpen: 1,
      activeOperation: false,
      triageEfficiency: 44,
      resourceFuel: 78,
      commandLatency: 24,
      teamsDeployed: 0,
      blockedRoutes: 1,
      unitReadiness: 71,
    },
    economy: {
      taxesPerTick: 5000,
      maintenanceCost: 2000,
      repairCost: 0,
      energyDemand: 52,
      waterDemand: 48,
      powerGridHealth: 74,
      waterSystemHealth: 71,
      roadHealth: 69,
    },
    learning: {
      engineeringXP: 0,
      skillLevel: 1,
      certifications: [],
      labsCompleted: [],
      professionalMode: false,
    },
    map: {
      center: [24.88, 67.06],
      zoom: 11,
      selectedDistrictId: DEFAULT_DISTRICTS[0].id,
      activeOverlay: "flood",
    },
    districts: DEFAULT_DISTRICTS,
    citizenAgents: createCitizenAgents(360),
    warnings: ["Monsoon pressure is rising; drainage capacity is currently low."],
    mentorLog: [
      "Welcome, Commander. Balance engineering quality, climate adaptation, and citizen safety.",
      "Use district overlays to identify weak infrastructure before hazard tests.",
    ],
    unlockedTech: ["base-materials", "manual-drainage", "basic-triage"],
    multiplayer: { enabled: false, teammateCount: 1, coordinationScore: 50 },
  };
}

function withTick(state: GameState): GameState {
  const nextHour = (state.hour + 1) % 24;
  const nextDay = state.day + (nextHour === 0 ? 1 : 0);
  const climateTrend = state.tick / 1400;
  const rainfallNoise = Math.sin(state.tick / 7) * 24 + Math.cos(state.tick / 17) * 18;
  const windNoise = 4 + Math.sin(state.tick / 5) * 7;

  let activeDisaster = state.activeDisaster;
  let warnings = [...state.warnings];
  let disasterImpact = 0;
  if (activeDisaster) {
    disasterImpact = impactFromDisaster(activeDisaster);
    activeDisaster = {
      ...activeDisaster,
      elapsedTicks: activeDisaster.elapsedTicks + 1,
      impactedCitizens: Math.min(state.citizens.total, activeDisaster.impactedCitizens + Math.round(disasterImpact * 9)),
      infrastructureDamage: clamp(activeDisaster.infrastructureDamage + disasterImpact * 0.75, 0, 100),
    };
    if (activeDisaster.elapsedTicks >= activeDisaster.durationTicks) {
      warnings = [`${activeDisaster.type.toUpperCase()} event ended. Launch recovery audits.`, ...warnings].slice(0, 6);
      activeDisaster = null;
    }
  }

  const climate = {
    ...state.climate,
    temperatureC: clamp(
      state.region.averageTemp + state.climate.urbanHeat * 0.03 + climateTrend * 2.4 + Math.sin(state.tick / 12) * 1.8,
      8,
      52
    ),
    rainfallMm: clamp(state.region.baseRainfall + rainfallNoise + state.region.floodRisk * 140 + climateTrend * 120, 20, 1400),
    airQuality: clamp(state.climate.airQuality + (state.sustainabilityScore > 60 ? 0.7 : -0.8) - disasterImpact * 0.12, 10, 100),
    droughtIndex: clamp(state.climate.droughtIndex + (state.climate.rainfallMm < 220 ? 0.9 : -0.4) + climateTrend * 0.3, 0, 100),
    seaLevelStress: clamp(state.climate.seaLevelStress + 0.05 + climateTrend * 0.01, 0, 100),
    urbanHeat: clamp(state.climate.urbanHeat + (state.sustainabilityScore > 68 ? -0.45 : 0.35), 0, 100),
    windKph: clamp(state.climate.windKph + windNoise, 4, 135),
    lightningRisk: clamp((state.climate.rainfallMm / 14 + state.climate.windKph / 2) * 0.5, 5, 100),
    seaLevelRiseCm: clamp(state.climate.seaLevelRiseCm + 0.02, 0, 400),
    weather: state.climate.weather,
  };

  const districts = state.districts.map((district) => {
    const floodGain = climate.rainfallMm > 700 ? 0.75 + district.hazardExposure.flood * 0.01 : -0.45;
    const fireGain =
      climate.temperatureC > 35 ? 0.42 + district.hazardExposure.wildfire * 0.008 : -0.25;
    const smokeGain = district.dynamic.fireIntensity > 20 ? 0.5 : -0.2;
    const trafficGain = activeDisaster ? 1.4 + district.dynamic.isolation * 0.03 : -0.2;
    const infraLoss = activeDisaster ? disasterImpact * 0.14 : -0.04;
    return {
      ...district,
      infrastructureCondition: clamp(district.infrastructureCondition - infraLoss - state.economy.maintenanceCost / 240000, 10, 100),
      dynamic: {
        ...district.dynamic,
        waterLevel: clamp(district.dynamic.waterLevel + floodGain, 0, 100),
        fireIntensity: clamp(district.dynamic.fireIntensity + fireGain, 0, 100),
        smoke: clamp(district.dynamic.smoke + smokeGain + climate.windKph * 0.01, 0, 100),
        trafficLoad: clamp(district.dynamic.trafficLoad + trafficGain, 5, 100),
        powerStability: clamp(district.dynamic.powerStability - (activeDisaster ? 0.8 : -0.06), 0, 100),
        isolation: clamp(
          district.dynamic.isolation +
            (district.dynamic.waterLevel > 55 || district.dynamic.fireIntensity > 50 ? 1.2 : -0.3),
          0,
          100
        ),
      },
    };
  });

  const buildingDistrictMap = new Map(districts.map((district) => [district.id, district]));
  const buildings = state.buildings.map((building) => {
    const district = buildingDistrictMap.get(building.districtId);
    const crackGain = (disasterImpact * 0.18 + (district?.dynamic.waterLevel ?? 0) * 0.02) * (1 - building.structuralScore / 120);
    const settlementGain = ((district?.dynamic.waterLevel ?? 0) * 0.014 + (district?.hazardExposure.slope ?? 0) * 0.012) *
      (building.blueprint.foundation === "pile" ? 0.5 : 1);
    const thermalGain = climate.temperatureC > 36 ? (climate.temperatureC - 35) * 0.18 : 0;
    const fireGain = (district?.dynamic.fireIntensity ?? 0) * 0.013 * (1 - building.safetyScore / 140);
    const resonanceGain = activeDisaster?.type === "earthquake" ? disasterImpact * 0.25 : 0.04;
    const leanGain = (settlementGain + resonanceGain * 0.2) * 0.7;
    const failure = {
      crack: clamp(building.failure.crack + crackGain, 0, 100),
      settlement: clamp(building.failure.settlement + settlementGain, 0, 100),
      thermal: clamp(building.failure.thermal + thermalGain, 0, 100),
      fire: clamp(building.failure.fire + fireGain, 0, 100),
      resonance: clamp(building.failure.resonance + resonanceGain, 0, 100),
      lean: clamp(building.failure.lean + leanGain, 0, 100),
    };
    const totalFailure = failure.crack * 0.22 + failure.settlement * 0.22 + failure.thermal * 0.14 + failure.fire * 0.18 + failure.resonance * 0.16 + failure.lean * 0.08;
    const condition = clamp(building.condition - totalFailure * 0.02, 0, 100);
    return {
      ...building,
      condition,
      failure,
    };
  });

  const selectedDistrict = districts.find((district) => district.id === state.map.selectedDistrictId) ?? districts[0];
  // Chunk agent simulation by tick to keep frame costs predictable on mobile.
  const chunk = state.tick % 3;
  const agents = state.citizenAgents.map((agent, index) => {
    if (index % 3 !== chunk) return agent;
    const district = buildingDistrictMap.get(agent.districtId) ?? selectedDistrict;
    const pressure = (district.dynamic.waterLevel + district.dynamic.fireIntensity + district.dynamic.smoke) / 3;
    const panic = clamp(agent.panic + pressure * 0.02 + (activeDisaster ? 0.6 : -0.2), 0, 100);
    const trapped = pressure > 58 && agent.mobility < 65 ? Math.random() < 0.08 : false;
    const evacuated = agent.evacuated || (panic > 62 && agent.awareness > 45 && Math.random() < 0.1);
    const healthLoss = (trapped ? 0.8 : 0.08) + district.dynamic.smoke * 0.0015;
    const nextDistrictId =
      evacuated && agent.districtId !== selectedDistrict.id && index % 9 === 0 ? selectedDistrict.id : agent.districtId;
    return {
      ...agent,
      districtId: nextDistrictId,
      panic,
      trapped,
      evacuated,
      health: clamp(agent.health - healthLoss + (state.rescue.activeOperation ? 0.15 : 0), 0, 100),
      trust: clamp(agent.trust + (state.rescue.activeOperation ? 0.25 : -0.06), 0, 100),
      awareness: clamp(agent.awareness + 0.04 + (activeDisaster ? 0.12 : 0), 0, 100),
    };
  });

  const citizens = summarizeCitizens(state, agents);
  climate.weather = weatherByClimate({ ...state, climate, citizens } as GameState);

  const maintenanceCost = Math.round(1200 + buildings.length * 460 + (state.learning.professionalMode ? 900 : 0));
  const repairCost = Math.round(buildings.filter((building) => building.condition < 45).length * 2800 + districts.filter((district) => district.infrastructureCondition < 55).length * 1900);
  const taxes = Math.round(citizens.safe * 0.65);
  const economy = {
    ...state.economy,
    taxesPerTick: taxes,
    maintenanceCost,
    repairCost,
    energyDemand: clamp(42 + buildings.length * 1.6 + climate.temperatureC * 0.4, 0, 100),
    waterDemand: clamp(40 + citizens.panic * 0.2 + climate.temperatureC * 0.25, 0, 100),
    powerGridHealth: clamp(state.economy.powerGridHealth - (activeDisaster ? 0.7 : -0.06), 0, 100),
    waterSystemHealth: clamp(state.economy.waterSystemHealth - (climate.rainfallMm > 900 ? 0.45 : -0.06), 0, 100),
    roadHealth: clamp(state.economy.roadHealth - districts.reduce((acc, district) => acc + district.dynamic.isolation, 0) / 2400, 0, 100),
  };
  const budget = Math.round(clamp(state.budget + taxes - maintenanceCost - repairCost - (activeDisaster ? 8000 : 1200), -8_000_000, 30_000_000));

  const engineeringFromBuildings =
    buildings.length === 0 ? state.engineeringScore : buildings.reduce((acc, building) => acc + building.structuralScore * (building.condition / 100), 0) / buildings.length;
  const sustainabilityFromBuildings =
    buildings.length === 0 ? state.sustainabilityScore : buildings.reduce((acc, building) => acc + building.climateScore, 0) / buildings.length;
  const resilienceScore = Math.round(
    clamp(
      engineeringFromBuildings * 0.28 +
        sustainabilityFromBuildings * 0.18 +
        citizens.trust * 0.16 +
        citizens.survivalProbability * 0.18 +
        economy.powerGridHealth * 0.1 +
        economy.waterSystemHealth * 0.1,
      0,
      100
    )
  );
  const climateScore = Math.round(
    clamp((100 - climate.droughtIndex) * 0.3 + climate.airQuality * 0.3 + (100 - climate.urbanHeat) * 0.2 + economy.waterSystemHealth * 0.2, 0, 100)
  );

  const next: GameState = {
    ...state,
    tick: state.tick + 1,
    day: nextDay,
    hour: nextHour,
    activeDisaster,
    climate,
    districts,
    buildings,
    citizenAgents: agents,
    citizens,
    economy,
    budget,
    engineeringScore: Math.round(clamp(engineeringFromBuildings, 0, 100)),
    sustainabilityScore: Math.round(clamp(sustainabilityFromBuildings, 0, 100)),
    resilienceScore,
    climateScore,
    riskScore: riskFromRegion(state.region.id),
    learning: {
      ...state.learning,
      engineeringXP: state.learning.engineeringXP + Math.round((activeDisaster ? 6 : 3) + (state.learning.professionalMode ? 4 : 0)),
      skillLevel: 1 + Math.floor((state.learning.engineeringXP + 1) / 220),
    },
    rescue: {
      ...state.rescue,
      activeOperation: activeDisaster ? state.rescue.activeOperation : false,
      triageEfficiency: clamp(state.rescue.triageEfficiency + (state.rescue.activeOperation ? 0.09 : 0.03), 0, 100),
      resourceFuel: clamp(state.rescue.resourceFuel - (state.rescue.activeOperation ? 0.6 : -0.1), 0, 100),
      commandLatency: clamp(state.rescue.commandLatency + (activeDisaster ? 0.3 : -0.2), 5, 90),
      blockedRoutes: Math.round(clamp(districts.reduce((acc, district) => acc + district.dynamic.isolation, 0) / 90, 0, 20)),
      unitReadiness: clamp(state.rescue.unitReadiness + (state.rescue.resourceFuel > 30 ? 0.08 : -0.4), 0, 100),
    },
    warnings,
    mentorLog: appendLog(
      state,
      activeDisaster
        ? "Dynamic hazard propagation detected. Prioritize route clearance and hospital access corridors."
        : "Use blueprint mode and district hazard overlays to reduce long-term climate and structural risk."
    ),
  };

  const progressedMissions = next.missions.map((mission) => missionProgress(next, mission));
  next.missions = progressedMissions.map((mission) => {
    if (mission.id === "m4" && progressedMissions.filter((item) => item.id !== "m4" && item.status === "completed").length >= 3) {
      return { ...mission, status: mission.status === "locked" ? "available" : mission.status };
    }
    return mission.objectives.every((item) => item.done) ? { ...mission, status: "completed" } : mission;
  });
  return next;
}

function withBuild(
  state: GameState,
  templateId: string,
  districtId?: string,
  blueprintInput?: Partial<BuildingBlueprint>
): GameState {
  const template = BUILDING_TEMPLATES.find((item) => item.id === templateId);
  if (!template) return state;
  const district = districtId ?? state.map.selectedDistrictId;
  const building = createBuilding(templateId, state.region.id, district, blueprintInput);
  if (!building) return state;
  const blueprintComplexityCost =
    building.blueprint.reinforcementLevel * 420 +
    building.blueprint.drainageCapacity * 280 +
    building.blueprint.utilityResilience * 220 +
    building.blueprint.floorCount * 8000;
  const professionalSurcharge = state.learning.professionalMode ? 35000 : 0;
  const totalCost = Math.round(template.cost + blueprintComplexityCost + professionalSurcharge);
  if (state.budget < totalCost) {
    return {
      ...state,
      warnings: ["Insufficient budget for blueprint-compliant construction.", ...state.warnings].slice(0, 6),
      mentorLog: appendLog(state, "Blueprint rejected: reduce floor count or stage components to meet budget."),
    };
  }

  const districts = state.districts.map((item) =>
    item.id === building.districtId
      ? { ...item, infrastructureCondition: clamp(item.infrastructureCondition + 0.8, 0, 100) }
      : item
  );
  return {
    ...state,
    buildings: [...state.buildings, building],
    districts,
    budget: state.budget - totalCost,
    engineeringScore: Math.round(clamp(state.engineeringScore + building.structuralScore * 0.028, 0, 100)),
    sustainabilityScore: Math.round(clamp(state.sustainabilityScore + building.climateScore * 0.02, 0, 100)),
    rescue: {
      ...state.rescue,
      sheltersOpen: building.name.includes("Shelter") ? clamp(state.rescue.sheltersOpen + 1, 0, 20) : state.rescue.sheltersOpen,
    },
    learning: {
      ...state.learning,
      engineeringXP: state.learning.engineeringXP + 28,
    },
    mentorLog: appendLog(
      state,
      `Construction complete in ${district}: ${building.name} | Structural ${Math.round(building.structuralScore)}`
    ),
  };
}

function withDisaster(state: GameState, disaster: DisasterType, intensity: number): GameState {
  const normalized = clamp(intensity, 1, 10);
  const durationTicks = 8 + Math.round(normalized * 1.6);
  const event: ActiveDisaster = {
    type: disaster,
    intensity: normalized,
    durationTicks,
    elapsedTicks: 0,
    impactedCitizens: 0,
    infrastructureDamage: 0,
  };
  const districts = state.districts.map((district) => {
    if (disaster === "flood" || disaster === "urban_flooding" || disaster === "storm_surge") {
      return { ...district, dynamic: { ...district.dynamic, waterLevel: clamp(district.dynamic.waterLevel + normalized * 4.5, 0, 100) } };
    }
    if (disaster === "wildfire") {
      return { ...district, dynamic: { ...district.dynamic, fireIntensity: clamp(district.dynamic.fireIntensity + normalized * 4.2, 0, 100) } };
    }
    if (disaster === "smog") {
      return { ...district, dynamic: { ...district.dynamic, smoke: clamp(district.dynamic.smoke + normalized * 5.2, 0, 100) } };
    }
    if (disaster === "earthquake" || disaster === "landslide") {
      return {
        ...district,
        infrastructureCondition: clamp(district.infrastructureCondition - normalized * 1.7, 0, 100),
        dynamic: { ...district.dynamic, isolation: clamp(district.dynamic.isolation + normalized * 1.1, 0, 100) },
      };
    }
    return district;
  });
  return {
    ...state,
    activeDisaster: event,
    districts,
    warnings: [`${disaster.toUpperCase()} initiated at intensity ${normalized}.`, ...state.warnings].slice(0, 6),
    mentorLog: appendLog(state, `Incident Command activated for ${disaster}. Dispatch and route controls are now critical.`),
    rescue: { ...state.rescue, activeOperation: true, teamsDeployed: clamp(state.rescue.teamsDeployed + 2, 0, 24) },
  };
}

function withRescueOperation(
  state: GameState,
  operation: "usar" | "triage" | "evacuate" | "airlift" | "fireline"
): GameState {
  const effects = {
    usar: { panic: -6, health: 1.2, budget: -90000, trust: 3.2, log: "USAR teams deployed for debris extraction." },
    triage: { panic: -4, health: 1.9, budget: -65000, trust: 2.4, log: "Medical triage zones organized by severity." },
    evacuate: { panic: -8, health: 0.7, budget: -120000, trust: 3.8, log: "Mass evacuation routes activated and managed." },
    airlift: { panic: -5, health: 2.2, budget: -160000, trust: 3, log: "Helicopter airlift performed for critical victims." },
    fireline: { panic: -7, health: 1.1, budget: -110000, trust: 2.8, log: "Fireline containment created to reduce spread." },
  } as const;
  const selected = effects[operation];
  const agents = state.citizenAgents.map((agent, index) =>
    index % 7 === 0
      ? {
          ...agent,
          evacuated: operation === "evacuate" ? true : agent.evacuated,
          trapped: operation === "usar" ? false : agent.trapped,
          health: clamp(agent.health + selected.health, 0, 100),
          panic: clamp(agent.panic + selected.panic * 0.8, 0, 100),
          trust: clamp(agent.trust + selected.trust * 0.4, 0, 100),
        }
      : agent
  );
  return {
    ...state,
    citizenAgents: agents,
    budget: state.budget + selected.budget,
    rescue: {
      ...state.rescue,
      activeOperation: true,
      teamsDeployed: clamp(state.rescue.teamsDeployed + 1, 0, 24),
      triageEfficiency: clamp(state.rescue.triageEfficiency + 3.5, 0, 100),
      commandLatency: clamp(state.rescue.commandLatency - 1.2, 5, 90),
    },
    mentorLog: appendLog(state, selected.log),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "tick":
      return withTick(state);
    case "set-mode":
      return { ...state, mode: action.payload };
    case "set-region":
      return {
        ...state,
        region: getRegionById(action.payload),
        riskScore: riskFromRegion(action.payload),
        warnings: [`Region switched to ${getRegionById(action.payload).name}.`, ...state.warnings].slice(0, 6),
        mentorLog: appendLog(state, "Site analysis updated with local hazard profiles and regional standards."),
      };
    case "build":
      return withBuild(state, action.payload.templateId, action.payload.districtId, action.payload.blueprint);
    case "trigger-disaster":
      return withDisaster(state, action.payload.disaster, action.payload.intensity);
    case "run-rescue":
      return withRescueOperation(state, action.payload);
    case "toggle-multiplayer":
      return {
        ...state,
        multiplayer: { ...state.multiplayer, enabled: !state.multiplayer.enabled },
      };
    case "add-teammate":
      return {
        ...state,
        multiplayer: {
          ...state.multiplayer,
          teammateCount: clamp(state.multiplayer.teammateCount + 1, 1, 4),
          coordinationScore: clamp(state.multiplayer.coordinationScore + 6, 0, 100),
        },
      };
    case "start-mission":
      return {
        ...state,
        missions: state.missions.map((mission) =>
          mission.id === action.payload.missionId && mission.status !== "locked" ? { ...mission, status: "active" } : mission
        ),
      };
    case "select-district":
      return {
        ...state,
        map: { ...state.map, selectedDistrictId: action.payload.districtId },
      };
    case "set-overlay":
      return {
        ...state,
        map: { ...state.map, activeOverlay: action.payload.overlay },
      };
    case "toggle-professional-mode":
      return {
        ...state,
        learning: { ...state.learning, professionalMode: !state.learning.professionalMode },
      };
    case "load":
      return action.payload;
    case "reset":
      return createInitialState();
    default:
      return state;
  }
}

export function saveGame(state: GameState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: SAVE_VERSION, state }));
}

export function loadGame(): GameState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { version: number; state: GameState };
    if (parsed.version !== SAVE_VERSION || !parsed.state) return null;
    return parsed.state;
  } catch {
    return null;
  }
}

export function getTickDurationMs(): number {
  return TICK_SECONDS * 1000;
}
