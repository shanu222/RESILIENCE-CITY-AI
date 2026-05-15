import { motion } from "motion/react";
import { X, Ambulance, Flame, Plane, LifeBuoy, ShieldAlert } from "lucide-react";
import { IconButton, Paper } from "@mui/material";
import type { CitizenState, DistrictState, EmergencyUnit, Incident, RescueState } from "../../game/types";

interface RescuePanelProps {
  rescue: RescueState;
  citizens: CitizenState;
  districts: DistrictState[];
  incidents: Incident[];
  emergencyUnits: EmergencyUnit[];
  activeDisasterType: string | null;
  onRunOperation: (operation: "usar" | "triage" | "evacuate" | "airlift" | "fireline") => void;
  onClose: () => void;
}

export function RescuePanel({
  rescue,
  citizens,
  districts,
  incidents,
  emergencyUnits,
  activeDisasterType,
  onRunOperation,
  onClose,
}: RescuePanelProps) {
  const operations = [
    { id: "usar", icon: ShieldAlert, name: "USAR", detail: "Collapsed structure extraction and search" },
    { id: "triage", icon: Ambulance, name: "Triage", detail: "Priority medical classification and stabilization" },
    { id: "evacuate", icon: LifeBuoy, name: "Evacuate", detail: "Mass shelter routing and crowd management" },
    { id: "airlift", icon: Plane, name: "Airlift", detail: "Critical patient transfer to hospitals" },
    { id: "fireline", icon: Flame, name: "Fireline", detail: "Fire containment and hazard perimeter control" },
  ] as const;

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
                      sev {Math.round(incident.severity)} | {incident.status}
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
