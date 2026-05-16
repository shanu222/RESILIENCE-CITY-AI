import { motion } from "motion/react";
import { Brain, Lightbulb, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Paper } from "@mui/material";
import type { GameState } from "../../game/types";

interface AIMentorProps {
  state: GameState;
}

export function AIMentor({ state }: AIMentorProps) {
  const selectedDistrict =
    state.districts.find((district) => district.id === state.map.selectedDistrictId) ?? state.districts[0];
  const highestIncident = state.incidents
    .filter((incident) => incident.status !== "resolved")
    .sort((a, b) => b.urgency - a.urgency)[0];
  const weakestNode = state.infrastructureNodes.slice().sort((a, b) => a.health - b.health)[0];
  const overloadedShelter = state.shelters
    .filter((shelter) => shelter.open)
    .sort((a, b) => b.occupancy / Math.max(1, b.capacity) - a.occupancy / Math.max(1, a.capacity))[0];
  const fragileCorridor = state.evacuationCorridors
    .slice()
    .sort((a, b) => b.risk - a.risk)[0];
  const messages = [
    {
      type: "info",
      text: state.mentorLog[0] ?? "Welcome. Start by mapping hazard exposure before construction.",
      icon: Brain,
    },
    {
      type: state.activeDisaster ? "warning" : "tip",
      text: state.activeDisaster
        ? "Active disaster detected. Prioritize evacuation routes, triage zones, and critical infrastructure protection."
        : `Analyze ${selectedDistrict.name} overlay data before placing new assets.`,
      icon: state.activeDisaster ? AlertTriangle : Lightbulb,
    },
    {
      type: highestIncident ? "warning" : "info",
      text: highestIncident
        ? `${selectedDistrict.name} command forecast: ${highestIncident.hazardType} queue may escalate if dispatch ETA exceeds 8 minutes.`
        : "No high-priority incidents queued. Continue proactive retrofit scheduling.",
      icon: AlertTriangle,
    },
    {
      type: "warning",
      text:
        overloadedShelter && overloadedShelter.occupancy / Math.max(1, overloadedShelter.capacity) > 0.88
          ? `${overloadedShelter.name} may exceed safe capacity soon. Open alternate shelter corridors now.`
          : fragileCorridor
          ? `${fragileCorridor.name} risk is rising; prioritize emergency-only routing for vulnerable evacuations.`
          : "Shelter and corridor status stable.",
      icon: AlertTriangle,
    },
  ];

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="absolute left-3 md:left-6 bottom-6 w-[min(92vw,24rem)] z-20"
    >
      <Paper
        elevation={8}
        sx={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">AI Engineering Mentor</h3>
            <p className="text-blue-100 text-xs">Real-time guidance & analysis</p>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {messages.map((message, i) => {
            const Icon = message.icon;
            const colors = {
              info: "bg-blue-500/20 border-blue-500/40 text-blue-200",
              tip: "bg-yellow-500/20 border-yellow-500/40 text-yellow-200",
              warning: "bg-red-500/20 border-red-500/40 text-red-200",
              success: "bg-green-500/20 border-green-500/40 text-green-200",
            };

            return (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className={`p-3 rounded-lg border ${colors[message.type as keyof typeof colors]}`}
              >
                <div className="flex gap-3">
                  <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </div>
              </motion.div>
            );
          })}

          {/* Analysis Box */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <h4 className="text-white text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              Site Analysis
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Earthquake Risk:</span>
                <span className="text-red-400 font-semibold">{Math.round(state.region.seismicRisk * 100)} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Flood Risk:</span>
                <span className="text-yellow-400 font-semibold">{Math.round(state.region.floodRisk * 100)} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Drought Risk:</span>
                <span className="text-blue-400 font-semibold">{Math.round(state.region.droughtRisk * 100)} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wind Exposure:</span>
                <span className="text-green-400 font-semibold">{Math.round(state.region.windRisk * 100)} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">District Water:</span>
                <span className="text-cyan-400 font-semibold">{Math.round(selectedDistrict.dynamic.waterLevel)} / 100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Road Accessibility:</span>
                <span className="text-amber-400 font-semibold">
                  {Math.round(
                    state.roadGraph.edges.reduce((acc, edge) => acc + edge.accessibility, 0) /
                      Math.max(1, state.roadGraph.edges.length)
                  )}{" "}
                  / 100
                </span>
              </div>
            </div>
          </motion.div>

          {/* Recommendations */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="bg-emerald-900/30 border border-emerald-700/40 rounded-lg p-4"
          >
            <h4 className="text-emerald-200 text-sm font-semibold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Recommended Actions
            </h4>
            <ul className="space-y-2 text-xs text-emerald-100">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>
                  {state.region.codeGuidance[0] ?? "Use reinforced framing and avoid weak soft-story configurations"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{state.region.codeGuidance[1] ?? "Elevate vulnerable structures in flood pathways"}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>{state.region.codeGuidance[2] ?? "Integrate drainage channels around high-risk zones"}</span>
              </li>
              {weakestNode && (
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">•</span>
                  <span>
                    Protect {weakestNode.kind} node ({Math.round(weakestNode.health)} health) to avoid cascading outages.
                  </span>
                </li>
              )}
            </ul>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-slate-300">
              Resilience: <span className="text-emerald-300">{Math.round(state.resilienceScore)}</span>
            </div>
            <div className="bg-slate-800/60 rounded-lg px-3 py-2 text-slate-300">
              Risk: <span className="text-orange-300">{Math.round(state.riskScore)}</span>
            </div>
          </div>
        </div>
      </Paper>
    </motion.div>
  );
}
