import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createInitialState, gameReducer, loadGame, saveGame, type GameAction } from "./engine";
import type { BuildingBlueprint, DisasterType, GameState, HazardOverlay, RegionId } from "./types";
import { dispatchGameAction, guestLogin, loadCityState, saveCityState, setApiToken } from "../app/services/api";
import { connectSocket, getSocket } from "../app/services/socket";
import { useAuthStore } from "../app/stores/authStore";

function normalizeGameState(input: unknown, base?: GameState): GameState {
  const initial = base ?? createInitialState();
  if (!input || typeof input !== "object") return initial;
  const candidate = input as Partial<GameState>;
  return {
    ...initial,
    ...candidate,
    climate: { ...initial.climate, ...(candidate.climate ?? {}) },
    citizens: { ...initial.citizens, ...(candidate.citizens ?? {}) },
    rescue: { ...initial.rescue, ...(candidate.rescue ?? {}) },
    economy: { ...initial.economy, ...(candidate.economy ?? {}) },
    resources: { ...initial.resources, ...(candidate.resources ?? {}) },
    learning: { ...initial.learning, ...(candidate.learning ?? {}) },
    map: { ...initial.map, ...(candidate.map ?? {}) },
    hospitals: candidate.hospitals?.length ? candidate.hospitals : initial.hospitals,
    infrastructureNodes: candidate.infrastructureNodes?.length
      ? candidate.infrastructureNodes
      : initial.infrastructureNodes,
    roadGraph: {
      ...initial.roadGraph,
      ...(candidate.roadGraph ?? {}),
      nodes: candidate.roadGraph?.nodes?.length ? candidate.roadGraph.nodes : initial.roadGraph.nodes,
      edges: candidate.roadGraph?.edges?.length ? candidate.roadGraph.edges : initial.roadGraph.edges,
    },
    evacuationCorridors: candidate.evacuationCorridors?.length
      ? candidate.evacuationCorridors
      : initial.evacuationCorridors,
    shelters: candidate.shelters?.length ? candidate.shelters : initial.shelters,
    policies: candidate.policies?.length ? candidate.policies : initial.policies,
    incidents: candidate.incidents?.length ? candidate.incidents : initial.incidents,
    emergencyUnits: candidate.emergencyUnits?.length ? candidate.emergencyUnits : initial.emergencyUnits,
    districts: candidate.districts?.length ? candidate.districts : initial.districts,
    citizenAgents: candidate.citizenAgents?.length ? candidate.citizenAgents : initial.citizenAgents,
    missions: candidate.missions?.length ? candidate.missions : initial.missions,
    buildings:
      candidate.buildings?.map((building) => ({
        ...building,
        districtId: (building as any).districtId ?? initial.map.selectedDistrictId,
        blueprint: (building as any).blueprint ?? {
          foundation: "raft",
          structuralSystem: "moment-frame",
          material: "reinforced-concrete",
          reinforcementLevel: 50,
          drainageCapacity: 50,
          exits: 2,
          utilityResilience: 50,
          floorCount: 3,
          roomDensity: 50,
        },
        failure: (building as any).failure ?? {
          crack: 0,
          settlement: 0,
          thermal: 0,
          fire: 0,
          resonance: 0,
          lean: 0,
        },
      })) ?? initial.buildings,
  };
}

