import { motion } from 'motion/react';
import { Play, BookOpen, Users, Globe, Settings } from 'lucide-react';
import { Button } from '@mui/material';

interface MainMenuProps {
  onStart: () => void;
}

export function MainMenu({ onStart }: MainMenuProps) {
  return (
    <div className="relative size-full flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[120px] animate-pulse delay-1000" />
        </div>
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40" />

      <div className="relative z-10 max-w-6xl mx-auto px-8 text-center">
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="mb-12"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-2xl shadow-2xl shadow-blue-500/50">
            <Globe className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-7xl font-bold text-white mb-4 tracking-tight">
            RESILIENCE CITY AI
          </h1>

          <p className="text-2xl text-blue-300 font-light tracking-wide">
            Build Smart. Survive Together.
          </p>
        </motion.div>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="text-lg text-slate-300 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Master climate resilience, disaster management, and civil engineering through
          immersive gameplay. Build intelligent cities, survive realistic disasters,
          and become a future resilience thinker.
        </motion.p>

        {/* Menu Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="flex flex-col items-center gap-4 mb-8"
        >
          <Button
            onClick={onStart}
            variant="contained"
            size="large"
            startIcon={<Play />}
            sx={{
              px: 6,
              py: 2,
              fontSize: '1.125rem',
              fontWeight: 600,
              background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
              boxShadow: '0 10px 40px rgba(59, 130, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #059669 100%)',
                boxShadow: '0 15px 50px rgba(59, 130, 246, 0.6)',
              },
              transition: 'all 0.3s ease',
              textTransform: 'none',
              borderRadius: 2,
              minWidth: 300,
            }}
          >
            Start Mission
          </Button>

          <div className="flex gap-4 mt-4">
            <Button
              variant="outlined"
              startIcon={<BookOpen />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Learning Center
            </Button>

            <Button
              variant="outlined"
              startIcon={<Users />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Multiplayer
            </Button>

            <Button
              variant="outlined"
              startIcon={<Settings />}
              sx={{
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                '&:hover': {
                  borderColor: 'rgba(255, 255, 255, 0.6)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                },
                textTransform: 'none',
                px: 4,
                py: 1.5,
              }}
            >
              Settings
            </Button>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="grid grid-cols-3 gap-8 mt-16 max-w-4xl mx-auto"
        >
          {[
            { icon: '🏗️', title: 'Realistic Engineering', desc: 'Learn structural design and physics' },
            { icon: '🌊', title: 'Dynamic Disasters', desc: 'Face floods, earthquakes, and fires' },
            { icon: '🤖', title: 'AI Mentor', desc: 'Expert guidance in real-time' },
          ].map((feature, i) => (
            <div key={i} className="text-center">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 text-sm">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
