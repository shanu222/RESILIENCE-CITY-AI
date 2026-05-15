import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { CityCanvas } from "./CityCanvas";
import { ControlPanel } from "./ControlPanel";
import { StatusBar } from "./StatusBar";
import { useGameSimulation } from "../../game/useGameSimulation";
import { useAuthStore } from "../stores/authStore";
import { usePlayerProfile } from "../hooks/usePlayerProfile";

const AIMentor = lazy(() => import("./AIMentor").then((module) => ({ default: module.AIMentor })));
const MissionPanel = lazy(() => import("./MissionPanel").then((module) => ({ default: module.MissionPanel })));
const BuildingTools = lazy(() => import("./BuildingTools").then((module) => ({ default: module.BuildingTools })));
const DisasterPanel = lazy(() => import("./DisasterPanel").then((module) => ({ default: module.DisasterPanel })));
const RescuePanel = lazy(() => import("./RescuePanel").then((module) => ({ default: module.RescuePanel })));
const ClimatePanel = lazy(() => import("./ClimatePanel").then((module) => ({ default: module.ClimatePanel })));
const RegionalStandardsPanel = lazy(() =>
  import("./RegionalStandardsPanel").then((module) => ({ default: module.RegionalStandardsPanel }))
);

interface GameInterfaceProps {
  onBack: () => void;
  initialMode: "campaign" | "sandbox";
}

