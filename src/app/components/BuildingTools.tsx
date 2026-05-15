import { motion } from 'motion/react';
import { X, Building2, Home, Hospital, School, Fence, Droplets, Zap, TreePine } from 'lucide-react';
import { Paper, IconButton, Tabs, Tab } from '@mui/material';
import { useState } from 'react';

interface BuildingToolsProps {
  onClose: () => void;
}

export function BuildingTools({ onClose }: BuildingToolsProps) {
  const [activeTab, setActiveTab] = useState(0);

  const structures = [
    {
      category: 'Residential',
      items: [
        { icon: Home, name: 'Single-Family Home', cost: '$120K', resilience: 'Medium' },
        { icon: Building2, name: 'Apartment Complex', cost: '$2.5M', resilience: 'High' },
        { icon: Home, name: 'Elevated House', cost: '$180K', resilience: 'High' },
      ],
    },
    {
      category: 'Public',
      items: [
        { icon: School, name: 'School Building', cost: '$1.8M', resilience: 'Very High' },
        { icon: Hospital, name: 'Hospital', cost: '$5M', resilience: 'Critical' },
        { icon: Building2, name: 'Emergency Shelter', cost: '$800K', resilience: 'Very High' },
      ],
    },
    {
      category: 'Infrastructure',
      items: [
        { icon: Droplets, name: 'Drainage System', cost: '$300K', resilience: 'N/A' },
        { icon: Fence, name: 'Flood Barrier', cost: '$450K', resilience: 'N/A' },
        { icon: Zap, name: 'Solar Grid', cost: '$600K', resilience: 'N/A' },
        { icon: TreePine, name: 'Green Corridor', cost: '$150K', resilience: 'N/A' },
      ],
    },
  ];

  const getResilienceColor = (level: string) => {
    const colors = {
      'Medium': 'text-yellow-400',
      'High': 'text-emerald-400',
      'Very High': 'text-blue-400',
      'Critical': 'text-purple-400',
      'N/A': 'text-slate-500',
    };
    return colors[level as keyof typeof colors] || 'text-slate-400';
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
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 3,
          maxHeight: 'calc(100vh - 120px)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-500 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-bold text-xl">Building Tools</h2>
              <p className="text-emerald-100 text-sm">Construct resilient infrastructure</p>
            </div>
          </div>
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <X />
          </IconButton>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
              },
              '& .Mui-selected': {
                color: '#10b981',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#10b981',
              },
            }}
          >
            <Tab label="Residential" />
            <Tab label="Public" />
            <Tab label="Infrastructure" />
          </Tabs>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {structures[activeTab].items.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-slate-800/60 border border-slate-700 hover:border-emerald-500/50 rounded-xl p-4 cursor-pointer transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-600/20 rounded-lg flex items-center justify-center group-hover:bg-emerald-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Cost:</span>
                        <span className="text-yellow-400 font-semibold">{item.cost}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Resilience:</span>
                        <span className={`font-semibold ${getResilienceColor(item.resilience)}`}>
                          {item.resilience}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition-colors">
                    Build
                  </button>
                  <button className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-semibold rounded-lg transition-colors">
                    Learn
                  </button>
                </div>
              </motion.div>
            );
          })}

          {/* Engineering Tips */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-blue-900/30 border border-blue-700/40 rounded-xl p-4 mt-6"
          >
            <h4 className="text-blue-200 font-semibold mb-2 text-sm">Engineering Principles</h4>
            <ul className="space-y-1 text-xs text-blue-100">
              <li>• Reinforce all structures in seismic zones</li>
              <li>• Elevate buildings in flood-prone areas</li>
              <li>• Use fire-resistant materials in dense areas</li>
              <li>• Plan evacuation routes before building</li>
            </ul>
          </motion.div>
        </div>
      </Paper>
    </motion.div>
  );
}
