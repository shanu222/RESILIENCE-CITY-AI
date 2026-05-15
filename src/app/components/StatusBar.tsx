import { ArrowLeft, Heart, Coins, Users, Leaf, AlertCircle, Save, Upload, RotateCcw } from "lucide-react";
import { IconButton } from "@mui/material";
import { motion } from "motion/react";
import type { GameState } from "../../game/types";

interface StatusBarProps {
  onBack: () => void;
  state: GameState;
  onSave: () => void;
  onLoad: () => void;
  onReset: () => void;
}

export function StatusBar({ onBack, state, onSave, onLoad, onReset }: StatusBarProps) {
  const stats = [
    { icon: Heart, label: "Resilience", value: `${Math.round(state.resilienceScore)}%`, color: "text-green-400" },
    {
      icon: Users,
      label: "Population",
      value: new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
        state.citizens.total
      ),
      color: "text-blue-400",
    },
    {
      icon: Coins,
      label: "Budget",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(state.budget),
      color: "text-yellow-400",
    },
    {
      icon: Leaf,
      label: "Sustainability",
      value: `${Math.round(state.sustainabilityScore)}%`,
      color: "text-emerald-400",
    },
  ];

  const alertText =
    state.activeDisaster
      ? `${state.activeDisaster.type.toUpperCase()} in progress`
      : state.warnings[0] ?? "Systems stable";

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-b from-slate-950/95 to-slate-950/80 backdrop-blur-xl border-b border-slate-800"
    >
      <div className="flex items-center justify-between px-6 py-4">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <IconButton
            onClick={onBack}
            sx={{
              color: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}
          >
            <ArrowLeft />
          </IconButton>

          <div>
            <h2 className="text-white font-bold text-lg">Mission: Safe Haven</h2>
            <p className="text-slate-400 text-sm">
              Region: {state.region.name} | Day {state.day}, {String(state.hour).padStart(2, "0")}:00
            </p>
            <p className="text-slate-500 text-xs">
              Skill Lv {state.learning.skillLevel} | Prof mode {state.learning.professionalMode ? "On" : "Off"} | Weather{" "}
              {state.climate.weather}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 * i, type: 'spring' }}
                className="flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-lg border border-slate-700"
              >
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                  <p className={`font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Alert */}
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 px-4 py-2 rounded-lg"
          >
            <AlertCircle className="w-5 h-5 text-orange-400 animate-pulse" />
            <span className="text-orange-200 text-sm font-medium">{alertText}</span>
          </motion.div>
          <button
            onClick={onSave}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700"
            title="Save game"
          >
            <Save className="w-4 h-4 text-slate-200" />
          </button>
          <button
            onClick={onLoad}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700"
            title="Load game"
          >
            <Upload className="w-4 h-4 text-slate-200" />
          </button>
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 border border-slate-700"
            title="Reset simulation"
          >
            <RotateCcw className="w-4 h-4 text-slate-200" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
