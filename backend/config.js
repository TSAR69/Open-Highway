import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  try {
    const content = readFileSync(join(__dirname, '.env'), 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  } catch (err) {
    console.error('Failed to load .env:', err.message);
  }
}

loadEnv();

export const CONFIG = {
  port: process.env.PORT || 3001,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  youtubePlaylistId: process.env.YOUTUBE_PLAYLIST_ID,
  spotifyUrl: process.env.SPOTIFY_URL || 'https://open.spotify.com/',
  youtubeMusicUrl: process.env.YOUTUBE_MUSIC_URL || 'https://music.youtube.com/',
  onlineCount: parseInt(process.env.ONLINE_COUNT || '28', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
