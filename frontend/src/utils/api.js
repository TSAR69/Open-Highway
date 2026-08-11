const API_BASE = '/api';

export async function fetchPlaylist() {
  const res = await fetch(`${API_BASE}/playlist`);
  if (!res.ok) throw new Error('Failed to fetch playlist');
  return res.json();
}

export async function fetchConfig() {
  const res = await fetch(`${API_BASE}/config`);
  if (!res.ok) throw new Error('Failed to fetch config');
  return res.json();
}
