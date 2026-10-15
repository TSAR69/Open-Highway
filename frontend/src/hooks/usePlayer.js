import { useState, useEffect, useCallback } from 'react';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentTrack = playlist[currentIndex] || null;

  const loadPlaylist = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetch(`${API_BASE}/playlist`).then((r) => {
        if (!r.ok) throw new Error('Failed');
        return r.json();
      });
      const tracks = data.tracks || [];
      const shuffled = shuffleArray(tracks);
      setPlaylist(shuffled);
      setCurrentIndex(0);
    } catch (err) {
      setError('Music is taking the long way.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlaylist();
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
    reload: loadPlaylist,
    selectTrack,
  };
}
