import { BUILDING_TEMPLATES, CAMPAIGN_MISSIONS, getRegionById } from "./data";
import { DEFAULT_DISTRICTS, HOSPITALS, INFRA_NODES, ROAD_EDGES, ROAD_NODES } from "./map-data";
import type {
  ActiveDisaster,
  BuildingBlueprint,
  BuildingInstance,
  DisasterType,
  EmergencyUnit,
  GameState,
  HazardOverlay,
  Incident,
  Mission,
  RegionId,
  RoadEdge,
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
  | { type: "set-corridor-emergency-only"; payload: { corridorId: string; emergencyOnly: boolean } }
  | { type: "set-corridor-restricted"; payload: { corridorId: string; restricted: boolean } }
  | { type: "set-corridor-priority"; payload: { corridorId: string; priority: number } }
  | { type: "toggle-shelter"; payload: { shelterId: string; open: boolean } }
  | { type: "assign-unit-incident"; payload: { unitId: string; incidentId: string } }
  | { type: "set-incident-priority"; payload: { incidentId: string; priority: Incident["priority"] } }
  | { type: "toggle-policy"; payload: { policy: GameState["policies"][number]["policy"]; active: boolean } }
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
      vulnerableGroup:
        index % 19 === 0
          ? "elderly"
          : index % 23 === 0
          ? "child"
          : index % 29 === 0
          ? "disabled"
          : index % 41 === 0
          ? "hospitalized"
          : "general",
      familyClusterId: `family-${index % 65}`,
      followsWarnings: index % 7 !== 0,
    };
  });
}

function createEmergencyUnits(): EmergencyUnit[] {
  return [
    { id: uid("unit"), type: "ambulance", districtId: "district-saddar", fuel: 84, fatigue: 12, capacity: 4, speed: 68, readiness: 82, damageExposure: 8, status: "idle" },
    { id: uid("unit"), type: "fire-brigade", districtId: "district-korangi", fuel: 74, fatigue: 16, capacity: 8, speed: 56, readiness: 79, damageExposure: 14, status: "idle" },
    { id: uid("unit"), type: "engineering-inspector", districtId: "district-gulshan", fuel: 77, fatigue: 9, capacity: 3, speed: 52, readiness: 85, damageExposure: 9, status: "idle" },
    { id: uid("unit"), type: "heavy-rescue", districtId: "district-malir-river", fuel: 72, fatigue: 19, capacity: 10, speed: 42, readiness: 75, damageExposure: 18, status: "idle" },
    { id: uid("unit"), type: "drone", districtId: "district-saddar", fuel: 92, fatigue: 8, capacity: 1, speed: 82, readiness: 89, damageExposure: 6, status: "idle" },
    { id: uid("unit"), type: "helicopter", districtId: "district-clifton", fuel: 68, fatigue: 22, capacity: 6, speed: 91, readiness: 73, damageExposure: 20, status: "idle" },
    { id: uid("unit"), type: "police", districtId: "district-saddar", fuel: 81, fatigue: 14, capacity: 6, speed: 64, readiness: 83, damageExposure: 10, status: "idle" },
    { id: uid("unit"), type: "evacuation-bus", districtId: "district-gulshan", fuel: 79, fatigue: 12, capacity: 30, speed: 46, readiness: 78, damageExposure: 12, status: "idle" },
  ];
}

function buildAdjacency(edges: RoadEdge[]): Map<string, RoadEdge[]> {
  const map = new Map<string, RoadEdge[]>();
  for (const edge of edges) {
    const existingFrom = map.get(edge.from) ?? [];
    existingFrom.push(edge);
    map.set(edge.from, existingFrom);
    const reverse: RoadEdge = { ...edge, id: `${edge.id}-rev`, from: edge.to, to: edge.from };
    const existingTo = map.get(edge.to) ?? [];
    existingTo.push(reverse);
    map.set(edge.to, existingTo);
  }
  return map;
}

function edgeTravelCost(edge: RoadEdge, weatherPenalty: number): number {
  const blocked = edge.accessibility <= 5 || edge.obstruction > 90 || edge.damage > 92;
  if (blocked) return Number.POSITIVE_INFINITY;
  const congestionPenalty = edge.congestion * 0.06;
  const floodPenalty = edge.floodability * 0.04;
  const damagePenalty = edge.damage * 0.07;
  const obstructionPenalty = edge.obstruction * 0.05;
  const accessibilityFactor = (100 - edge.accessibility) * 0.04;
  return 1 + congestionPenalty + floodPenalty + damagePenalty + obstructionPenalty + accessibilityFactor + weatherPenalty;
}

function findDistrictNode(districtId: string): string {
  return ROAD_NODES.find((node) => node.districtId === districtId)?.id ?? ROAD_NODES[0].id;
}

