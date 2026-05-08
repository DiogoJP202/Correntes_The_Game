import { useState } from 'react';
import { MainMenu } from './components/MainMenu';
import { GameEngine } from './components/game/GameEngine';
import { ConsequenceScreen } from './components/ConsequenceScreen';
import type { GameResult } from './components/game/types';

type Screen = 'menu' | 'game' | 'consequence';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const handleStart = () => setScreen('game');

  const handleGameEnd = (result: GameResult) => {
    setGameResult(result);
    setScreen('consequence');
  };

  const handleRestart = () => {
    setGameResult(null);
    setScreen('menu');
  };

  return (
    <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {screen === 'menu' && <MainMenu onStart={handleStart} />}
      {screen === 'game' && <GameEngine key="game" onGameEnd={handleGameEnd} />}
      {screen === 'consequence' && gameResult && (
        <ConsequenceScreen result={gameResult} onRestart={handleRestart} />
      )}
    </div>
  );
}
