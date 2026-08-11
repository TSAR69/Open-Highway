let cachedPlaylist = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getPlaylistData() {
  const now = Date.now();
  if (cachedPlaylist && now - cacheTimestamp < CACHE_TTL) {
    return cachedPlaylist;
  }

  const { CONFIG } = await import('../config.js');

  const playlistUrl = new URL('https://www.googleapis.com/youtube/v3/playlists');
  playlistUrl.searchParams.set('part', 'snippet,contentDetails');
  playlistUrl.searchParams.set('id', CONFIG.youtubePlaylistId);
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
  itemsUrl.searchParams.set('playlistId', CONFIG.youtubePlaylistId);
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

  cachedPlaylist = {
    title: playlist.snippet.title,
    description: playlist.snippet.description,
    tracks,
    totalTracks: tracks.length,
  };
  cacheTimestamp = now;

  return cachedPlaylist;
}

export async function getTrackAt(index) {
  const playlist = await getPlaylistData();
  if (index < 0 || index >= playlist.tracks.length) {
    throw new Error('Track not found');
  }
  return playlist.tracks[index];
}