function estimateRoute(
  roadGraph: GameState["roadGraph"],
  fromDistrictId: string,
  toDistrictId: string,
  weatherPenalty: number
): { etaMinutes: number; traversedEdgeIds: string[] } {
  const start = findDistrictNode(fromDistrictId);
  const target = findDistrictNode(toDistrictId);
  const adjacency = buildAdjacency(roadGraph.edges);
  const open = new Set<string>([start]);
  const dist = new Map<string, number>([[start, 0]]);
  const prev = new Map<string, { node: string; edgeId: string }>();
  const heuristic = (nodeId: string) => {
    const node = ROAD_NODES.find((item) => item.id === nodeId);
    const goal = ROAD_NODES.find((item) => item.id === target);
    if (!node || !goal) return 0;
    const lat = node.position[0] - goal.position[0];
    const lon = node.position[1] - goal.position[1];
    return Math.sqrt(lat * lat + lon * lon) * 120;
  };

  while (open.size > 0) {
    let current = "";
    let minScore = Number.POSITIVE_INFINITY;
    for (const nodeId of open) {
      const score = (dist.get(nodeId) ?? Number.POSITIVE_INFINITY) + heuristic(nodeId);
      if (score < minScore) {
        minScore = score;
        current = nodeId;
      }
    }
    if (!current) break;
    if (current === target) break;
    open.delete(current);
    const neighbors = adjacency.get(current) ?? [];
    for (const edge of neighbors) {
      const cost = edgeTravelCost(edge, weatherPenalty);
      if (!Number.isFinite(cost)) continue;
      const tentative = (dist.get(current) ?? Number.POSITIVE_INFINITY) + cost;
      if (tentative < (dist.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(edge.to, tentative);
        prev.set(edge.to, { node: current, edgeId: edge.id.replace("-rev", "") });
        open.add(edge.to);
      }
    }
  }

  if (!dist.has(target)) {
    return { etaMinutes: 999, traversedEdgeIds: [] };
  }
  const traversedEdgeIds: string[] = [];
  let cursor = target;
  while (cursor !== start) {
    const info = prev.get(cursor);
    if (!info) break;
    traversedEdgeIds.push(info.edgeId);
    cursor = info.node;
  }
  traversedEdgeIds.reverse();
  return { etaMinutes: Math.round((dist.get(target) ?? 999) * 2.8), traversedEdgeIds };
}

function districtCenterNodeDistrictId(nodeId: string): string {
  return ROAD_NODES.find((node) => node.id === nodeId)?.districtId ?? DEFAULT_DISTRICTS[0].id;
}

function incidentPriorityFromSeverity(severity: number): "low" | "urgent" | "critical" | "catastrophic" {
  if (severity >= 85) return "catastrophic";
  if (severity >= 70) return "critical";
  if (severity >= 50) return "urgent";
  return "low";
}

function createInitialShelters(): GameState["shelters"] {
  return [
    {
      id: "shelter-central",
      districtId: "district-saddar",
      name: "Central Civic Shelter",
      open: true,
      capacity: 950,
      occupancy: 220,
      medicalSupport: 74,
      powerStability: 78,
      foodSupply: 71,
      waterSupply: 73,
      accessibility: 84,
      overcrowdingRisk: 12,
    },
    {
      id: "shelter-river",
      districtId: "district-malir-river",
      name: "Riverbank Emergency Camp",
      open: true,
      capacity: 780,
      occupancy: 180,
      medicalSupport: 61,
      powerStability: 69,
      foodSupply: 66,
      waterSupply: 68,
      accessibility: 72,
      overcrowdingRisk: 15,
    },
    {
      id: "shelter-east",
      districtId: "district-korangi",
      name: "Eastern Transit Shelter",
      open: false,
      capacity: 1100,
      occupancy: 0,
      medicalSupport: 58,
      powerStability: 64,
      foodSupply: 62,
      waterSupply: 64,
      accessibility: 70,
      overcrowdingRisk: 0,
    },
  ];
}

function createInitialCorridors(): GameState["evacuationCorridors"] {
  return [
    {
      id: "corridor-core-west",
      name: "Core-West Evac Corridor",
      edgeIds: ["e1", "e10"],
      priority: 90,
      emergencyOnly: true,
      restricted: false,
      risk: 22,
    },
    {
      id: "corridor-river-east",
      name: "River-East Evac Corridor",
      edgeIds: ["e7", "e4", "e9"],
      priority: 72,
      emergencyOnly: false,
      restricted: false,
      risk: 41,
    },
  ];
}

function createInitialPolicies(): GameState["policies"] {
  return [
    { policy: "city_evacuation", active: false, impact: { trust: -2, panic: -10, economy: -18, evacuationSpeed: 18 } },
    { policy: "curfew", active: false, impact: { trust: -4, panic: -3, economy: -8, evacuationSpeed: 6 } },
    { policy: "emergency_broadcast", active: true, impact: { trust: 5, panic: -9, economy: -1, evacuationSpeed: 8 } },
    { policy: "school_closure", active: false, impact: { trust: 2, panic: -2, economy: -3, evacuationSpeed: 4 } },
    { policy: "transport_shutdown", active: false, impact: { trust: -5, panic: 2, economy: -10, evacuationSpeed: -8 } },
    { policy: "fuel_rationing", active: false, impact: { trust: -3, panic: 3, economy: -6, evacuationSpeed: -4 } },
  ];
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
  const misinformation = agents.filter((item) => !item.followsWarnings).length / agents.length;
  const clusterMap = new Map<string, number>();
  agents.forEach((agent) => {
    clusterMap.set(agent.familyClusterId, (clusterMap.get(agent.familyClusterId) ?? 0) + (agent.evacuated ? 1 : 0));
  });
  const reunificationPressure =
    Array.from(clusterMap.values()).filter((value) => value > 0 && value < 2).length / Math.max(1, clusterMap.size);
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
    misinformationLevel: clamp(misinformation * 100, 0, 100),
    reunificationPressure: clamp(reunificationPressure * 100, 0, 100),
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
      misinformationLevel: 18,
      reunificationPressure: 22,
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
      mutualAidRequests: 0,
      responseEscalationLevel: 1,
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
    resources: {
      fuel: 80,
      medicalSupplies: 72,
      rescueEquipment: 68,
      food: 76,
      water: 74,
      temporaryShelters: 44,
    },
    hospitals: HOSPITALS,
    infrastructureNodes: INFRA_NODES,
    roadGraph: {
      nodes: ROAD_NODES,
      edges: ROAD_EDGES,
    },
    evacuationCorridors: createInitialCorridors(),
    shelters: createInitialShelters(),
    policies: createInitialPolicies(),
    incidents: [],
    emergencyUnits: createEmergencyUnits(),
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
  const activePolicies = state.policies.filter((policy) => policy.active);
  const policyEffect = activePolicies.reduce(
    (acc, policy) => ({
      trust: acc.trust + policy.impact.trust,
      panic: acc.panic + policy.impact.panic,
      economy: acc.economy + policy.impact.economy,
      evacuationSpeed: acc.evacuationSpeed + policy.impact.evacuationSpeed,
    }),
    { trust: 0, panic: 0, economy: 0, evacuationSpeed: 0 }
  );

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

  const districtById = new Map(districts.map((district) => [district.id, district]));
  const corridorByEdgeId = new Map<string, GameState["evacuationCorridors"][number]>();
  state.evacuationCorridors.forEach((corridor) => {
    corridor.edgeIds.forEach((edgeId) => corridorByEdgeId.set(edgeId, corridor));
  });
  const roadGraph = {
    ...state.roadGraph,
    edges: state.roadGraph.edges.map((edge) => {
      const fromDistrict = districtById.get(districtCenterNodeDistrictId(edge.from));
      const toDistrict = districtById.get(districtCenterNodeDistrictId(edge.to));
      const flood = ((fromDistrict?.dynamic.waterLevel ?? 0) + (toDistrict?.dynamic.waterLevel ?? 0)) / 2;
      const fire = ((fromDistrict?.dynamic.fireIntensity ?? 0) + (toDistrict?.dynamic.fireIntensity ?? 0)) / 2;
      const traffic = ((fromDistrict?.dynamic.trafficLoad ?? 0) + (toDistrict?.dynamic.trafficLoad ?? 0)) / 2;
      const bridgeBoost = edge.id.includes("e6") || edge.id.includes("e7") ? 1.4 : 1;
      const disasterPenalty = activeDisaster
        ? activeDisaster.type === "flood" || activeDisaster.type === "storm_surge" || activeDisaster.type === "urban_flooding"
          ? 1.2
          : activeDisaster.type === "wildfire"
          ? 0.9
          : activeDisaster.type === "earthquake"
          ? 1.1
          : 0.7
        : -0.35;
      const obstruction = clamp(edge.obstruction + flood * 0.08 + fire * 0.07 + disasterPenalty, 0, 100);
      const damage = clamp(edge.damage + flood * 0.05 + (activeDisaster?.type === "earthquake" ? disasterImpact * 0.24 : 0) + (edge.id.includes("e6") || edge.id.includes("e7") ? disasterImpact * 0.12 : 0), 0, 100);
      const congestion = clamp(edge.congestion + traffic * 0.06 + (activeDisaster ? 0.9 : -0.4), 0, 100);
      const corridor = corridorByEdgeId.get(edge.id);
      const corridorPriorityBoost = corridor ? corridor.priority * 0.06 : 0;
      const corridorEmergencyBoost = corridor?.emergencyOnly ? 10 : 0;
      const corridorRestrictionPenalty = corridor?.restricted ? 16 : 0;
      const accessibility = clamp(
        edge.accessibility -
          obstruction * 0.05 * bridgeBoost -
          damage * 0.04 * bridgeBoost -
          (climate.weather === "storm" ? 0.4 : 0) +
          corridorPriorityBoost +
          corridorEmergencyBoost -
          corridorRestrictionPenalty,
        0,
        100
      );
      return {
        ...edge,
        obstruction,
        damage,
        congestion: clamp(congestion - corridorPriorityBoost * 0.45 + corridorRestrictionPenalty * 0.5, 0, 100),
        accessibility,
      };
    }),
  };
  const evacuationCorridors = state.evacuationCorridors.map((corridor) => {
    const edges = roadGraph.edges.filter((edge) => corridor.edgeIds.includes(edge.id));
    const risk =
      edges.length === 0
        ? corridor.risk
        : clamp(
            edges.reduce((acc, edge) => acc + (100 - edge.accessibility) * 0.6 + edge.obstruction * 0.2 + edge.damage * 0.2, 0) /
              edges.length,
            0,
            100
          );
    return {
      ...corridor,
      risk,
    };
  });

  const infrastructureNodes = state.infrastructureNodes.map((node) => {
    const district = districtById.get(node.districtId);
    const dependencyHealth =
      node.dependencyIds.length === 0
        ? 100
        : node.dependencyIds
            .map((dependencyId) => state.infrastructureNodes.find((item) => item.id === dependencyId)?.health ?? 60)
            .reduce((acc, value) => acc + value, 0) / node.dependencyIds.length;
    const hazardStress =
      (district?.dynamic.waterLevel ?? 0) * (node.kind === "drainage-pump" ? 0.08 : 0.04) +
      (district?.dynamic.fireIntensity ?? 0) * (node.kind === "fuel-depot" ? 0.09 : 0.03) +
      (activeDisaster?.type === "earthquake" && (node.kind === "bridge" || node.kind === "substation") ? disasterImpact * 0.5 : 0) +
      (climate.weather === "storm" && node.kind === "telecom-tower" ? 0.6 : 0);
    const load = clamp(node.load + (district?.dynamic.trafficLoad ?? 0) * 0.03 + (activeDisaster ? 1 : -0.2), 0, 120);
    const health = clamp(node.health - hazardStress - load * 0.01 + dependencyHealth * 0.003, 0, 100);
    return {
      ...node,
      load,
      health,
      active: health > 20 && dependencyHealth > 18,
    };
  });

  const hospitals = state.hospitals.map((hospital) => {
    const district = districtById.get(hospital.districtId);
    const infraPower = infrastructureNodes.find((node) => node.kind === "substation")?.health ?? 60;
    const traumaLoad = clamp(
      hospital.traumaLoad + (district?.dynamic.fireIntensity ?? 0) * 0.04 + (district?.dynamic.waterLevel ?? 0) * 0.03 + disasterImpact * 0.2 - state.rescue.triageEfficiency * 0.02,
      0,
      hospital.bedCapacity * 1.7
    );
    const accessibility = clamp(
      hospital.accessibility - (district?.dynamic.isolation ?? 0) * 0.05 - (100 - state.economy.roadHealth) * 0.03,
      0,
      100
    );
    return {
      ...hospital,
      traumaLoad,
      accessibility,
      powerStability: clamp((hospital.powerStability + infraPower * 0.2) / 1.2 - (activeDisaster ? 0.7 : -0.1), 0, 100),
      medicalSupplies: clamp(hospital.medicalSupplies - traumaLoad * 0.003 + state.resources.medicalSupplies * 0.01, 0, 100),
    };
  });
  const sheltersBaseline = state.shelters.map((shelter) => {
    const district = districtById.get(shelter.districtId);
    const gridNode = infrastructureNodes.find((node) => node.kind === "substation");
    const overload = shelter.occupancy / Math.max(1, shelter.capacity);
    return {
      ...shelter,
      accessibility: clamp(
        shelter.accessibility - (district?.dynamic.isolation ?? 0) * 0.06 - (100 - state.economy.roadHealth) * 0.02,
        0,
        100
      ),
      powerStability: clamp((shelter.powerStability + (gridNode?.health ?? 60) * 0.1) / 1.1 - (activeDisaster ? 0.4 : -0.1), 0, 100),
      foodSupply: clamp(shelter.foodSupply - overload * 2 + state.resources.food * 0.01, 0, 100),
      waterSupply: clamp(shelter.waterSupply - overload * 2.2 + state.resources.water * 0.01, 0, 100),
      overcrowdingRisk: clamp(overload * 100, 0, 100),
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
  const shelterSlots = new Map(
    sheltersBaseline.map((shelter) => [shelter.id, Math.max(0, shelter.capacity - shelter.occupancy)])
  );
  // Chunk agent simulation by tick to keep frame costs predictable on mobile.
  const chunk = state.tick % 3;
  const agents = state.citizenAgents.map((agent, index) => {
    if (index % 3 !== chunk) return agent;
    const district = buildingDistrictMap.get(agent.districtId) ?? selectedDistrict;
    const pressure = (district.dynamic.waterLevel + district.dynamic.fireIntensity + district.dynamic.smoke) / 3;
    const panic = clamp(agent.panic + pressure * 0.02 + (activeDisaster ? 0.6 : -0.2) + policyEffect.panic * 0.015, 0, 100);
    const trapped = pressure > 58 && agent.mobility < 65 ? Math.random() < 0.08 : false;
    const shelteredTarget = sheltersBaseline
      .filter((shelter) => shelter.open && shelter.accessibility > 25 && (shelterSlots.get(shelter.id) ?? 0) > 0)
      .sort((a, b) => b.accessibility - a.accessibility || a.overcrowdingRisk - b.overcrowdingRisk)[0];
    const warnedAndCompliant = agent.followsWarnings || activePolicies.some((policy) => policy.policy === "emergency_broadcast");
    const evacuated =
      agent.evacuated ||
      (panic > 62 && agent.awareness > 45 && warnedAndCompliant && Math.random() < clamp(0.08 + policyEffect.evacuationSpeed * 0.003, 0.02, 0.35));
    const healthLoss = (trapped ? 0.8 : 0.08) + district.dynamic.smoke * 0.0015;
    let nextDistrictId = agent.districtId;
    if (evacuated && shelteredTarget && index % 9 === 0) {
      nextDistrictId = shelteredTarget.districtId;
      shelterSlots.set(shelteredTarget.id, Math.max(0, (shelterSlots.get(shelteredTarget.id) ?? 0) - 1));
    }
    return {
      ...agent,
      districtId: nextDistrictId,
      panic,
      trapped,
      evacuated,
      followsWarnings:
        agent.followsWarnings || activePolicies.some((policy) => policy.policy === "emergency_broadcast")
          ? true
          : agent.followsWarnings,
      health: clamp(agent.health - healthLoss + (state.rescue.activeOperation ? 0.15 : 0), 0, 100),
      trust: clamp(agent.trust + (state.rescue.activeOperation ? 0.25 : -0.06) + policyEffect.trust * 0.02, 0, 100),
      awareness: clamp(agent.awareness + 0.04 + (activeDisaster ? 0.12 : 0), 0, 100),
    };
  });
  const shelterOccupancyByDistrict = new Map<string, number>();
  agents.forEach((agent) => {
    if (!agent.evacuated) return;
    shelterOccupancyByDistrict.set(agent.districtId, (shelterOccupancyByDistrict.get(agent.districtId) ?? 0) + 1);
  });
  const shelters = sheltersBaseline.map((shelter) => {
    const occupancy = Math.min(shelter.capacity, shelter.occupancy * 0.92 + (shelterOccupancyByDistrict.get(shelter.districtId) ?? 0));
    const overcrowdingRisk = clamp((occupancy / Math.max(1, shelter.capacity)) * 100, 0, 150);
    return {
      ...shelter,
      occupancy,
      overcrowdingRisk,
    };
  });

  const citizens = summarizeCitizens(state, agents);
  climate.weather = weatherByClimate({ ...state, climate, citizens } as GameState);

  const incidentCandidates: Incident[] = districts
    .map((district) => {
      const severity = Math.round(
        district.dynamic.waterLevel * 0.28 +
          district.dynamic.fireIntensity * 0.26 +
          district.dynamic.smoke * 0.16 +
          district.dynamic.isolation * 0.22 +
          (activeDisaster ? activeDisaster.intensity * 3.5 : 0)
      );
      if (severity < 48) return null;
      return {
        id: uid("inc"),
        districtId: district.id,
        hazardType:
          district.dynamic.fireIntensity > 55
            ? "wildfire"
            : district.dynamic.waterLevel > 55
            ? "flood"
            : district.dynamic.smoke > 60
            ? "smog"
            : "infrastructure",
        severity,
        casualties: Math.round((district.populationDensity * severity) / 290),
        accessibility: Math.round(100 - district.dynamic.isolation),
        urgency: Math.round(severity * 0.8 + district.dynamic.trafficLoad * 0.25),
        infrastructureImpact: Math.round((100 - district.infrastructureCondition) * 0.9),
        status: "queued",
        priority: incidentPriorityFromSeverity(severity),
        createdTick: state.tick + 1,
      } as Incident;
    })
    .filter((item): item is Incident => Boolean(item))
    .slice(0, 2);

  const activeIncidents = state.incidents
    .map((incident) => {
      const district = districtById.get(incident.districtId);
      const nextSeverity = clamp(
        incident.severity + (district ? (district.dynamic.waterLevel + district.dynamic.fireIntensity) * 0.01 : 0) - (state.rescue.activeOperation ? 0.8 : 0.1),
        0,
        100
      );
      const resolved = nextSeverity < 18 || (incident.status === "dispatched" && nextSeverity < 28);
      return {
        ...incident,
        severity: nextSeverity,
        priority: incidentPriorityFromSeverity(nextSeverity),
        status: resolved ? "resolved" : incident.status,
      };
    })
    .filter((incident) => incident.status !== "resolved")
    .slice(-10);

  const incidents = [...activeIncidents, ...incidentCandidates].slice(-12);
  const weatherPenalty = climate.weather === "storm" ? 2.4 : climate.weather === "fog" ? 1.3 : climate.weather === "heatwave" ? 0.6 : 0.2;
  const queuedIncidents = incidents
    .filter((incident) => incident.status === "queued")
    .sort((a, b) => b.urgency - a.urgency);
  const queuedIncidentCount = queuedIncidents.length;
  const dispatchQueue = [...queuedIncidents];
  const emergencyUnits = state.emergencyUnits.map((unit) => {
    if (unit.status === "maintenance") {
      return {
        ...unit,
        fuel: clamp(unit.fuel + 1.2, 0, 100),
        fatigue: clamp(unit.fatigue - 1.4, 0, 100),
        readiness: clamp(unit.readiness + 0.8, 0, 100),
        status: unit.readiness > 72 ? "idle" : "maintenance",
      };
    }
    let assignedIncidentId = unit.assignedIncidentId;
    let etaMinutes = unit.etaMinutes;
    let status = unit.status;
    if ((!assignedIncidentId || !incidents.some((incident) => incident.id === assignedIncidentId)) && dispatchQueue.length > 0 && unit.readiness > 45) {
      const target = dispatchQueue.shift()!;
      const route = estimateRoute(roadGraph, unit.districtId, target.districtId, weatherPenalty);
      assignedIncidentId = target.id;
      etaMinutes = route.etaMinutes;
      status = "en-route";
    } else if (status === "en-route" && etaMinutes !== undefined) {
      etaMinutes = clamp(etaMinutes - (unit.speed / 22) * (state.economy.roadHealth / 100), 0, 999);
      status = etaMinutes <= 0 ? "operating" : "en-route";
    } else if (status === "operating") {
      const done = Math.random() < 0.18;
      if (done) {
        status = "idle";
        assignedIncidentId = undefined;
        etaMinutes = undefined;
      }
    }
    return {
      ...unit,
      assignedIncidentId,
      etaMinutes,
      status,
      fuel: clamp(unit.fuel - (status === "idle" ? 0.08 : 0.7), 0, 100),
      fatigue: clamp(unit.fatigue + (status === "idle" ? -0.3 : 0.75), 0, 100),
      readiness: clamp(unit.readiness + (status === "idle" ? 0.4 : -0.5), 0, 100),
      damageExposure: clamp(unit.damageExposure + (status === "operating" ? 0.6 : 0.1), 0, 100),
      districtId:
        status === "operating" && assignedIncidentId
          ? incidents.find((incident) => incident.id === assignedIncidentId)?.districtId ?? unit.districtId
          : unit.districtId,
    };
  });

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
    roadHealth: clamp(
      state.economy.roadHealth -
        districts.reduce((acc, district) => acc + district.dynamic.isolation, 0) / 2400 +
        (activePolicies.some((policy) => policy.policy === "transport_shutdown") ? -0.6 : 0.15),
      0,
      100
    ),
  };
  const resources = {
    fuel: clamp(state.resources.fuel - emergencyUnits.filter((unit) => unit.status !== "idle").length * 0.5 + (state.economy.taxesPerTick > 4500 ? 0.2 : 0), 0, 100),
    medicalSupplies: clamp(state.resources.medicalSupplies - hospitals.reduce((acc, hospital) => acc + hospital.traumaLoad, 0) / 2000 + 0.12, 0, 100),
    rescueEquipment: clamp(state.resources.rescueEquipment - (activeDisaster ? 0.35 : -0.08), 0, 100),
    food: clamp(state.resources.food - citizens.displaced / 2400 + 0.08, 0, 100),
    water: clamp(state.resources.water - climate.temperatureC * 0.01 - districts.reduce((acc, district) => acc + district.dynamic.waterLevel, 0) / 12000 + 0.1, 0, 100),
    temporaryShelters: clamp(state.resources.temporaryShelters + (citizens.displaced > 120 ? 0.7 : -0.25), 0, 100),
  };
  const budget = Math.round(
    clamp(
      state.budget +
        taxes -
        maintenanceCost -
        repairCost -
        (activeDisaster ? 8000 : 1200) +
        policyEffect.economy * 1200,
      -8_000_000,
      30_000_000
    )
  );
  const hospitalOverload = hospitals.filter((hospital) => hospital.traumaLoad > hospital.bedCapacity).length;
  const severeIncidents = incidents.filter((incident) => incident.priority === "critical" || incident.priority === "catastrophic").length;
  const newFeedLines = [
    severeIncidents > 0 ? `${severeIncidents} high-priority incidents await tactical dispatch.` : "Incident pressure currently manageable.",
    hospitalOverload > 0 ? `${hospitalOverload} hospital(s) overloaded. Route critical evacuations to alternate facilities.` : "Hospital trauma load within capacity.",
    state.resources.fuel < 30 ? "Fuel shortage warning: consider rationing or mutual aid transfers." : "Fuel reserves stable for current operations.",
    state.rescue.blockedRoutes > 8 ? "Multiple corridor failures detected. Activate emergency-only lanes." : "Evacuation corridors partially stable.",
  ];
  warnings = [...newFeedLines, ...warnings].slice(0, 8);

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
    roadGraph,
    evacuationCorridors,
    infrastructureNodes,
    hospitals,
    resources,
    shelters,
    policies: state.policies,
    incidents,
    emergencyUnits,
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
      blockedRoutes: Math.round(clamp(roadGraph.edges.filter((edge) => edge.accessibility < 25).length + districts.reduce((acc, district) => acc + district.dynamic.isolation, 0) / 120, 0, 40)),
      unitReadiness: clamp(state.rescue.unitReadiness + (state.rescue.resourceFuel > 30 ? 0.08 : -0.4), 0, 100),
      mutualAidRequests: clamp(state.rescue.mutualAidRequests + (queuedIncidentCount > 1 ? 0.6 : -0.2), 0, 30),
      responseEscalationLevel: clamp(
        Math.round((incidents.filter((incident) => incident.severity > 70).length + (activeDisaster ? activeDisaster.intensity / 2 : 0)) / 2 + 1),
        1,
        5
      ),
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
  const roadGraph = {
    ...state.roadGraph,
    edges: state.roadGraph.edges.map((edge) => ({
      ...edge,
      obstruction: clamp(edge.obstruction + normalized * (disaster === "flood" || disaster === "wildfire" ? 5.2 : 3.5), 0, 100),
      damage: clamp(edge.damage + normalized * (disaster === "earthquake" || disaster === "landslide" ? 4.7 : 2.2), 0, 100),
      accessibility: clamp(edge.accessibility - normalized * 2.1, 0, 100),
    })),
  };
  const infrastructureNodes = state.infrastructureNodes.map((node) => ({
    ...node,
    health: clamp(
      node.health -
        normalized *
          (disaster === "earthquake" && (node.kind === "bridge" || node.kind === "substation")
            ? 5.2
            : disaster === "flood" && node.kind === "drainage-pump"
            ? 6.3
            : disaster === "wildfire" && node.kind === "fuel-depot"
            ? 6.8
            : 2.6),
      0,
      100
    ),
  }));
  const incidents = [
    ...state.incidents,
    {
      id: uid("inc"),
      districtId: state.map.selectedDistrictId,
      hazardType: disaster,
      severity: Math.round(normalized * 9.5),
      casualties: Math.round(normalized * 11),
      accessibility: 58,
      urgency: Math.round(normalized * 10),
      infrastructureImpact: Math.round(normalized * 8.5),
      status: "queued" as const,
      priority: incidentPriorityFromSeverity(Math.round(normalized * 9.5)),
      createdTick: state.tick,
    },
  ].slice(-12);
  return {
    ...state,
    activeDisaster: event,
    districts,
    roadGraph,
    infrastructureNodes,
    incidents,
    resources: {
      ...state.resources,
      fuel: clamp(state.resources.fuel - normalized * 0.8, 0, 100),
      medicalSupplies: clamp(state.resources.medicalSupplies - normalized * 0.9, 0, 100),
    },
    warnings: [`${disaster.toUpperCase()} initiated at intensity ${normalized}.`, ...state.warnings].slice(0, 6),
    mentorLog: appendLog(state, `Incident Command activated for ${disaster}. Dispatch and route controls are now critical.`),
    rescue: {
      ...state.rescue,
      activeOperation: true,
      teamsDeployed: clamp(state.rescue.teamsDeployed + 2, 0, 24),
      responseEscalationLevel: clamp(state.rescue.responseEscalationLevel + 1, 1, 5),
    },
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
  const targetIncident = state.incidents
    .filter((incident) => incident.status === "queued")
    .sort((a, b) => b.urgency - a.urgency)[0];
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
  const incidents = state.incidents.map((incident) =>
    incident.id === targetIncident?.id
      ? {
          ...incident,
          status: "dispatched",
          severity: clamp(incident.severity - 8, 0, 100),
          casualties: Math.max(0, incident.casualties - Math.round(selected.health * 2)),
        }
      : incident
  );
  const emergencyUnits = state.emergencyUnits.map((unit, index) => {
    if (index % 3 !== 0 || !targetIncident) return unit;
    return {
      ...unit,
      assignedIncidentId: targetIncident.id,
      status: "en-route",
      etaMinutes: Math.max(4, Math.round(18 - unit.speed * 0.08 + state.rescue.blockedRoutes * 0.4)),
      fuel: clamp(unit.fuel - 4.2, 0, 100),
      fatigue: clamp(unit.fatigue + 2.6, 0, 100),
    };
  });
  return {
    ...state,
    citizenAgents: agents,
    incidents,
    emergencyUnits,
    budget: state.budget + selected.budget,
    resources: {
      ...state.resources,
      fuel: clamp(state.resources.fuel - 1.5, 0, 100),
      medicalSupplies: clamp(state.resources.medicalSupplies - (operation === "triage" ? 1.6 : 0.7), 0, 100),
      rescueEquipment: clamp(state.resources.rescueEquipment - 0.8, 0, 100),
    },
    rescue: {
      ...state.rescue,
      activeOperation: true,
      teamsDeployed: clamp(state.rescue.teamsDeployed + 1, 0, 24),
      triageEfficiency: clamp(state.rescue.triageEfficiency + 3.5, 0, 100),
      commandLatency: clamp(state.rescue.commandLatency - 1.2, 5, 90),
      mutualAidRequests: clamp(state.rescue.mutualAidRequests + (state.incidents.filter((i) => i.status === "queued").length > 3 ? 1 : 0), 0, 30),
    },
    mentorLog: appendLog(state, selected.log),
  };
}

function withManualDispatch(state: GameState, unitId: string, incidentId: string): GameState {
  const incident = state.incidents.find((item) => item.id === incidentId);
  const unit = state.emergencyUnits.find((item) => item.id === unitId);
  if (!incident || !unit) return state;
  const weatherPenalty =
    state.climate.weather === "storm" ? 2.4 : state.climate.weather === "fog" ? 1.3 : state.climate.weather === "heatwave" ? 0.6 : 0.2;
  const route = estimateRoute(state.roadGraph, unit.districtId, incident.districtId, weatherPenalty);
  const routeRisk = Math.round(
    route.traversedEdgeIds.reduce((acc, edgeId) => {
      const edge = state.roadGraph.edges.find((item) => item.id === edgeId);
      if (!edge) return acc;
      return acc + (100 - edge.accessibility) * 0.4 + edge.congestion * 0.3;
    }, 0) / Math.max(1, route.traversedEdgeIds.length)
  );
  return {
    ...state,
    incidents: state.incidents.map((item) =>
      item.id === incidentId ? { ...item, status: "dispatched", urgency: clamp(item.urgency + 6, 0, 100) } : item
    ),
    emergencyUnits: state.emergencyUnits.map((item) =>
      item.id === unitId
        ? {
            ...item,
            assignedIncidentId: incidentId,
            status: "en-route",
            etaMinutes: route.etaMinutes,
            routeRisk,
            routeEdgeIds: route.traversedEdgeIds,
            fuel: clamp(item.fuel - 5, 0, 100),
            fatigue: clamp(item.fatigue + 3, 0, 100),
          }
        : item
    ),
    mentorLog: appendLog(
      state,
      `Manual dispatch: ${unit.type} -> ${incident.hazardType} (${incident.priority}) ETA ${route.etaMinutes}m risk ${routeRisk}`
    ),
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
    case "set-corridor-emergency-only":
      return {
        ...state,
        evacuationCorridors: state.evacuationCorridors.map((corridor) =>
          corridor.id === action.payload.corridorId ? { ...corridor, emergencyOnly: action.payload.emergencyOnly } : corridor
        ),
      };
    case "set-corridor-restricted":
      return {
        ...state,
        evacuationCorridors: state.evacuationCorridors.map((corridor) =>
          corridor.id === action.payload.corridorId ? { ...corridor, restricted: action.payload.restricted } : corridor
        ),
      };
    case "set-corridor-priority":
      return {
        ...state,
        evacuationCorridors: state.evacuationCorridors.map((corridor) =>
          corridor.id === action.payload.corridorId
            ? { ...corridor, priority: clamp(action.payload.priority, 0, 100) }
            : corridor
        ),
      };
    case "toggle-shelter":
      return {
        ...state,
        shelters: state.shelters.map((shelter) =>
          shelter.id === action.payload.shelterId ? { ...shelter, open: action.payload.open } : shelter
        ),
      };
    case "assign-unit-incident":
      return withManualDispatch(state, action.payload.unitId, action.payload.incidentId);
    case "set-incident-priority":
      return {
        ...state,
        incidents: state.incidents.map((incident) =>
          incident.id === action.payload.incidentId
            ? {
                ...incident,
                priority: action.payload.priority,
                urgency: clamp(
                  incident.urgency +
                    (action.payload.priority === "catastrophic"
                      ? 20
                      : action.payload.priority === "critical"
                      ? 12
                      : action.payload.priority === "urgent"
                      ? 6
                      : -3),
                  0,
                  100
                ),
              }
            : incident
        ),
      };
    case "toggle-policy":
      return {
        ...state,
        policies: state.policies.map((policy) =>
          policy.policy === action.payload.policy ? { ...policy, active: action.payload.active } : policy
        ),
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
