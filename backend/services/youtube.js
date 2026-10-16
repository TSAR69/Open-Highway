const playlistCache = {};
const CACHE_TTL = 5 * 60 * 1000;

export async function getPlaylistData(playlistId) {
  const { CONFIG } = await import('../config.js');

  if (!CONFIG.youtubeApiKey) {
    throw new Error('YouTube API key is not configured on the server.');
  }

  const id = playlistId || CONFIG.youtubePlaylistId;
  if (!id) {
    throw new Error('No playlist ID configured. Set YOUTUBE_PLAYLIST_ID or YOUTUBE_PLAYLISTS.');
  }

  // YouTube playlist IDs start with "PL" and contain alphanumeric characters, hyphens, and underscores.
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id)) {
    throw new Error(`Invalid playlist ID format: ${id}`);
  }

  const now = Date.now();

  if (playlistCache[id] && now - playlistCache[id].timestamp < CACHE_TTL) {
    return playlistCache[id].data;
  }

  const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
  playlistUrl.searchParams.set('part', 'snippet,contentDetails');
  playlistUrl.searchParams.set('id', id);
  playlistUrl.searchParams.set('key', CONFIG.youtubeApiKey);

  const playlistRes = await fetch(playlistUrl.toString());
  if (!playlistRes.ok) {
    const text = await playlistRes.text();
    throw new Error(`YouTube API error: ${playlistRes.status} ${text}`);
  }
  const playlistJson = await playlistRes.json();
  const playlist = playlistJson.items?.[0];
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  const itemsUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
  itemsUrl.searchParams.set('part', 'snippet,contentDetails');
  itemsUrl.searchParams.set('playlistId', id);
  itemsUrl.searchParams.set('maxResults', '50');
  itemsUrl.searchParams.set('key', CONFIG.youtubeApiKey);

  const itemsRes = await fetch(itemsUrl.toString());
  if (!itemsRes.ok) {
    const text = await itemsRes.text();
    throw new Error(`YouTube API error: ${itemsRes.status} ${text}`);
  }
  const itemsJson = await itemsRes.json();

  const tracks = itemsJson.items
    .filter((item) => item.contentDetails?.videoId)
    .map((item) => ({
      id: item.contentDetails.videoId,
      title: item.snippet.title,
      artist: item.snippet.videoOwnerChannelTitle || item.snippet.channelTitle || 'Unknown',
      thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
    }));

  const playlistData = {
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    tracks,
    totalTracks: tracks.length,
  };

  playlistCache[id] = {
    data: playlistData,
    timestamp: now,
  };

  return playlistData;
}

export async function getTrackAt(index, playlistId) {
  const playlist = await getPlaylistData(playlistId);
  if (index < 0 || index >= playlist.tracks.length) {
    throw new Error('Track not found');
  }
  return playlist.tracks[index];
}
