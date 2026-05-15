import { useState } from "react";
import { MainMenu } from "./components/MainMenu";
import { GameInterface } from "./components/GameInterface";

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [mode, setMode] = useState<"campaign" | "sandbox">("campaign");

  return (
    <div className="size-full bg-slate-950 overflow-hidden">
      {!gameStarted ? (
        <MainMenu
          onStartCampaign={() => {
            setMode("campaign");
            setGameStarted(true);
          }}
          onStartSandbox={() => {
            setMode("sandbox");
            setGameStarted(true);
          }}
        />
      ) : (
        <GameInterface
          initialMode={mode}
          onBack={() => setGameStarted(false)}
        />
      )}
    </div>
  );
}