import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameInterface } from './components/GameInterface';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <div className="size-full bg-slate-950 overflow-hidden">
      {!gameStarted ? (
        <MainMenu onStart={() => setGameStarted(true)} />
      ) : (
        <GameInterface onBack={() => setGameStarted(false)} />
      )}
    </div>
  );
}