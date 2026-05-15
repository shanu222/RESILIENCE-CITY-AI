import { motion } from 'motion/react';
import { X, Trophy, Clock, Target, CheckCircle2, Lock } from 'lucide-react';
import { Paper, IconButton, Chip } from '@mui/material';

interface MissionPanelProps {
  onClose: () => void;
}

export function MissionPanel({ onClose }: MissionPanelProps) {
  const missions = [
    {
      id: 1,
      title: 'Earthquake-Safe School',
      description: 'Design and build a seismically resilient school in high-risk zone',
      difficulty: 'Medium',
      reward: '$500K',
      time: '45 min',
      status: 'active',
      objectives: [
        'Learn seismic design principles',
        'Design reinforced structure',
        'Pass earthquake simulation',
      ],
    },
    {
      id: 2,
      title: 'Flood-Resistant Village',
      description: 'Protect riverside community from seasonal flooding',
      difficulty: 'Hard',
      reward: '$1.2M',
      time: '60 min',
      status: 'available',
      objectives: [
        'Analyze flood patterns',
        'Build elevated homes',
        'Create drainage system',
      ],
    },
    {
      id: 3,
      title: 'Urban Fire Safety',
      description: 'Retrofit densely populated area with fire safety measures',
      difficulty: 'Medium',
      reward: '$800K',
      time: '40 min',
      status: 'available',
      objectives: [
        'Install fire exits',
        'Add suppression systems',
        'Plan evacuation routes',
      ],
    },
    {
      id: 4,
      title: 'Climate Resilient City',
      description: 'Transform megacity to withstand multiple climate threats',
      difficulty: 'Expert',
      reward: '$5M',
      time: '120 min',
      status: 'locked',
      objectives: [
        'Complete all basic missions',
        'Design integrated systems',
        'Survive 10-year simulation',
      ],
    },
  ];

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
      className="absolute right-72 top-24 w-[500px] z-20"
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
          {missions.map((mission, i) => (
            <motion.div
              key={mission.id}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`bg-slate-800/60 border ${
                mission.status === 'active'
                  ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                  : mission.status === 'locked'
                  ? 'border-slate-700 opacity-60'
                  : 'border-slate-700 hover:border-slate-600'
              } rounded-xl p-5 transition-all cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-white font-semibold text-lg">{mission.title}</h3>
                    {mission.status === 'active' && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    )}
                    {mission.status === 'locked' && <Lock className="w-4 h-4 text-slate-500" />}
                  </div>
                  <p className="text-slate-400 text-sm mb-3">{mission.description}</p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 mb-4">
                <Chip
                  label={mission.difficulty}
                  size="small"
                  color={getDifficultyColor(mission.difficulty) as any}
                  sx={{ fontWeight: 600 }}
                />
                <div className="flex items-center gap-1 text-yellow-400 text-sm">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">{mission.reward}</span>
                </div>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <Clock className="w-4 h-4" />
                  <span>{mission.time}</span>
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Objectives</p>
                {mission.objectives.map((objective, j) => (
                  <div key={j} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-400">{objective}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              {mission.status !== 'locked' && (
                <button
                  className={`w-full mt-4 px-4 py-2 rounded-lg font-semibold transition-all ${
                    mission.status === 'active'
                      ? 'bg-blue-600 hover:bg-blue-500 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {mission.status === 'active' ? 'Continue Mission' : 'Start Mission'}
                </button>
              )}
            </motion.div>
          ))}
        </div>
      </Paper>
    </motion.div>
  );
}
