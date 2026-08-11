import { useState, useEffect } from 'react';

export default function MusicLinks() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      })
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  if (!config) return null;

  return (
    <div className="flex items-center gap-6 text-sm font-light">
      <a
        href={config.spotifyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors duration-300"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.66.48-1.02.24-2.82-1.74-6.36-2.1-10.56-1.14-.42.12-.78-.18-.9-.54-.12-.42.18-.78.54-.9 4.56-1.08 8.34-.66 11.48 1.32.42.18.48.66.24 1.02zm1.44-3.24c-.3.42-.84.6-1.26.3-3.24-1.98-8.16-2.58-11.98-1.44-.48.12-1.02-.12-1.14-.54-.12-.48.12-1.02.6-1.14 4.5-1.32 9.6-.72 13.26 1.62.42.18.54.72.3 1.14v.06zm.12-3.3c-3.9-2.34-10.32-2.58-14.04-1.44-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.32 11.52-.96 16.02 1.68.54.3.72.96.42 1.5-.3.48-.96.72-1.5.42l-.24.06z" />
        </svg>
        <span className="font-semibold">Spotify</span>
        <span className="text-white/50">↗</span>
      </a>
      <a
        href={config.youtubeMusicUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors duration-300"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228 18.228 15.432 18.228 12 15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z" />
        </svg>
        <span className="font-semibold">YT Music</span>
        <span className="text-white/50">↗</span>
      </a>
    </div>
  );
}