export function GameInterface({ onBack, initialMode }: GameInterfaceProps) {
  const [activePanel, setActivePanel] = useState<
    "missions" | "build" | "disasters" | "rescue" | "climate" | "regions" | null
  >("missions");
  const [showMentor, setShowMentor] = useState(true);
  const { state, actions, saveNow, loadNow } = useGameSimulation();
  const token = useAuthStore((store) => store.token);
  const playerProfile = usePlayerProfile(Boolean(token));

  useEffect(() => {
    actions.setMode(initialMode);
  }, [actions, initialMode]);

  const eventFeed = useMemo(
    () =>
      [state.activeDisaster ? `${state.activeDisaster.type.toUpperCase()} EVENT ACTIVE` : "No active incident", ...state.warnings]
        .slice(0, 4),
    [state.activeDisaster, state.warnings]
  );

  return (
    <div className="relative size-full bg-slate-900 overflow-hidden">
      {/* Main Canvas Area */}
      <CityCanvas
        state={state}
        onSelectDistrict={(districtId) => actions.selectDistrict(districtId)}
        onOverlayChange={(overlay) => actions.setOverlay(overlay)}
      />

      {/* Status Bar */}
      <StatusBar
        onBack={onBack}
        state={state}
        onSave={saveNow}
        onLoad={loadNow}
        onReset={actions.reset}
      />

      {/* Control Panel */}
      <ControlPanel
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onToggleMentor={() => setShowMentor(!showMentor)}
        onToggleMultiplayer={actions.toggleMultiplayer}
      />

      {/* AI Mentor */}
      {showMentor && (
        <Suspense fallback={null}>
          <AIMentor state={state} />
        </Suspense>
      )}

      {/* Mission Panel */}
      {activePanel === 'missions' && (
        <Suspense fallback={null}>
          <MissionPanel
            missions={state.missions}
            learning={state.learning}
            unlockedTech={state.unlockedTech}
            onStartMission={(missionId) => actions.startMission(missionId)}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Building Tools */}
      {activePanel === 'build' && (
        <Suspense fallback={null}>
          <BuildingTools
            budget={state.budget}
            districts={state.districts}
            selectedDistrictId={state.map.selectedDistrictId}
            professionalMode={state.learning.professionalMode}
            onToggleProfessionalMode={actions.toggleProfessionalMode}
            onBuild={(templateId, districtId, blueprint) => actions.build(templateId, districtId, blueprint)}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Disaster Panel */}
      {activePanel === 'disasters' && (
        <Suspense fallback={null}>
          <DisasterPanel
            region={state.region}
            activeDisaster={
              state.activeDisaster
                ? { type: state.activeDisaster.type, intensity: state.activeDisaster.intensity }
                : null
            }
            onTrigger={(disaster, intensity) => actions.triggerDisaster(disaster, intensity)}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Rescue Panel */}
      {activePanel === "rescue" && (
        <Suspense fallback={null}>
          <RescuePanel
            rescue={state.rescue}
            citizens={state.citizens}
            districts={state.districts}
            activeDisasterType={state.activeDisaster?.type ?? null}
            onRunOperation={(operation) => actions.runRescue(operation)}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Climate Panel */}
      {activePanel === "climate" && (
        <Suspense fallback={null}>
          <ClimatePanel
            climate={state.climate}
            resilienceScore={state.resilienceScore}
            sustainabilityScore={state.sustainabilityScore}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Regional Standards Panel */}
      {activePanel === "regions" && (
        <Suspense fallback={null}>
          <RegionalStandardsPanel
            selectedRegionId={state.region.id}
            onSelectRegion={(regionId) => actions.setRegion(regionId)}
            onClose={() => setActivePanel(null)}
          />
        </Suspense>
      )}

      {/* Live system feed */}
      <div className="absolute left-3 md:left-6 top-24 z-20 w-[min(92vw,28rem)]">
        <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-3 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-slate-100 font-semibold text-sm">Command Feed</h3>
            <span className="text-xs text-slate-400 capitalize">{state.mode} mode</span>
          </div>
          {playerProfile.data?.user && (
            <p className="text-xs text-slate-400 mb-2">
              Operator: {playerProfile.data.user.displayName} ({playerProfile.data.user.provider})
            </p>
          )}
          <div className="space-y-1.5">
            {eventFeed.map((line) => (
              <p key={line} className="text-xs text-slate-300">
                • {line}
              </p>
            ))}
          </div>
          <div className="mt-3 pt-2 border-t border-slate-700 text-xs text-slate-400 grid grid-cols-2 gap-2">
            <span>Citizens safe: {Math.round(state.citizens.safe)}</span>
            <span>Panic: {Math.round(state.citizens.panic)}</span>
            <span>Structures: {state.buildings.length}</span>
            <span>Risk score: {Math.round(state.riskScore)}</span>
            <span>Overlay: {state.map.activeOverlay}</span>
            <span>District: {state.districts.find((d) => d.id === state.map.selectedDistrictId)?.name ?? "N/A"}</span>
            <span>Power health: {Math.round(state.economy.powerGridHealth)}</span>
            <span>Citizens tracked: {state.citizenAgents.length}</span>
          </div>
        </div>
      </div>

      {/* Multiplayer status framework */}
      <div className="absolute bottom-6 right-3 md:right-6 z-20">
        <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-3 backdrop-blur-md text-xs text-slate-300 min-w-52">
          <p className="font-semibold text-slate-100 mb-1">Multiplayer Framework</p>
          <p>State: {state.multiplayer.enabled ? "Enabled" : "Disabled"}</p>
          <p>Team: {state.multiplayer.teammateCount} operator(s)</p>
          <p>Coordination: {Math.round(state.multiplayer.coordinationScore)}/100</p>
          <button
            onClick={actions.addTeammate}
            className="mt-2 w-full rounded-md bg-slate-800 hover:bg-slate-700 px-2 py-1.5"
          >
            Add Teammate Slot
          </button>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="absolute top-24 right-[5.5rem] z-20 hidden lg:flex gap-2">
        <button
          onClick={() => actions.setMode("campaign")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            state.mode === "campaign"
              ? "bg-blue-600/70 text-white border-blue-400"
              : "bg-slate-900/70 text-slate-200 border-slate-600"
          }`}
        >
          Campaign
        </button>
        <button
          onClick={() => actions.setMode("sandbox")}
          className={`px-3 py-1.5 rounded-lg text-xs border ${
            state.mode === "sandbox"
              ? "bg-emerald-600/70 text-white border-emerald-400"
              : "bg-slate-900/70 text-slate-200 border-slate-600"
          }`}
        >
          Sandbox
        </button>
      </div>
    </div>
  );
}
