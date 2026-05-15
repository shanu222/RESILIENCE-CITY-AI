import { Target, Hammer, Cloud, Brain, Map, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';

interface ControlPanelProps {
  activePanel: 'missions' | 'build' | 'disasters' | null;
  onPanelChange: (panel: 'missions' | 'build' | 'disasters' | null) => void;
  onToggleMentor: () => void;
}

export function ControlPanel({ activePanel, onPanelChange, onToggleMentor }: ControlPanelProps) {
  const tools = [
    { id: 'missions' as const, icon: Target, label: 'Missions', color: 'from-blue-500 to-blue-600' },
    { id: 'build' as const, icon: Hammer, label: 'Build', color: 'from-emerald-500 to-emerald-600' },
    { id: 'disasters' as const, icon: Cloud, label: 'Disasters', color: 'from-orange-500 to-orange-600' },
  ];

  const utilities = [
    { icon: Brain, label: 'AI Mentor', onClick: onToggleMentor },
    { icon: Map, label: 'Map' },
    { icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="absolute right-6 top-24 z-20"
    >
      {/* Main Tools */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl mb-4">
        <div className="space-y-2">
          {tools.map((tool, i) => {
            const Icon = tool.icon;
            const isActive = activePanel === tool.id;

            return (
              <motion.button
                key={tool.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                onClick={() => onPanelChange(isActive ? null : tool.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${tool.color} shadow-lg scale-105`
                    : 'bg-slate-800/50 hover:bg-slate-700/50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-white/20' : 'bg-slate-700'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                </div>
                <span className={`font-semibold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {tool.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Utilities */}
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl p-3 shadow-2xl">
        <div className="space-y-2">
          {utilities.map((util, i) => {
            const Icon = util.icon;

            return (
              <motion.button
                key={i}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + 0.1 * i }}
                onClick={util.onClick}
                className="w-full flex items-center justify-center p-3 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 transition-all"
              >
                <Icon className="w-5 h-5 text-slate-300" />
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
