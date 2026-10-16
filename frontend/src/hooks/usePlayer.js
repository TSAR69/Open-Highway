import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = '/api';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function usePlayer() {
  const [playlist, setPlaylist] = useState([]);
  const [availablePlaylists, setAvailablePlaylists] = useState([]);
  const [currentPlaylistId, setCurrentPlaylistId] = useState(null);
  const [currentPlaylistName, setCurrentPlaylistName] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ref to always have current availablePlaylists without adding it to loadPlaylist deps
  const availablePlaylistsRef = useRef(availablePlaylists);
  availablePlaylistsRef.current = availablePlaylists;

  const currentTrack = playlist[currentIndex] || null;

  const resolvePlaylistName = useCallback((playlistId, playlists) => {
    if (!playlistId) return null;
    const found = playlists.find((pl) => pl.id === playlistId);
    return found ? found.name : null;
  }, []);

  const loadPlaylist = useCallback(async (playlistId = null) => {
    try {
      setLoading(true);
      setError(null);
      const url = playlistId ? `${API_BASE}/playlist?playlistId=${playlistId}` : `${API_BASE}/playlist`;
      const data = await fetch(url).then((r) => {
        if (!r.ok) throw new Error('Failed to load playlist');
        return r.json();
      });
      const tracks = data.tracks || [];
      const shuffled = shuffleArray(tracks);
      setPlaylist(shuffled);
      setCurrentIndex(0);
      if (playlistId) {
        setCurrentPlaylistId(playlistId);
        setCurrentPlaylistName(resolvePlaylistName(playlistId, availablePlaylistsRef.current));
      }
    } catch (err) {
      setError(err.message || 'Failed to load playlist');
    } finally {
      setLoading(false);
    }
  }, [resolvePlaylistName]);

  const switchPlaylist = useCallback(async (playlistId, playlistName) => {
    setCurrentPlaylistId(playlistId);
    setCurrentPlaylistName(playlistName || null);
    await loadPlaylist(playlistId);
  }, [loadPlaylist]);

  const fetchPlaylistTracks = useCallback(async (playlistId) => {
    const url = `${API_BASE}/playlist?playlistId=${playlistId}`;
    const data = await fetch(url).then((r) => {
      if (!r.ok) throw new Error('Failed to load playlist');
      return r.json();
    });
    return data.tracks || [];
  }, []);

  useEffect(() => {
    const initPlayer = async () => {
      try {
        const playlistsData = await fetch(`${API_BASE}/playlists`).then((r) => {
          if (!r.ok) throw new Error('Failed to load playlists');
          return r.json();
        });

        const playlists = Object.entries(playlistsData).map(([name, id]) => ({ name, id }));
        setAvailablePlaylists(playlists);

        if (playlists.length > 0) {
          await loadPlaylist(playlists[0].id);
        } else {
          await loadPlaylist();
        }
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Unable to load playlists.');
        setLoading(false);
      }
    };
    initPlayer();
  }, [loadPlaylist]);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setCurrentTime(0);
    setDuration(0);
    setPlayerReady(false);
  }, [playlist.length]);

  const playPrev = useCallback(() => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    setCurrentTime(0);
    setDuration(0);
    setPlayerReady(false);
  }, [playlist.length]);

  const selectTrack = useCallback((index) => {
    if (index < 0 || index >= playlist.length) return;
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setPlayerReady(false);
  }, [playlist.length]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const seek = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const onPlayerReady = useCallback((dur) => {
    setDuration(dur);
    setPlayerReady(true);
  }, []);

  const onTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const onTrackEnd = useCallback(() => {
    playNext();
  }, [playNext]);

  return {
    playlist,
    availablePlaylists,
    currentPlaylistId,
    currentPlaylistName,
    currentTrack,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    playerReady,
    error,
    loading,
    setCurrentTime,
    setIsPlaying,
    playNext,
    playPrev,
    togglePlay,
    seek,
    onPlayerReady,
    onTimeUpdate,
    onTrackEnd,
    reload: (id) => loadPlaylist(id),
    selectTrack,
    switchPlaylist,
    fetchPlaylistTracks,
  };
}
