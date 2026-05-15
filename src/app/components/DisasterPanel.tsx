import { motion } from "motion/react";
import { X, Cloud, Waves, Flame, Wind, Thermometer, AlertTriangle, Zap, Mountain } from "lucide-react";
import { Paper, IconButton, Slider } from "@mui/material";
import { useState } from "react";
import type { DisasterType, RegionProfile } from "../../game/types";

interface DisasterPanelProps {
  onClose: () => void;
  region: RegionProfile;
  onTrigger: (disaster: DisasterType, intensity: number) => void;
  activeDisaster: { type: string; intensity: number } | null;
}

export function DisasterPanel({ onClose, region, onTrigger, activeDisaster }: DisasterPanelProps) {
  const [intensity, setIntensity] = useState(5);

  const disasters = [
    {
      icon: Zap,
      name: 'Earthquake',
      description: 'Seismic activity and structural stress',
      color: 'from-orange-500 to-red-500',
      severity: 'High',
      probability: `${Math.round(region.seismicRisk * 100)}%`,
      type: "earthquake" as DisasterType,
    },
    {
      icon: Waves,
      name: 'Flood',
      description: 'Rising water levels and erosion',
      color: 'from-blue-500 to-cyan-500',
      severity: 'Very High',
      probability: `${Math.round(region.floodRisk * 100)}%`,
      type: "flood" as DisasterType,
    },
    {
      icon: Flame,
      name: 'Urban Fire',
      description: 'Fire spread and smoke hazards',
      color: 'from-red-500 to-orange-500',
      severity: 'Medium',
      probability: `${Math.round(region.wildfireRisk * 100)}%`,
      type: "wildfire" as DisasterType,
    },
    {
      icon: Thermometer,
      name: 'Heatwave',
      description: 'Extreme temperatures and power demand',
      color: 'from-yellow-500 to-red-500',
      severity: 'High',
      probability: `${Math.round(region.heatRisk * 100)}%`,
      type: "heatwave" as DisasterType,
    },
    {
      icon: Wind,
      name: 'Cyclone',
      description: 'High winds and coastal damage',
      color: 'from-slate-500 to-blue-500',
      severity: 'Medium',
      probability: `${Math.round(region.windRisk * 100)}%`,
      type: "cyclone" as DisasterType,
    },
    {
      icon: Cloud,
      name: 'Smog Crisis',
      description: 'Air pollution and health emergency',
      color: 'from-gray-500 to-slate-500',
      severity: 'Medium',
      probability: `${Math.round((1 - region.seismicRisk) * 55 + region.heatRisk * 25)}%`,
      type: "smog" as DisasterType,
    },
    {
      icon: Mountain,
      name: "Landslide",
      description: "Slope failure and road blockage",
      color: "from-amber-700 to-orange-500",
      severity: "High",
      probability: `${Math.round(region.slopeRisk * 100)}%`,
      type: "landslide" as DisasterType,
    },
  ];

  const getSeverityColor = (severity: string) => {
    const colors = {
      'Low': 'text-green-400 bg-green-500/20',
      'Medium': 'text-yellow-400 bg-yellow-500/20',
      'High': 'text-orange-400 bg-orange-500/20',
      'Very High': 'text-red-400 bg-red-500/20',
    };
    return colors[severity as keyof typeof colors] || 'text-slate-400 bg-slate-500/20';
  };

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="absolute right-72 top-24 w-[min(92vw,500px)] z-20"
    >
      <Paper
        elevation={12}
        sx={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(249, 115, 22, 0.3)',
          borderRadius: 3,
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-orange-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl">Disaster Simulation</h2>
              <p className="text-orange-100 text-sm">Test your city's resilience</p>
            </div>
          </div>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X />
          </IconButton>
        </div>

        {/* Warning Banner */}
        <div className="bg-yellow-500/20 border-b border-yellow-500/40 px-6 py-3 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          <p className="text-yellow-200 text-sm">
            Simulations will test your infrastructure. Failures may result in casualties.
          </p>
        </div>
        {activeDisaster && (
          <div className="bg-red-500/20 border-b border-red-500/40 px-6 py-3 text-red-100 text-sm">
            Active event: <span className="font-semibold">{activeDisaster.type}</span> at intensity{" "}
            <span className="font-semibold">{activeDisaster.intensity}/10</span>
          </div>
        )}

        {/* Disaster List */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-340px)]">
          {disasters.map((disaster, i) => {
            const Icon = disaster.icon;
            return (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/60 border border-slate-700 hover:border-orange-500/50 rounded-xl p-4 transition-all"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-br ${disaster.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{disaster.name}</h3>
                    <p className="text-slate-400 text-sm mb-2">{disaster.description}</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold ${getSeverityColor(disaster.severity)}`}>
                        {disaster.severity}
                      </span>
                      <span className="text-slate-400 text-xs">
                        Probability: <span className="text-blue-400 font-semibold">{disaster.probability}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onTrigger(disaster.type, intensity)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-semibold rounded-lg transition-all shadow-md"
                >
                  Simulate
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Intensity Control */}
        <div className="border-t border-slate-700 bg-slate-900/50 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold text-sm">Disaster Intensity</span>
            <span className="text-orange-400 font-bold">{intensity}/10</span>
          </div>
          <Slider
            value={intensity}
            onChange={(_, value) => setIntensity(value as number)}
            min={1}
            max={10}
            step={1}
            sx={{
              color: '#f97316',
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
              },
            }}
          />
          <p className="text-slate-400 text-xs mt-2">
            Higher intensity creates more challenging scenarios for advanced players
          </p>
        </div>
      </Paper>
    </motion.div>
  );
}
