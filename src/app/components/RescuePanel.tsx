import { motion } from "motion/react";
import { X, Ambulance, Flame, Plane, LifeBuoy, ShieldAlert } from "lucide-react";
import { IconButton, Paper } from "@mui/material";
import { useMemo, useState } from "react";
import type {
  CitizenState,
  DistrictState,
  EmergencyPolicy,
  EmergencyUnit,
  EvacuationCorridor,
  Incident,
  RescueState,
  ShelterState,
} from "../../game/types";

interface RescuePanelProps {
  rescue: RescueState;
  citizens: CitizenState;
  districts: DistrictState[];
  incidents: Incident[];
  emergencyUnits: EmergencyUnit[];
  corridors: EvacuationCorridor[];
  shelters: ShelterState[];
  policies: {
    policy: EmergencyPolicy;
    active: boolean;
    impact: { trust: number; panic: number; economy: number; evacuationSpeed: number };
  }[];
  activeDisasterType: string | null;
  onRunOperation: (operation: "usar" | "triage" | "evacuate" | "airlift" | "fireline") => void;
  onAssignUnitIncident: (unitId: string, incidentId: string) => void;
  onSetIncidentPriority: (incidentId: string, priority: Incident["priority"]) => void;
  onToggleShelter: (shelterId: string, open: boolean) => void;
  onSetCorridorEmergencyOnly: (corridorId: string, emergencyOnly: boolean) => void;
  onSetCorridorRestricted: (corridorId: string, restricted: boolean) => void;
  onSetCorridorPriority: (corridorId: string, priority: number) => void;
  onTogglePolicy: (policy: EmergencyPolicy, active: boolean) => void;
  onClose: () => void;
}

