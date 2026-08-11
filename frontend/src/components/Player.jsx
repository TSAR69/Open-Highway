import { useState, useEffect, useRef, useCallback } from 'react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Player({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  playerReady,
  error,
  loading,
  togglePlay,
  playNext,
  playPrev,
  seek,
  onPlayerReady,
  onTimeUpdate,
  onTrackEnd,
  setCurrentTime,
  setIsPlaying,
  reload,
}) {
  const [progress, setProgress] = useState(0);
  const [showSpinner, setShowSpinner] = useState(true);
  const playerInstance = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const currentVideoIdRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    setProgress(duration ? (currentTime / duration) * 100 : 0);
  }, [currentTime, duration]);

  useEffect(() => {
    if (playerReady) {
      setShowSpinner(false);
    }
  }, [playerReady]);

  useEffect(() => {
    if (!currentTrack) return;
    setShowSpinner(true);
    setCurrentTime(0);
    setProgress(0);
    onPlayerReady(0);
    setIsPlaying(true);
  }, [currentTrack?.id]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (!isPlaying || !playerReady) return;

    intervalRef.current = setInterval(() => {
      if (playerInstance.current && typeof playerInstance.current.getCurrentTime === 'function') {
        try {
          const ct = playerInstance.current.getCurrentTime();
          const dur = playerInstance.current.getDuration();
          onTimeUpdate(ct);
          if (dur && dur > 0) {
            onPlayerReady(dur);
          }
          if (ct >= dur - 0.5 && dur > 0) {
            onTrackEnd();
          }
        } catch {
          // player may not be ready
        }
      }
    }, 250);

    return () => clearInterval(intervalRef.current);
  }, [isPlaying, playerReady, onTimeUpdate, onPlayerReady, onTrackEnd]);

  const handleProgressChange = (e) => {
    const pct = parseFloat(e.target.value);
    setProgress(pct);
    if (duration && playerInstance.current && typeof playerInstance.current.seekTo === 'function') {
      const time = (pct / 100) * duration;
      playerInstance.current.seekTo(time, true);
      onTimeUpdate(time);
    }
  };

  const playCurrent = useCallback(() => {
    if (!playerInstance.current || !window.YT) return;
    try {
      playerInstance.current.mute();
      playerInstance.current.playVideo();
      playerInstance.current.setVolume(100);
      setTimeout(() => {
        try { playerInstance.current.unMute(); } catch {}
      }, 1000);
    } catch {
      // retry silently
    }
  }, []);

  const initPlayer = useCallback((videoId) => {
    if (!mountedRef.current) return;

    try {
      playerInstance.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (!mountedRef.current) return;
            const dur = playerInstance.current.getDuration();
            onPlayerReady(dur);
            setShowSpinner(false);
            playCurrent();
          },
          onStateChange: (event) => {
            if (!mountedRef.current) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              onTrackEnd();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setShowSpinner(false);
              try { playerInstance.current.unMute(); } catch {}
              playerInstance.current.setVolume(100);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    } catch {
      console.error('YT Player init error');
    }
  }, [onPlayerReady, onTrackEnd, setIsPlaying, playCurrent]);

  useEffect(() => {
    if (!currentTrack?.id) return;

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        initPlayer(currentTrack.id);
      };
    } else if (!playerInstance.current) {
      initPlayer(currentTrack.id);
    } else if (currentVideoIdRef.current !== currentTrack.id) {
      currentVideoIdRef.current = currentTrack.id;
      try {
        playerInstance.current.loadVideoById(currentTrack.id);
        playCurrent();
      } catch {}
    }
  }, [currentTrack?.id, initPlayer, playCurrent]);

  useEffect(() => {
    if (!playerInstance.current || !window.YT) return;
    if (isPlaying) {
      try { playerInstance.current.playVideo(); } catch {}
    } else {
      playerInstance.current.pauseVideo();
    }
  }, [isPlaying]);

  useEffect(() => {
    const onInteract = () => {
      if (playerInstance.current && typeof playerInstance.current.unMute === 'function') {
        try { playerInstance.current.unMute(); } catch {}
        playerInstance.current.setVolume(100);
      }
    };
    window.addEventListener('click', onInteract);
    window.addEventListener('touchstart', onInteract);
    window.addEventListener('keydown', onInteract);
    return () => {
      window.removeEventListener('click', onInteract);
      window.removeEventListener('touchstart', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

  if (loading) {
    return (
      <div className="glass-player rounded-full px-8 py-4 flex items-center gap-4 text-white/70 text-sm">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-player rounded-full px-8 py-4 flex items-center gap-4 text-white/70 text-sm">
        <span>{error}</span>
        <button onClick={reload} className="underline hover:text-white transition-colors">Retry</button>
      </div>
    );
  }

  if (!currentTrack) return null;

  return (
    <div className="glass-player rounded-full px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-5 max-w-2xl w-[92vw] md:w-auto">
      <img
        src={currentTrack.thumbnail}
        alt={currentTrack.title}
        className={`h-10 w-10 md:h-12 md:w-12 rounded-full object-cover shadow-lg flex-shrink-0 ${isPlaying ? 'animate-spin' : ''}`}
        style={{ animationDuration: '4s' }}
        draggable={false}
      />

      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium text-white truncate">{currentTrack.title}</p>
            <p className="text-[10px] md:text-xs text-white/60 truncate">{currentTrack.artist}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-white/50 w-8 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={progress}
            onChange={handleProgressChange}
            className="progress-bar flex-1"
            style={{
              background: `linear-gradient(to right, rgba(255,255,255,0.9) ${progress}%, rgba(255,255,255,0.15) ${progress}%)`,
            }}
          />
          <span className="text-[10px] text-white/50 w-8">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <button
          onClick={playPrev}
          className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 text-white/90"
          aria-label="Previous"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={togglePlay}
          className="p-2 md:p-2.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {showSpinner ? (
            <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          ) : isPlaying ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={playNext}
          className="p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 text-white/90"
          aria-label="Next"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>
      </div>

      <div className="fixed pointer-events-none" style={{ opacity: 0, zIndex: -1 }}>
        <div id="yt-player" style={{ width: 1, height: 1 }} />
      </div>
    </div>
  );
}
