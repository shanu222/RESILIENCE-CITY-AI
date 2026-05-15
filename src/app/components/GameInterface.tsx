import { useState } from 'react';
import { CityCanvas } from './CityCanvas';
import { AIMentor } from './AIMentor';
import { ControlPanel } from './ControlPanel';
import { MissionPanel } from './MissionPanel';
import { BuildingTools } from './BuildingTools';
import { StatusBar } from './StatusBar';
import { DisasterPanel } from './DisasterPanel';

interface GameInterfaceProps {
  onBack: () => void;
}

export function GameInterface({ onBack }: GameInterfaceProps) {
  const [activePanel, setActivePanel] = useState<'missions' | 'build' | 'disasters' | null>('missions');
  const [showMentor, setShowMentor] = useState(true);

  return (
    <div className="relative size-full bg-slate-900 overflow-hidden">
      {/* Main Canvas Area */}
      <CityCanvas />

      {/* Status Bar */}
      <StatusBar onBack={onBack} />

      {/* Control Panel */}
      <ControlPanel
        activePanel={activePanel}
        onPanelChange={setActivePanel}
        onToggleMentor={() => setShowMentor(!showMentor)}
      />

      {/* AI Mentor */}
      {showMentor && <AIMentor />}

      {/* Mission Panel */}
      {activePanel === 'missions' && (
        <MissionPanel onClose={() => setActivePanel(null)} />
      )}

      {/* Building Tools */}
      {activePanel === 'build' && (
        <BuildingTools onClose={() => setActivePanel(null)} />
      )}

      {/* Disaster Panel */}
      {activePanel === 'disasters' && (
        <DisasterPanel onClose={() => setActivePanel(null)} />
      )}
    </div>
  );
}