export function useGameSimulation() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    const loaded = loadGame();
    return normalizeGameState(loaded);
  });
  const cityIdRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const stateRef = useRef<GameState>(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const normalizeState = useCallback((input: unknown, base?: GameState): GameState => {
    return normalizeGameState(input, base);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const authStore = useAuthStore.getState();
      if (!authStore.token) {
        const auth = await guestLogin();
        if (cancelled) return;
        authStore.setAuth(auth);
      } else {
        setApiToken(authStore.token);
      }

      const game = await loadCityState();
      if (cancelled) return;
      cityIdRef.current = game.cityId;
      useAuthStore.getState().setCityId(game.cityId);
      dispatch({ type: "load", payload: normalizeState(game.state, stateRef.current) });
      hydratedRef.current = true;

      const token = useAuthStore.getState().token;
      if (!token) return;
      const socket = connectSocket(token);
      socket.emit("city:join", { cityId: game.cityId });
      socket.off("city:state");
      socket.on("city:state", (nextState) => {
        dispatch({ type: "load", payload: normalizeState(nextState, stateRef.current) });
      });
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [normalizeState]);

  useEffect(() => {
    saveGame(state);
    if (hydratedRef.current && cityIdRef.current) {
      void saveCityState(cityIdRef.current, state);
    }
  }, [state]);

  const sendAction = useCallback((action: GameAction) => {
    dispatch(action);
    if (cityIdRef.current) {
      void dispatchGameAction(cityIdRef.current, action);
    }
  }, []);

  const actions = useMemo(
    () => ({
      build: (templateId: string, districtId?: string, blueprint?: Partial<BuildingBlueprint>) =>
        sendAction({
          type: "build",
          payload: { templateId, districtId, blueprint },
        }),
      triggerDisaster: (disaster: DisasterType, intensity: number) =>
        sendAction({ type: "trigger-disaster", payload: { disaster, intensity } }),
      runRescue: (operation: "usar" | "triage" | "evacuate" | "airlift" | "fireline") =>
        sendAction({ type: "run-rescue", payload: operation }),
      setRegion: (regionId: RegionId) => sendAction({ type: "set-region", payload: regionId }),
      setMode: (mode: "campaign" | "sandbox") => sendAction({ type: "set-mode", payload: mode }),
      startMission: (missionId: string) => sendAction({ type: "start-mission", payload: { missionId } }),
      selectDistrict: (districtId: string) => sendAction({ type: "select-district", payload: { districtId } }),
      setOverlay: (overlay: HazardOverlay) => sendAction({ type: "set-overlay", payload: { overlay } }),
      setCorridorEmergencyOnly: (corridorId: string, emergencyOnly: boolean) =>
        sendAction({ type: "set-corridor-emergency-only", payload: { corridorId, emergencyOnly } }),
      setCorridorRestricted: (corridorId: string, restricted: boolean) =>
        sendAction({ type: "set-corridor-restricted", payload: { corridorId, restricted } }),
      setCorridorPriority: (corridorId: string, priority: number) =>
        sendAction({ type: "set-corridor-priority", payload: { corridorId, priority } }),
      toggleShelter: (shelterId: string, open: boolean) =>
        sendAction({ type: "toggle-shelter", payload: { shelterId, open } }),
      assignUnitIncident: (unitId: string, incidentId: string) =>
        sendAction({ type: "assign-unit-incident", payload: { unitId, incidentId } }),
      setIncidentPriority: (
        incidentId: string,
        priority: "low" | "urgent" | "critical" | "catastrophic"
      ) => sendAction({ type: "set-incident-priority", payload: { incidentId, priority } }),
      togglePolicy: (
        policy:
          | "city_evacuation"
          | "curfew"
          | "emergency_broadcast"
          | "school_closure"
          | "transport_shutdown"
          | "fuel_rationing",
        active: boolean
      ) => sendAction({ type: "toggle-policy", payload: { policy, active } }),
      toggleProfessionalMode: () => sendAction({ type: "toggle-professional-mode" }),
      toggleMultiplayer: () => sendAction({ type: "toggle-multiplayer" }),
      addTeammate: () => sendAction({ type: "add-teammate" }),
      reset: () => sendAction({ type: "reset" }),
    }),
    [sendAction]
  );

  const saveNow = useCallback(() => {
    saveGame(state);
    if (cityIdRef.current) {
      void saveCityState(cityIdRef.current, state);
    }
  }, [state]);

  const loadNow = useCallback(() => {
    const socket = getSocket();
    if (socket && cityIdRef.current) {
      void loadCityState().then((data) => {
        dispatch({ type: "load", payload: normalizeState(data.state) });
      });
      return;
    }
    const loaded = loadGame();
    if (loaded) dispatch({ type: "load", payload: normalizeState(loaded, stateRef.current) });
  }, [normalizeState]);

  return { state, actions, saveNow, loadNow };
}
