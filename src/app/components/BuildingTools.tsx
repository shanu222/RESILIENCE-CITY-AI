import { motion } from "motion/react";
import { X, Building2, Home, Hospital, School, Fence, Droplets, Zap, TreePine } from "lucide-react";
import { Paper, IconButton, Tabs, Tab } from "@mui/material";
import { useState } from "react";
import { BUILDING_TEMPLATES } from "../../game/data";
import type { BuildingBlueprint, BuildingTemplate, DistrictState } from "../../game/types";

interface BuildingToolsProps {
  onClose: () => void;
  budget: number;
  districts: DistrictState[];
  selectedDistrictId: string;
  professionalMode: boolean;
  onToggleProfessionalMode: () => void;
  onBuild: (templateId: string, districtId?: string, blueprint?: Partial<BuildingBlueprint>) => void;
}

export function BuildingTools({
  onClose,
  budget,
  districts,
  selectedDistrictId,
  professionalMode,
  onToggleProfessionalMode,
  onBuild,
}: BuildingToolsProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [blueprintMode, setBlueprintMode] = useState(false);
  const [targetDistrictId, setTargetDistrictId] = useState(selectedDistrictId);
  const [blueprint, setBlueprint] = useState<BuildingBlueprint>({
    foundation: "raft",
    structuralSystem: "moment-frame",
    material: "reinforced-concrete",
    reinforcementLevel: 60,
    drainageCapacity: 55,
    exits: 2,
    utilityResilience: 55,
    floorCount: 3,
    roomDensity: 55,
  });

  const structures: { category: string; items: BuildingTemplate[] }[] = [
    { category: "Residential", items: BUILDING_TEMPLATES.filter((item) => item.category === "residential") },
    { category: "Public", items: BUILDING_TEMPLATES.filter((item) => item.category === "public") },
    { category: "Infrastructure", items: BUILDING_TEMPLATES.filter((item) => item.category === "infrastructure") },
  ];

  const iconByTemplate = (templateName: string) => {
    if (templateName.toLowerCase().includes("school")) return School;
    if (templateName.toLowerCase().includes("hospital")) return Hospital;
    if (templateName.toLowerCase().includes("drainage")) return Droplets;
    if (templateName.toLowerCase().includes("barrier")) return Fence;
    if (templateName.toLowerCase().includes("solar")) return Zap;
    if (templateName.toLowerCase().includes("green")) return TreePine;
    if (templateName.toLowerCase().includes("apartment")) return Building2;
    return Home;
  };

  const resilienceTag = (template: BuildingTemplate) => {
    const score = Math.round(template.baseResilience * 100);
    if (score >= 80) return { text: "Critical", color: "text-purple-400" };
    if (score >= 65) return { text: "Very High", color: "text-blue-400" };
    if (score >= 50) return { text: "High", color: "text-emerald-400" };
    return { text: "Medium", color: "text-yellow-400" };
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
              <p className="text-emerald-100 text-sm">Construct resilient infrastructure with blueprint logic</p>
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

        <div className="px-4 py-3 border-b border-slate-700 bg-slate-900/55">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setBlueprintMode(!blueprintMode)}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                blueprintMode ? "bg-emerald-600 border-emerald-400 text-white" : "bg-slate-800 border-slate-600 text-slate-300"
              }`}
            >
              Blueprint Mode
            </button>
            <button
              onClick={onToggleProfessionalMode}
              className={`px-3 py-1.5 text-xs rounded-md border ${
                professionalMode ? "bg-violet-600 border-violet-400 text-white" : "bg-slate-800 border-slate-600 text-slate-300"
              }`}
            >
              Professional Mode
            </button>
          </div>
          <div className="text-xs text-slate-300">
            District:
            <select
              value={targetDistrictId}
              onChange={(event) => setTargetDistrictId(event.target.value)}
              className="ml-2 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200"
            >
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
          </div>
          {blueprintMode && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-200">
              <label className="flex flex-col gap-1">
                Foundation
                <select
                  value={blueprint.foundation}
                  onChange={(event) => setBlueprint((prev) => ({ ...prev, foundation: event.target.value as any }))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
                >
                  <option value="raft">Raft</option>
                  <option value="pile">Pile</option>
                  <option value="strip">Strip</option>
                  <option value="mat">Mat</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                System
                <select
                  value={blueprint.structuralSystem}
                  onChange={(event) => setBlueprint((prev) => ({ ...prev, structuralSystem: event.target.value as any }))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
                >
                  <option value="moment-frame">Moment Frame</option>
                  <option value="shear-wall">Shear Wall</option>
                  <option value="braced-frame">Braced Frame</option>
                  <option value="masonry">Masonry</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Material
                <select
                  value={blueprint.material}
                  onChange={(event) => setBlueprint((prev) => ({ ...prev, material: event.target.value as any }))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
                >
                  <option value="reinforced-concrete">Reinforced Concrete</option>
                  <option value="steel">Steel</option>
                  <option value="timber">Timber</option>
                  <option value="masonry">Masonry</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                Exits
                <input
                  type="number"
                  value={blueprint.exits}
                  min={1}
                  max={8}
                  onChange={(event) => setBlueprint((prev) => ({ ...prev, exits: Number(event.target.value) }))}
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1"
                />
              </label>
              <label className="flex flex-col gap-1">
                Reinforcement {blueprint.reinforcementLevel}
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={blueprint.reinforcementLevel}
                  onChange={(event) =>
                    setBlueprint((prev) => ({ ...prev, reinforcementLevel: Number(event.target.value) }))
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                Drainage {blueprint.drainageCapacity}
                <input
                  type="range"
                  min={20}
                  max={100}
                  value={blueprint.drainageCapacity}
                  onChange={(event) => setBlueprint((prev) => ({ ...prev, drainageCapacity: Number(event.target.value) }))}
                />
              </label>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)]">
          {structures[activeTab].items.map((item, i) => {
            const Icon = iconByTemplate(item.name);
            const resilience = resilienceTag(item);
            const costText = new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
              notation: "compact",
              maximumFractionDigits: 1,
            }).format(item.cost);
            const canAfford = budget >= item.cost;
            return (
              <motion.div
                key={item.id}
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
                        <span className="text-yellow-400 font-semibold">{costText}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">Resilience:</span>
                        <span className={`font-semibold ${resilience.color}`}>
                          {resilience.text}
                        </span>
                      </div>
                    </div>
                    <p className="text-slate-400 text-xs mt-2">{item.description}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => onBuild(item.id, targetDistrictId, blueprintMode ? blueprint : undefined)}
                    disabled={!canAfford}
                    className={`flex-1 px-3 py-2 text-white text-sm font-semibold rounded-lg transition-colors ${
                      canAfford
                        ? "bg-emerald-600 hover:bg-emerald-500"
                        : "bg-slate-700 cursor-not-allowed opacity-70"
                    }`}
                  >
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
            <p className="text-xs text-emerald-200 mt-2">
              Active district: {districts.find((district) => district.id === targetDistrictId)?.name ?? "Unknown"}
            </p>
            <p className="text-xs text-blue-200 mt-3">
              Current budget:{" "}
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(budget)}
            </p>
          </motion.div>
        </div>
      </Paper>
    </motion.div>
  );
}
