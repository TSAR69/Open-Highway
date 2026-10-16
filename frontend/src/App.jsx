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
        <a
          href="https://github.com/TSAR69/Open-Highway"
          target="_blank"
          rel="noopener noreferrer"
          className="glass rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-white flex items-center gap-2 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none transition-all duration-200"
          aria-label="Open Highway on GitHub"
        >
          <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fill-rule="evenodd" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C-4.422 18.07-3.633 17.7-3.633 17.7C-3.067 16.85-2.47 16.4-2.47 16.4C-1.867 16.08-1.426 15.7-1.426 15.7c-1.164-.795-.88-2.023-.88-2.023-1.447-.986 1.093-1.026 1.093-1.026C3.87 14.2 5.8 14.3 6.95 14.3c.531.181 1.07.275 1.636.417-1.368-.275-2.334-1.12-2.334-1.12-1.907-1.23-.131-1.23-.131-1.23 1.043-.072 2.002.284 2.002.284 1.593 1.417 4.334 1.96 5.594 1.5.17-.797.598-1.347 1.138-1.654-3.57-.404-7.328-1.78-7.328-8.96 0-1.982.71-3.61 1.886-4.884-.187-.472-.817-1.293-.817-2.63 0-.647.225-1.266.63-1.716-.237-.106-.583-1.223.086-2.418 0 0 .512-.164 1.68 2.018.544-.136 1.07-.203 1.612-.203.542 0 1.068.067 1.612.203 1.168-2.182 1.68-2.018 1.68-2.018.67 1.195.324 2.313.086 2.418.405.45.63 1.069.63 1.716 0 1.337-.438 2.158-.817 2.63 1.176 1.274 1.886 2.902 1.886 4.884 0 7.184-3.758 8.552-7.323 8.952.576.522 1.085 1.287 1.085 2.218 0 1.606-.015 2.896-.015 5.257 0 .319.219.692.82.577 4.765-1.585 8.205-6.084 8.205-11.385 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center z-10">
        <Branding />
      </main>

      <footer className="flex flex-col items-center justify-center z-10 pb-4 gap-3">
        <Player {...player} currentPlaylistName={player.currentPlaylistName} switchPlaylist={player.switchPlaylist} />
        <p className="text-[10px] md:text-xs text-white/40">
          Made by <a href="https://github.com/TSAR69" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-all duration-300 hover:drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">TSAR69</a>
        </p>
      </footer>
    </div>
  );
}
