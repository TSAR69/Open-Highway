import Background from './components/Background';
import Time from './components/Time';
import Branding from './components/Branding';
import Player from './components/Player';
import { usePlayer } from './hooks/usePlayer';

export default function App() {
  const player = usePlayer();

  return (
    <div className="relative h-screen w-screen flex flex-col justify-between p-6 md:p-10">
      <Background bgImage="/Background.png" />

      <header className="flex items-start justify-between z-10">
        <Time />
      </header>

      <main className="flex-1 flex items-center justify-center z-10">
        <Branding />
      </main>

      <footer className="flex flex-col items-center justify-center z-10 pb-4 gap-3">
        <Player {...player} />
        <p className="text-[10px] md:text-xs text-white/40">
          Made by <a href="https://github.com/TSAR69" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">TSAR69</a>
        </p>
      </footer>
    </div>
  );
}
