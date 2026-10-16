import { useState, useEffect, useRef, useCallback } from 'react';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Player({
  playlist = [],
  availablePlaylists = [],
  currentPlaylistId,
  currentPlaylistName,
  currentIndex = 0,
  selectTrack,
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
  switchPlaylist,
  fetchPlaylistTracks,
}) {
  const [progress, setProgress] = useState(0);
  const [showSpinner, setShowSpinner] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const playerInstance = useRef(null);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);
  const currentVideoIdRef = useRef(null);
  const playRetryRef = useRef(null);
  const prevVolumeRef = useRef(80);
  const playlistContainerRef = useRef(null);
  const [panelView, setPanelView] = useState('playlists');
  const [browsingPlaylistId, setBrowsingPlaylistId] = useState(currentPlaylistId);
  const [browsingPlaylistName, setBrowsingPlaylistName] = useState(currentPlaylistName);
  const [browsingTracks, setBrowsingTracks] = useState([]);
  const [browsingLoading, setBrowsingLoading] = useState(false);
  const [browsingError, setBrowsingError] = useState(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (playRetryRef.current) clearTimeout(playRetryRef.current);
    };
  }, []);

  // Close playlist drop-up on click outside or Escape key
  useEffect(() => {
    if (!showPlaylist) return;
    const handleClickOutside = (e) => {
      if (playlistContainerRef.current && !playlistContainerRef.current.contains(e.target)) {
        setShowPlaylist(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowPlaylist(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPlaylist]);

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
  }, [currentTrack?.id, setCurrentTime, onPlayerReady]);

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

  const applyAudioSettings = useCallback((vol, muted) => {
    if (!playerInstance.current) return;
    try {
      if (muted || vol === 0) {
        if (typeof playerInstance.current.mute === 'function') playerInstance.current.mute();
        if (typeof playerInstance.current.setVolume === 'function') playerInstance.current.setVolume(0);
      } else {
        if (typeof playerInstance.current.unMute === 'function') playerInstance.current.unMute();
        if (typeof playerInstance.current.setVolume === 'function') playerInstance.current.setVolume(vol);
      }
    } catch {}
  }, []);

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (newVolume > 0) {
      setIsMuted(false);
      prevVolumeRef.current = newVolume;
      applyAudioSettings(newVolume, false);
    } else {
      setIsMuted(true);
      applyAudioSettings(0, true);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      const restoreVol = prevVolumeRef.current > 0 ? prevVolumeRef.current : 80;
      setVolume(restoreVol);
      setIsMuted(false);
      applyAudioSettings(restoreVol, false);
    } else {
      prevVolumeRef.current = volume > 0 ? volume : 80;
      setVolume(0);
      setIsMuted(true);
      applyAudioSettings(0, true);
    }
  };

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

            // Attempt muted playback (browsers allow muted autoplay).
            // Do not set isPlaying here — onStateChange PLAYING confirms actual playback.
            let playRetries = 0;
            const maxPlayRetries = 3;
            const attemptPlay = () => {
              try {
                playerInstance.current.mute();
                playerInstance.current.playVideo();
                applyAudioSettings(volume, isMuted);
              } catch {
                playRetries++;
                if (playRetries < maxPlayRetries) {
                  setTimeout(attemptPlay, 300);
                }
              }
            };
            attemptPlay();

            setTimeout(() => {
              applyAudioSettings(volume, isMuted);
            }, 1000);
          },
          onStateChange: (event) => {
            if (!mountedRef.current) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              onTrackEnd();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setShowSpinner(false);
              applyAudioSettings(volume, isMuted);
              if (playRetryRef.current) {
                clearTimeout(playRetryRef.current);
                playRetryRef.current = null;
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
            }
          },
        },
      });
    } catch {
      console.error('YT Player init error');
    }
  }, [onPlayerReady, onTrackEnd, setIsPlaying, volume, isMuted, applyAudioSettings]);

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
      return;
    }

    if (!playerInstance.current) {
      initPlayer(currentTrack.id);
    } else if (currentVideoIdRef.current !== currentTrack.id) {
      currentVideoIdRef.current = currentTrack.id;
      try {
        playerInstance.current.loadVideoById(currentTrack.id);
      } catch {}

      if (playRetryRef.current) clearTimeout(playRetryRef.current);
      let retries = 0;
      const maxRetries = 12;

      const attemptPlay = () => {
        if (!mountedRef.current) return;
        try {
          playerInstance.current.mute();
          playerInstance.current.playVideo();
          applyAudioSettings(volume, isMuted);
        } catch {}
        retries++;
        if (retries < maxRetries) {
          playRetryRef.current = setTimeout(attemptPlay, 400);
        } else {
          setTimeout(() => {
            applyAudioSettings(volume, isMuted);
          }, 1000);
        }
      };

      playRetryRef.current = setTimeout(attemptPlay, 300);
    }
  }, [currentTrack?.id, initPlayer, volume, isMuted, applyAudioSettings]);

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
        applyAudioSettings(volume, isMuted);
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
  }, [volume, isMuted, applyAudioSettings]);

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
    <div className="relative flex flex-col items-center" ref={playlistContainerRef}>
      {/* Functional Playlist Drop-Up Panel */}
      <div
        className={`absolute bottom-full mb-3 w-[92vw] max-w-lg glass-player rounded-2xl p-4 shadow-2xl z-50 border border-white/20 transition-all duration-300 ${showPlaylist ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        style={{ maxHeight: 'calc(100vh - 200px)' }}
      >
          {/* Panel Header */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/10 select-none">
            {panelView === 'playlists' ? (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/90">
                  Playlists
                </span>
                <span className="text-[10px] font-mono text-white/50 px-2 py-0.5 rounded-full bg-white/10">
                  {availablePlaylists.length} {availablePlaylists.length === 1 ? 'playlist' : 'playlists'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setPanelView('playlists');
                    setBrowsingLoading(false);
                    setBrowsingError(null);
                  }}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Back to playlists"
                  title="Back"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <svg className="h-4 w-4 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-white/90">
                  {browsingPlaylistName || 'Playlist'}
                </span>
                <span className="text-[10px] font-mono text-white/50 px-2 py-0.5 rounded-full bg-white/10">
                  {browsingTracks.length} {browsingTracks.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>
            )}
            <button
              onClick={() => setShowPlaylist(false)}
              className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close playlist"
              title="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Panel Content */}
          <div className="overflow-y-auto max-h-56 sm:max-h-72 space-y-1 pr-1 custom-scrollbar">
            {panelView === 'playlists' ? (
              <>
                {availablePlaylists.length === 0 ? (
                  <div className="py-8 text-center text-xs text-white/40">
                    No playlists configured
                  </div>
                ) : (
                                availablePlaylists.map((pl) => {
                    const isActive = pl.id === currentPlaylistId;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => {
                          switchPlaylist(pl.id, pl.name);
                          setBrowsingPlaylistId(pl.id);
                          setBrowsingPlaylistName(pl.name);
                          setPanelView('tracks');
                          setBrowsingLoading(true);
                          setBrowsingError(null);
                          fetchPlaylistTracks(pl.id)
                            .then((tracks) => {
                              setBrowsingTracks(tracks);
                              setBrowsingLoading(false);
                            })
                            .catch((err) => {
                              setBrowsingError(err.message || 'Failed to load tracks');
                              setBrowsingLoading(false);
                            });
                        }}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 group border ${
                          isActive
                            ? 'bg-white/20 text-white border-white/20 shadow-sm'
                            : 'hover:bg-white/10 text-white/80 hover:text-white border-transparent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl object-cover flex-shrink-0 shadow bg-white/10 flex items-center justify-center">
                          <svg className="h-5 w-5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${isActive ? 'font-semibold text-white' : 'font-medium text-white/90'}`}>
                            {pl.name}
                          </p>
                          <p className="text-[10px] text-white/50 truncate">
                            {isActive ? 'Active playlist' : 'Select to browse tracks'}
                          </p>
                        </div>
                        {isActive && (
                          <svg className="h-4 w-4 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </>
            ) : (
              <>
                {browsingLoading && (
                  <div className="py-8 text-center text-xs text-white/40 animate-pulse">
                    Loading tracks…
                  </div>
                )}
                {browsingError && !browsingLoading && (
                  <div className="py-8 text-center text-xs text-white/40">
                    {browsingError}
                    <button
                      onClick={() => {
                        setBrowsingLoading(true);
                        setBrowsingError(null);
                        fetchPlaylistTracks(browsingPlaylistId)
                          .then((tracks) => {
                            setBrowsingTracks(tracks);
                            setBrowsingLoading(false);
                          })
                          .catch((err) => {
                            setBrowsingError(err.message || 'Failed to load tracks');
                            setBrowsingLoading(false);
                          });
                      }}
                      className="mt-2 text-xs underline hover:text-white transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                )}
                {!browsingLoading && !browsingError && browsingTracks.length === 0 && (
                  <div className="py-8 text-center text-xs text-white/40">
                    No tracks in this playlist
                  </div>
                )}
                {!browsingLoading && !browsingError && browsingTracks.length > 0 && (
                  <>
                    {browsingTracks.map((track, idx) => {
                      const globalIndex = playlist.findIndex((t) => t.id === track.id);
                      const isActive = globalIndex === currentIndex;
                      return (
                        <button
                          key={`${track.id}-${idx}`}
                          onClick={() => {
                            if (globalIndex >= 0) {
                              selectTrack(globalIndex);
                              setShowPlaylist(false);
                            }
                          }}
                          className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all duration-150 group border ${
                            isActive
                              ? 'bg-white/20 text-white shadow-sm border border-white/20'
                              : 'hover:bg-white/10 text-white/80 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="w-5 flex-shrink-0 text-center text-[10px] font-mono text-white/50">
                            {isActive ? (
                              <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                          {track.thumbnail && (
                            <img
                              src={track.thumbnail}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover flex-shrink-0 shadow"
                              loading="lazy"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${isActive ? 'font-semibold text-white' : 'font-medium text-white/90'}`}>
                              {track.title}
                            </p>
                            <p className="text-[10px] text-white/50 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>

      {/* Main Player Pill */}
      <div className="glass-player rounded-full px-4 py-3 md:px-6 md:py-4 flex items-center gap-3 md:gap-5 max-w-3xl w-[94vw] md:w-auto">
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
            <span className="text-[10px] text-white/50 w-8 text-right font-mono">{formatTime(currentTime)}</span>
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
              aria-label="Track progress"
            />
            <span className="text-[10px] text-white/50 w-8 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls & Volume & Playlist Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-shrink-0">
          <button
            onClick={playPrev}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 text-white/90"
            aria-label="Previous track"
            title="Previous"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={togglePlay}
            className="p-2 md:p-2.5 rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {showSpinner ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : isPlaying ? (
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={playNext}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 text-white/90"
            aria-label="Next track"
            title="Next"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-1 sm:gap-1.5 pl-1 sm:pl-2 border-l border-white/15">
            <button
              onClick={toggleMute}
              className="p-1 sm:p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-all duration-200 text-white/80 hover:text-white"
              aria-label={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
              title={isMuted || volume === 0 ? 'Unmute' : 'Mute'}
            >
              {isMuted || volume === 0 ? (
                <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
              ) : volume < 50 ? (
                <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
              ) : (
                <svg className="h-4 w-4 sm:h-4.5 sm:w-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              )}
            </button>

            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="progress-bar w-12 sm:w-16 md:w-20"
              style={{
                background: `linear-gradient(to right, rgba(255,255,255,0.9) ${isMuted ? 0 : volume}%, rgba(255,255,255,0.15) ${isMuted ? 0 : volume}%)`,
              }}
              aria-label="Volume slider"
              title={`Volume: ${isMuted ? 0 : volume}%`}
            />
          </div>

          {/* Playlist Drop-Up Toggle Button */}
          <button
            onClick={() => setShowPlaylist((prev) => !prev)}
            className={`p-1.5 sm:p-2 rounded-full transition-all duration-200 ${
              showPlaylist
                ? 'bg-white/25 text-white shadow-inner scale-105'
                : 'hover:bg-white/10 text-white/80 hover:text-white active:scale-95'
            }`}
            aria-label="Toggle playlist drop-up"
            title="Playlist selector"
          >
            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </button>
        </div>

        <div className="fixed pointer-events-none" style={{ opacity: 0, zIndex: -1 }}>
          <div id="yt-player" style={{ width: 1, height: 1 }} />
        </div>
      </div>
    </div>
  );
}
