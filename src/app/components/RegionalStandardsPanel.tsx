import { motion } from "motion/react";
import { X, MapPinned } from "lucide-react";
import { IconButton, Paper } from "@mui/material";
import { REGIONS } from "../../game/data";
import type { RegionId } from "../../game/types";

interface RegionalStandardsPanelProps {
  selectedRegionId: RegionId;
  onSelectRegion: (regionId: RegionId) => void;
  onClose: () => void;
}

export function RegionalStandardsPanel({
  selectedRegionId,
  onSelectRegion,
  onClose,
}: RegionalStandardsPanelProps) {
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
          background: "linear-gradient(135deg, rgba(14, 20, 42, 0.98) 0%, rgba(20, 26, 47, 0.98) 100%)",
          border: "1px solid rgba(129, 140, 248, 0.3)",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-white" />
            <div>
              <h3 className="text-white font-bold text-xl">Regional Standards</h3>
              <p className="text-indigo-100 text-sm">Select biome-specific hazard codes and engineering guidance</p>
            </div>
          </div>
          <IconButton onClick={onClose} sx={{ color: "white" }}>
            <X />
          </IconButton>
        </div>

        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          {REGIONS.map((region) => {
            const selected = region.id === selectedRegionId;
            return (
              <button
                key={region.id}
                onClick={() => onSelectRegion(region.id)}
                className={`w-full border rounded-xl text-left p-4 transition-colors ${
                  selected
                    ? "bg-indigo-500/20 border-indigo-400"
                    : "bg-slate-900/70 border-slate-700 hover:border-indigo-300/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-white font-semibold">{region.name}</p>
                  <span className="text-xs text-slate-300">{region.biome}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-slate-300 mb-3">
                  <span>Seismic: {Math.round(region.seismicRisk * 100)}</span>
                  <span>Flood: {Math.round(region.floodRisk * 100)}</span>
                  <span>Heat: {Math.round(region.heatRisk * 100)}</span>
                </div>
                <ul className="text-xs text-indigo-100 space-y-1">
                  {region.codeGuidance.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>
      </Paper>
    </motion.div>
  );
}
