import { motion } from 'motion/react';
import { Brain, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Paper, IconButton } from '@mui/material';
import { useState } from 'react';

export function AIMentor() {
  const [messages] = useState([
    {
      type: 'info',
      text: 'Welcome to Resilience City AI. I will guide you through building climate-resilient infrastructure.',
      icon: Brain,
    },
    {
      type: 'tip',
      text: 'This area has high seismic activity. Consider reinforced concrete frames with moment-resisting connections.',
      icon: Lightbulb,
    },
  ]);

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="absolute left-6 bottom-6 w-96 z-20"
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
              info: 'bg-blue-500/20 border-blue-500/40 text-blue-200',
              tip: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200',
              warning: 'bg-red-500/20 border-red-500/40 text-red-200',
              success: 'bg-green-500/20 border-green-500/40 text-green-200',
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
                <span className="text-red-400 font-semibold">High (Zone 4)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Flood Risk:</span>
                <span className="text-yellow-400 font-semibold">Moderate</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Soil Type:</span>
                <span className="text-blue-400 font-semibold">Clay</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Wind Speed:</span>
                <span className="text-green-400 font-semibold">Low</span>
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
                <span>Use reinforced concrete with steel moment frames</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Elevate structures 3ft above ground level</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">•</span>
                <span>Install drainage channels around perimeter</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-xs font-medium text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors">
              Explain More
            </button>
            <button className="flex-1 px-3 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-600/20 rounded-lg transition-colors">
              Show Example
            </button>
          </div>
        </div>
      </Paper>
    </motion.div>
  );
}
