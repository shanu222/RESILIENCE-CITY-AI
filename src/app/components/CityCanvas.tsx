import { motion } from "motion/react";
import { MapContainer, Polygon, TileLayer, Tooltip, CircleMarker, Polyline } from "react-leaflet";
import { TreePine, Waves, ShieldAlert, Wind } from "lucide-react";
import type { GameState } from "../../game/types";

interface CityCanvasProps {
  state: GameState;
  onSelectDistrict: (districtId: string) => void;
  onOverlayChange: (overlay: GameState["map"]["activeOverlay"]) => void;
}

export function CityCanvas({ state, onSelectDistrict, onOverlayChange }: CityCanvasProps) {
  const topBuildings = state.buildings.slice(-6);
  const weatherLabel = state.activeDisaster
    ? `${state.activeDisaster.type.toUpperCase()} ALERT`
    : `${state.climate.weather.toUpperCase()} CONDITIONS`;
  const weatherAccent = state.activeDisaster ? "bg-red-400" : "bg-yellow-400";
  const selectedDistrict = state.districts.find((district) => district.id === state.map.selectedDistrictId) ?? state.districts[0];
  const overlay: GameState["map"]["activeOverlay"] = state.map.activeOverlay;

  const getDistrictOverlayValue = (district: GameState["districts"][number]) => {
    switch (overlay) {
      case "flood":
        return district.dynamic.waterLevel;
      case "seismic":
        return district.hazardExposure.seismic;
      case "drainage":
        return 100 - district.hazardExposure.drainage;
      case "heat":
        return district.hazardExposure.heat;
      case "slope":
        return district.hazardExposure.slope;
      case "infrastructure":
        return 100 - district.infrastructureCondition;
      case "traffic":
        return district.dynamic.trafficLoad;
      case "power":
        return 100 - district.dynamic.powerStability;
      case "incidents":
        return state.incidents
          .filter((incident) => incident.districtId === district.id && incident.status !== "resolved")
          .reduce((acc, incident) => acc + incident.severity, 0);
      default:
        return district.hazardExposure.flood;
    }
  };

  const overlayColor = (value: number) => {
    if (value >= 75) return "#ef4444";
    if (value >= 55) return "#f97316";
    if (value >= 35) return "#facc15";
    return "#22c55e";
  };

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-400 to-emerald-200">
      <div className="absolute inset-0 opacity-85">
        <MapContainer
          center={state.map.center}
          zoom={state.map.zoom}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
          preferCanvas
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {state.districts.map((district) => {
            const value = getDistrictOverlayValue(district);
            const color = overlayColor(value);
            const selected = district.id === state.map.selectedDistrictId;
            return (
              <Polygon
                key={district.id}
                positions={district.polygon}
                pathOptions={{
                  color,
                  weight: selected ? 3 : 1.4,
                  fillOpacity: selected ? 0.48 : 0.3,
                }}
                eventHandlers={{
                  click: () => onSelectDistrict(district.id),
                }}
              >
                <Tooltip sticky>
                  {district.name} | {overlay}: {Math.round(value)}
                </Tooltip>
              </Polygon>
            );
          })}
          {state.roadGraph.edges.map((edge) => {
            const from = state.roadGraph.nodes.find((node) => node.id === edge.from);
            const to = state.roadGraph.nodes.find((node) => node.id === edge.to);
            if (!from || !to) return null;
            const stress = 100 - edge.accessibility;
            const color = stress > 75 ? "#ef4444" : stress > 50 ? "#f59e0b" : "#22c55e";
            return (
              <Polyline
                key={edge.id}
                positions={[from.position, to.position]}
                pathOptions={{
                  color,
                  weight: Math.max(1, edge.capacity / 32),
                  opacity: 0.7,
                  dashArray: state.evacuationCorridors.some((corridor) => corridor.edgeIds.includes(edge.id))
                    ? "8 4"
                    : undefined,
                }}
              >
                <Tooltip sticky>
                  {edge.id} | access {Math.round(edge.accessibility)} | congestion {Math.round(edge.congestion)}
                </Tooltip>
              </Polyline>
            );
          })}
          {state.districts.map((district) => (
            <CircleMarker
              key={`${district.id}-center`}
              center={district.center}
              radius={4}
              pathOptions={{ color: "#60a5fa", fillColor: "#60a5fa", fillOpacity: 0.8 }}
            />
          ))}
          {state.incidents
            .filter((incident) => incident.status !== "resolved")
            .map((incident) => {
              const district = state.districts.find((item) => item.id === incident.districtId);
              if (!district) return null;
              return (
                <CircleMarker
                  key={incident.id}
                  center={district.center}
                  radius={Math.max(5, incident.severity / 12)}
                  pathOptions={{
                    color: incident.status === "dispatched" ? "#f59e0b" : "#ef4444",
                    fillColor: incident.status === "dispatched" ? "#f59e0b" : "#ef4444",
                    fillOpacity: 0.75,
                  }}
                >
                  <Tooltip sticky>
                    Incident {incident.hazardType} | sev {Math.round(incident.severity)} | urg {Math.round(incident.urgency)}
                  </Tooltip>
                </CircleMarker>
              );
            })}
          {state.emergencyUnits
            .filter((unit) => unit.status !== "idle")
            .map((unit) => {
              const district = state.districts.find((item) => item.id === unit.districtId);
              if (!district) return null;
              return (
                <CircleMarker
                  key={unit.id}
                  center={[district.center[0] + 0.004, district.center[1] + 0.004]}
                  radius={4}
                  pathOptions={{ color: "#38bdf8", fillColor: "#38bdf8", fillOpacity: 0.9 }}
                >
                  <Tooltip sticky>
                    {unit.type} | {unit.status} | ETA {unit.etaMinutes ?? "-"}m
                  </Tooltip>
                </CircleMarker>
              );
            })}
          {state.shelters.map((shelter) => {
            const district = state.districts.find((item) => item.id === shelter.districtId);
            if (!district) return null;
            return (
              <CircleMarker
                key={shelter.id}
                center={[district.center[0] - 0.004, district.center[1] - 0.004]}
                radius={5}
                pathOptions={{
                  color: shelter.open ? "#22c55e" : "#64748b",
                  fillColor: shelter.open ? "#22c55e" : "#64748b",
                  fillOpacity: 0.9,
                }}
              >
                <Tooltip sticky>
                  {shelter.name} | {shelter.open ? "open" : "closed"} | occ{" "}
                  {Math.round((shelter.occupancy / Math.max(1, shelter.capacity)) * 100)}%
                </Tooltip>
              </CircleMarker>
            );
          })}
          {state.districts.map((district) => {
            const stranded = state.citizenAgents.filter(
              (agent) => agent.districtId === district.id && agent.trapped
            ).length;
            if (stranded < 5) return null;
            return (
              <CircleMarker
                key={`${district.id}-stranded`}
                center={[district.center[0], district.center[1] + 0.006]}
                radius={4}
                pathOptions={{ color: "#f43f5e", fillColor: "#f43f5e", fillOpacity: 0.8 }}
              >
                <Tooltip sticky>Stranded civilians: {stranded}</Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-300 via-blue-200 to-transparent h-1/2" />

      {/* Grid ground */}
      <div className="absolute inset-0 top-1/2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA0MCAwIEwgMCAwIDAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDAsMCwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] bg-emerald-600/20" />

      {/* Dynamic skyline */}
      <div className="absolute inset-0 flex items-end justify-center pb-32 gap-8">
        {(topBuildings.length > 0 ? topBuildings : Array.from({ length: 3 })).map((building, i) => {
          const condition = typeof building === "object" ? building.condition : 80;
          const collapsed = condition < 20;
          const unsafe = condition < 45;
          const width = 96 + (i % 3) * 18;
          const height = 170 + (i % 4) * 28;
          const bg = collapsed
            ? "from-slate-700 to-slate-800 border-red-500"
            : unsafe
            ? "from-orange-400 to-orange-600 border-orange-700"
            : "from-emerald-400 to-blue-500 border-slate-600";
          return (
            <motion.div
              key={typeof building === "object" ? building.id : `placeholder-${i}`}
              initial={{ y: 120, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="relative"
            >
              <div
                className={`bg-gradient-to-b rounded-t-lg shadow-2xl border-2 ${bg}`}
                style={{ width, height }}
              >
                <div className="grid grid-cols-3 gap-2 p-3">
                  {Array.from({ length: 12 }).map((_, idx) => (
                    <div key={idx} className="w-full h-4 bg-white/35 rounded-sm" />
                  ))}
                </div>
                {unsafe && (
                  <div className="absolute top-2 right-2">
                    <ShieldAlert className="w-5 h-5 text-red-300" />
                  </div>
                )}
              </div>
              <div className="h-7 shadow-lg bg-slate-700" style={{ width }} />
            </motion.div>
          );
        })}

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
        <div className={`w-3 h-3 ${weatherAccent} rounded-full animate-pulse`} />
        <span className="text-white text-sm font-medium">{weatherLabel}</span>
      </motion.div>

      {/* Overlay controls */}
      <div className="absolute top-8 right-8 bg-slate-950/70 border border-slate-700 rounded-xl p-2 flex gap-1 backdrop-blur-md">
        {(["flood", "seismic", "drainage", "heat", "slope", "infrastructure", "traffic", "incidents", "power"] as const).map((item) => (
          <button
            key={item}
            onClick={() => onOverlayChange(item)}
            className={`px-2 py-1 rounded text-[10px] uppercase tracking-wide ${
              overlay === item ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {/* District intelligence */}
      <div className="absolute left-8 bottom-8 bg-slate-950/75 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 backdrop-blur-md w-[min(22rem,90vw)]">
        <p className="font-semibold text-white mb-1">{selectedDistrict.name}</p>
        <div className="grid grid-cols-2 gap-1">
          <span>Terrain: {selectedDistrict.terrain}</span>
          <span>Pop density: {selectedDistrict.populationDensity}</span>
          <span>Flood: {Math.round(selectedDistrict.dynamic.waterLevel)}</span>
          <span>Fire: {Math.round(selectedDistrict.dynamic.fireIntensity)}</span>
          <span>Traffic: {Math.round(selectedDistrict.dynamic.trafficLoad)}</span>
          <span>Power: {Math.round(selectedDistrict.dynamic.powerStability)}</span>
          <span>
            Incidents:{" "}
            {
              state.incidents.filter(
                (incident) => incident.districtId === selectedDistrict.id && incident.status !== "resolved"
              ).length
            }
          </span>
          <span>
            Hospital load:{" "}
            {Math.round(
              state.hospitals
                .filter((hospital) => hospital.districtId === selectedDistrict.id)
                .reduce((acc, hospital) => acc + hospital.traumaLoad / Math.max(1, hospital.bedCapacity), 0) * 100
            ) || 0}
            %
          </span>
          <span>
            Stranded:{" "}
            {state.citizenAgents.filter((agent) => agent.districtId === selectedDistrict.id && agent.trapped).length}
          </span>
          <span>
            Vulnerable:{" "}
            {
              state.citizenAgents.filter(
                (agent) =>
                  agent.districtId === selectedDistrict.id &&
                  (agent.vulnerableGroup === "elderly" ||
                    agent.vulnerableGroup === "child" ||
                    agent.vulnerableGroup === "disabled" ||
                    agent.vulnerableGroup === "hospitalized")
              ).length
            }
          </span>
        </div>
      </div>

      {/* Disaster overlays */}
      {state.activeDisaster?.type === "flood" && (
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-blue-500/35 backdrop-blur-sm border-t border-blue-200/30" />
      )}
      {state.activeDisaster?.type === "wildfire" && (
        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/25 via-transparent to-transparent" />
      )}
      {state.activeDisaster?.type === "cyclone" && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 opacity-40"
        >
          <Wind className="w-28 h-28 text-slate-100" />
        </motion.div>
      )}
      {state.activeDisaster?.type === "storm_surge" && (
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-cyan-500/30">
          <Waves className="absolute top-4 right-6 w-8 h-8 text-cyan-100" />
        </div>
      )}
      {state.activeDisaster?.type === "earthquake" && (
        <div className="absolute inset-0 animate-pulse bg-red-500/10" />
      )}
    </div>
  );
}
