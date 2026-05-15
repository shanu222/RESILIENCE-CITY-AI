import { motion } from "motion/react";
import { X, Thermometer, CloudRain, Wind, Waves, Sun } from "lucide-react";
import { Paper, IconButton } from "@mui/material";
import type { ClimateState } from "../../game/types";

interface ClimatePanelProps {
  climate: ClimateState;
  resilienceScore: number;
  sustainabilityScore: number;
  onClose: () => void;
}

function metricColor(value: number): string {
  if (value >= 75) return "text-emerald-300";
  if (value >= 45) return "text-yellow-300";
  return "text-red-300";
}

export function ClimatePanel({
  climate,
  resilienceScore,
  sustainabilityScore,
  onClose,
}: ClimatePanelProps) {
  const cards = [
    { icon: Thermometer, label: "Temperature", value: `${climate.temperatureC.toFixed(1)} C` },
    { icon: CloudRain, label: "Rainfall Pressure", value: `${Math.round(climate.rainfallMm)} mm` },
    { icon: Wind, label: "Air Quality", value: `${Math.round(climate.airQuality)}/100` },
    { icon: Sun, label: "Urban Heat", value: `${Math.round(climate.urbanHeat)}/100` },
    { icon: Waves, label: "Sea Level Stress", value: `${Math.round(climate.seaLevelStress)}/100` },
    { icon: Wind, label: "Wind Speed", value: `${Math.round(climate.windKph)} kph` },
    { icon: CloudRain, label: "Lightning Risk", value: `${Math.round(climate.lightningRisk)}/100` },
    { icon: Waves, label: "Sea Rise", value: `${climate.seaLevelRiseCm.toFixed(2)} cm` },
  ];

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
          background: "linear-gradient(135deg, rgba(12, 20, 38, 0.98) 0%, rgba(22, 35, 54, 0.98) 100%)",
          border: "1px solid rgba(56, 189, 248, 0.3)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-xl">Climate Engine</h3>
            <p className="text-cyan-100 text-sm">Live environmental simulation and adaptation metrics</p>
          </div>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <X />
          </IconButton>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3 max-h-[52vh] overflow-y-auto">
          {cards.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-slate-900/70 border border-slate-700 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-cyan-300" />
                <span className="text-slate-300 text-sm">{label}</span>
              </div>
              <p className="text-white font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-700 p-4 bg-slate-900/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">Resilience Score</span>
            <span className={metricColor(resilienceScore)}>{Math.round(resilienceScore)}/100</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-300">Sustainability Score</span>
            <span className={metricColor(sustainabilityScore)}>{Math.round(sustainabilityScore)}/100</span>
          </div>
        </div>
      </Paper>
    </motion.div>
  );
}
