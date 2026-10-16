import express from 'express';
import { CONFIG } from '../config.js';

const router = express.Router();

router.get('/playlists', (req, res) => {
  res.json(CONFIG.youtubePlaylists);
});

router.get('/playlist', async (req, res) => {
  try {
    const { getPlaylistData } = await import('../services/youtube.js');
    const playlistId = req.query.playlistId;

    if (playlistId !== undefined && (typeof playlistId !== 'string' || playlistId.trim() === '')) {
      console.error('[API] Invalid playlistId parameter:', typeof playlistId, playlistId);
      return res.status(400).json({ error: 'Invalid playlist ID.' });
    }

    const data = await getPlaylistData(playlistId);
    res.json(data);
  } catch (err) {
    // Log useful details server-side without exposing API keys or secrets to the client.
    console.error('[API] Playlist error:', err.message);
    if (process.env.NODE_ENV !== 'production') {
      console.error('[API] Playlist error stack:', err.stack);
    }
    res.status(500).json({ error: 'Music is taking the long way.' });
  }
});

router.get('/track/:index', async (req, res) => {
  try {
    const { getTrackAt } = await import('../services/youtube.js');
    const index = parseInt(req.params.index, 10);
    const playlistId = req.query.playlistId;
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid track index.' });
    }
    const track = await getTrackAt(index, playlistId);
    res.json(track);
  } catch (err) {
    console.error('Track error:', err.message);
    res.status(500).json({ error: 'Music is taking the long way.' });
  }
});

router.get('/config', (req, res) => {
  res.json({
    youtubeMusicUrl: CONFIG.youtubeMusicUrl,
    onlineCount: CONFIG.onlineCount,
  });
});

export default router;