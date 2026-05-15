import { motion } from 'motion/react';
import { Building2, TreePine, Waves, Zap } from 'lucide-react';

export function CityCanvas() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-emerald-200">
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent h-1/2" />

      {/* Grid ground */}
      <div className="absolute inset-0 top-1/2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-emerald-600/20" />

      {/* Sample city elements */}
      <div className="absolute inset-0 flex items-end justify-center pb-32 gap-8">
        {/* Building 1 */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative"
        >
          <div className="w-32 h-48 bg-gradient-to-b from-slate-400 to-slate-500 rounded-t-lg shadow-2xl border-2 border-slate-600">
            <div className="grid grid-cols-3 gap-2 p-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="w-full h-4 bg-blue-300/40 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="w-32 h-8 bg-slate-600 shadow-lg" />
        </motion.div>

        {/* Building 2 - Taller */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative"
        >
          <div className="w-28 h-64 bg-gradient-to-b from-blue-400 to-blue-500 rounded-t-lg shadow-2xl border-2 border-blue-600">
            <div className="grid grid-cols-3 gap-2 p-3">
              {Array.from({ length: 18 }).map((_, i) => (
                <div key={i} className="w-full h-4 bg-white/30 rounded-sm" />
              ))}
            </div>
          </div>
          <div className="w-28 h-8 bg-blue-700 shadow-lg" />
        </motion.div>

        {/* Building 3 */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative"
        >
          <div className="w-36 h-56 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-t-lg shadow-2xl border-2 border-emerald-600">
            <div className="grid grid-cols-4 gap-2 p-3">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-full h-4 bg-white/40 rounded-sm" />
              ))}
            </div>
            <div className="absolute top-2 right-2">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
          </div>
          <div className="w-36 h-8 bg-emerald-700 shadow-lg" />
        </motion.div>

        {/* Trees */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="flex gap-4 items-end"
        >
          <TreePine className="w-12 h-16 text-green-700" />
          <TreePine className="w-10 h-14 text-green-600" />
          <TreePine className="w-11 h-15 text-green-700" />
        </motion.div>
      </div>

      {/* Weather indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute top-8 left-8 flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full"
      >
        <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        <span className="text-white text-sm font-medium">Clear Day</span>
      </motion.div>
    </div>
  );
}