export function RescuePanel({
  rescue,
  citizens,
  districts,
  incidents,
  emergencyUnits,
  corridors,
  shelters,
  policies,
  activeDisasterType,
  onRunOperation,
  onAssignUnitIncident,
  onSetIncidentPriority,
  onToggleShelter,
  onSetCorridorEmergencyOnly,
  onSetCorridorRestricted,
  onSetCorridorPriority,
  onTogglePolicy,
  onClose,
}: RescuePanelProps) {
  const operations = [
    { id: "usar", icon: ShieldAlert, name: "USAR", detail: "Collapsed structure extraction and search" },
    { id: "triage", icon: Ambulance, name: "Triage", detail: "Priority medical classification and stabilization" },
    { id: "evacuate", icon: LifeBuoy, name: "Evacuate", detail: "Mass shelter routing and crowd management" },
    { id: "airlift", icon: Plane, name: "Airlift", detail: "Critical patient transfer to hospitals" },
    { id: "fireline", icon: Flame, name: "Fireline", detail: "Fire containment and hazard perimeter control" },
  ] as const;
  const [selectedUnit, setSelectedUnit] = useState<string>(emergencyUnits[0]?.id ?? "");
  const [selectedIncident, setSelectedIncident] = useState<string>(incidents[0]?.id ?? "");
  const activeIncidents = useMemo(
    () => incidents.filter((incident) => incident.status !== "resolved").sort((a, b) => b.urgency - a.urgency),
    [incidents]
  );

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35 }}
      className="absolute right-72 top-24 w-[min(92vw,520px)] z-20"
    >
      <Paper
        elevation={10}
        sx={{
          background: "linear-gradient(135deg, rgba(25, 18, 18, 0.98) 0%, rgba(35, 24, 24, 0.98) 100%)",
          border: "1px solid rgba(248, 113, 113, 0.3)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-xl">Rescue Operations</h3>
            <p className="text-red-100 text-sm">ICS command, USAR, triage, logistics, and evacuation control</p>
          </div>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <X />
          </IconButton>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Panic</p>
            <p className="text-red-300 font-semibold">{Math.round(citizens.panic)}/100</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Injured</p>
            <p className="text-orange-300 font-semibold">{Math.round(citizens.injured)}</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Shelters Open</p>
            <p className="text-emerald-300 font-semibold">{rescue.sheltersOpen}</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Triage Efficiency</p>
            <p className="text-blue-300 font-semibold">{Math.round(rescue.triageEfficiency)}/100</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Command Latency</p>
            <p className="text-amber-300 font-semibold">{Math.round(rescue.commandLatency)} sec</p>
          </div>
          <div className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
            <p className="text-slate-300 text-sm">Blocked Routes</p>
            <p className="text-rose-300 font-semibold">{Math.round(rescue.blockedRoutes)}</p>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-300 mb-2">
              Incident map feed {activeDisasterType ? `(${activeDisasterType.toUpperCase()})` : "(No active disaster)"}
            </p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {districts
                .slice()
                .sort((a, b) => b.dynamic.isolation - a.dynamic.isolation)
                .slice(0, 4)
                .map((district) => (
                  <div key={district.id} className="flex items-center justify-between text-xs text-slate-200">
                    <span>{district.name}</span>
                    <span>
                      isolation {Math.round(district.dynamic.isolation)} | traffic {Math.round(district.dynamic.trafficLoad)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mb-3">
            <p className="text-xs text-slate-300 mb-2">Dispatch queue</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {incidents
                .filter((incident) => incident.status !== "resolved")
                .sort((a, b) => b.urgency - a.urgency)
                .slice(0, 4)
                .map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between text-xs text-slate-200">
                    <span>{incident.hazardType}</span>
                    <span>
                      sev {Math.round(incident.severity)} | {incident.priority}
                    </span>
                  </div>
                ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3">
            <p className="text-xs text-slate-300 mb-2">Unit telemetry</p>
            <div className="space-y-1 max-h-20 overflow-y-auto">
              {emergencyUnits.slice(0, 5).map((unit) => (
                <div key={unit.id} className="flex items-center justify-between text-xs text-slate-200">
                  <span>{unit.type}</span>
                  <span>
                    {unit.status} | ETA {unit.etaMinutes ?? "-"}m
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mt-3">
            <p className="text-xs text-slate-300 mb-2">Manual dispatch control</p>
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <select
                value={selectedUnit}
                onChange={(event) => setSelectedUnit(event.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
              >
                {emergencyUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.type} ({unit.status})
                  </option>
                ))}
              </select>
              <select
                value={selectedIncident}
                onChange={(event) => setSelectedIncident(event.target.value)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
              >
                {activeIncidents.map((incident) => (
                  <option key={incident.id} value={incident.id}>
                    {incident.hazardType} / {incident.priority}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => selectedUnit && selectedIncident && onAssignUnitIncident(selectedUnit, selectedIncident)}
              className="w-full rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold px-3 py-2"
            >
              Assign Unit To Incident
            </button>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mt-3">
            <p className="text-xs text-slate-300 mb-2">Incident priority layers</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {activeIncidents.slice(0, 4).map((incident) => (
                <div key={incident.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-200">{incident.hazardType}</span>
                  <select
                    value={incident.priority}
                    onChange={(event) => onSetIncidentPriority(incident.id, event.target.value as Incident["priority"])}
                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
                  >
                    <option value="low">low</option>
                    <option value="urgent">urgent</option>
                    <option value="critical">critical</option>
                    <option value="catastrophic">catastrophic</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mt-3">
            <p className="text-xs text-slate-300 mb-2">Evacuation corridors</p>
            <div className="space-y-2 max-h-24 overflow-y-auto">
              {corridors.map((corridor) => (
                <div key={corridor.id} className="text-xs text-slate-200 border border-slate-700 rounded-md p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span>{corridor.name}</span>
                    <span>risk {Math.round(corridor.risk)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSetCorridorEmergencyOnly(corridor.id, !corridor.emergencyOnly)}
                      className={`px-2 py-1 rounded ${
                        corridor.emergencyOnly ? "bg-cyan-600 text-white" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      emergency
                    </button>
                    <button
                      onClick={() => onSetCorridorRestricted(corridor.id, !corridor.restricted)}
                      className={`px-2 py-1 rounded ${
                        corridor.restricted ? "bg-rose-600 text-white" : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      restrict
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={corridor.priority}
                      onChange={(event) => onSetCorridorPriority(corridor.id, Number(event.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mt-3">
            <p className="text-xs text-slate-300 mb-2">Shelter routing</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {shelters.map((shelter) => (
                <div key={shelter.id} className="flex items-center justify-between text-xs text-slate-200 gap-2">
                  <span>
                    {shelter.name} ({Math.round((shelter.occupancy / Math.max(1, shelter.capacity)) * 100)}%)
                  </span>
                  <button
                    onClick={() => onToggleShelter(shelter.id, !shelter.open)}
                    className={`px-2 py-1 rounded ${shelter.open ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    {shelter.open ? "open" : "closed"}
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-900/65 border border-slate-700 rounded-xl p-3 mt-3">
            <p className="text-xs text-slate-300 mb-2">Emergency policy system</p>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {policies.map((policy) => (
                <div key={policy.policy} className="flex items-center justify-between text-xs text-slate-200 gap-2">
                  <span>{policy.policy.replaceAll("_", " ")}</span>
                  <button
                    onClick={() => onTogglePolicy(policy.policy, !policy.active)}
                    className={`px-2 py-1 rounded ${policy.active ? "bg-violet-600 text-white" : "bg-slate-700 text-slate-300"}`}
                  >
                    {policy.active ? "active" : "off"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-2">
          {operations.map((operation) => {
            const Icon = operation.icon;
            return (
              <button
                key={operation.id}
                onClick={() => onRunOperation(operation.id)}
                className="w-full bg-slate-900/65 hover:bg-slate-800 border border-slate-700 hover:border-red-400 rounded-xl px-4 py-3 text-left transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-red-300" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{operation.name}</p>
                    <p className="text-slate-300 text-xs">{operation.detail}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </Paper>
    </motion.div>
  );
}
