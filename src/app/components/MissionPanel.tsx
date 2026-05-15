import { motion } from "motion/react";
import { X, Trophy, Clock, Target, CheckCircle2, Lock } from "lucide-react";
import { Paper, IconButton, Chip } from "@mui/material";
import type { LearningState, Mission } from "../../game/types";

interface MissionPanelProps {
  onClose: () => void;
  missions: Mission[];
  learning: LearningState;
  unlockedTech: string[];
  onStartMission: (missionId: string) => void;
}

export function MissionPanel({ onClose, missions, learning, unlockedTech, onStartMission }: MissionPanelProps) {

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Easy: 'success',
      Medium: 'warning',
      Hard: 'error',
      Expert: 'secondary',
    };
    return colors[difficulty as keyof typeof colors] || 'default';
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
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 3,
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl">Missions</h2>
              <p className="text-blue-100 text-sm">Choose your challenge</p>
            </div>
          </div>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X />
          </IconButton>
        </div>

        {/* Mission List */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-220px)]">
          <div className="bg-indigo-900/30 border border-indigo-700/40 rounded-xl p-4">
            <p className="text-indigo-200 text-xs font-semibold mb-2">Resilience Academy</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-indigo-100">
              <span>Engineering XP: {learning.engineeringXP}</span>
              <span>Skill Level: {learning.skillLevel}</span>
              <span>Certifications: {learning.certifications.length}</span>
              <span>Tech unlocked: {unlockedTech.length}</span>
            </div>
          </div>
          {missions.map((mission, i) => (
            <motion.div
              key={mission.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-800/60 border ${
                mission.status === "active"
                  ? "border-blue-500 shadow-lg shadow-blue-500/20"
                  : mission.status === "locked"
                  ? "border-slate-700 opacity-60"
                  : "border-slate-700 hover:border-slate-600"
              } rounded-xl p-5 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold text-lg">{mission.title}</h3>
                    {mission.status === "active" && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    )}
                    {mission.status === "locked" && <Lock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{mission.description}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-4">
                <Chip
                  label={mission.difficulty.toUpperCase()}
                  size="small"
                  color={getDifficultyColor(mission.difficulty) as any}
                  sx={{ fontWeight: 600 }}
                />
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      notation: "compact",
                      maximumFractionDigits: 1,
                    }).format(mission.reward)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{mission.timeLimitMinutes} min</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${Math.round(mission.progress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">{Math.round(mission.progress * 100)}% complete</p>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Objectives</p>
                {mission.objectives.map((objective) => (
                  <div key={objective.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        objective.done ? "text-emerald-400" : "text-slate-500"
                      }`}
                    />
                    <span className={objective.done ? "text-emerald-200" : "text-slate-400"}>{objective.text}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {mission.status !== "locked" && mission.status !== "completed" && (
                <button
                  onClick={() => onStartMission(mission.id)}
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-semibold transition-all ${
                    mission.status === "active"
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-slate-300"
                  }`}
                >
                  {mission.status === "active" ? "Continue Mission" : "Start Mission"}
                </button>
              )}
              {mission.status === "completed" && (
                <div className="w-full mt-4 px-4 py-2 rounded-lg font-semibold bg-emerald-600/30 text-emerald-200 text-center">
                  Mission Completed
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Paper>
    </motion.div>
  );
}
