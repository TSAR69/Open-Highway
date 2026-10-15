import express from 'express';
import { CONFIG } from '../config.js';

const router = express.Router();

router.get('/playlist', async (req, res) => {
  try {
    const { getPlaylistData } = await import('../services/youtube.js');
    const data = await getPlaylistData();
    res.json(data);
  } catch (err) {
    console.error('Playlist error:', err.message);
    res.status(500).json({ error: 'Music is taking the long way.' });
  }
});

router.get('/track/:index', async (req, res) => {
  try {
    const { getTrackAt } = await import('../services/youtube.js');
    const index = parseInt(req.params.index, 10);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid track index.' });
    }
    const track = await getTrackAt(index);
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