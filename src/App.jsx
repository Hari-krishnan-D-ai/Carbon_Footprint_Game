import GameCanvas from './gamification/GameCanvas.jsx';
import HudOverlay from './components/HudOverlay.jsx';
import NpcDialogue from './components/NpcDialogue.jsx';
import FloatingNlp from './components/FloatingNlp.jsx';
import './App.css';

export default function App() {
  return (
    <div className="cc-app">
      <div className="cc-viewport">
        <GameCanvas />
      </div>

      {/* Overlay UI layer — sits above the 3D viewport, never blocks it */}
      <HudOverlay />
      <NpcDialogue />
      <FloatingNlp />
    </div>
  );
}
