# Open Highway 🚗🌌

An immersive, cinematic night-drive music player designed for peaceful, solitary highway journeys. Crafted with understated automotive-dashboard aesthetics, smooth glassmorphism, and a focused audio experience powered by YouTube playlists.

---

## Features

- **Automotive Dashboard Aesthetic**: Minimalist instrument-cluster typography, subtle ambient glows, and dark glassmorphism.
- **Curated Streaming**: Plays audio directly from your favorite YouTube playlists via the YouTube Data API v3 and YouTube IFrame Player.
- **Drop-Up Playlist Selector**: An upward-opening playlist panel to view, inspect, and directly select any track in your queue.
- **Full Volume Control**: Integrated slider and instant mute/unmute toggle that faithfully restores your previous volume across tracks.
- **Digital Highway Clock**: Tabular monospace instrument-cluster clock matching dashboard instrumentation.
- **Ambient Online Beacon**: Real-time subtle driver presence indicator.
- **First-Time Setup Script**: User-friendly `setup.sh` that validates prerequisites, extracts playlist IDs from URLs, and configures environment variables safely.

---

## Prerequisites

Before running Open Highway locally, ensure you have:

1. **Node.js**: Version 18.0.0 or higher (Node 20+ recommended).
2. **npm**: Version 9.0.0 or higher.
3. **YouTube Data API v3 Key**: A free API key from Google Cloud Console.
4. **Public YouTube Playlist**: A YouTube playlist set to **Public** (or **Unlisted**). Private playlists cannot be accessed by the YouTube API.

---

## Getting Your YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services** > **Library**.
4. Search for **YouTube Data API v3** and click **Enable**.
5. Navigate to **APIs & Services** > **Credentials**.
6. Click **Create Credentials** > **API Key**.
7. Copy your generated API key.

---

## Public Playlist Requirement

The playlist you intend to use must be set to **Public** or **Unlisted** in YouTube playlist settings:
- Open your playlist on YouTube or YouTube Music.
- Click the playlist privacy dropdown and select **Public** or **Unlisted**.
- Copy the playlist URL (e.g. `https://www.youtube.com/playlist?list=PL...`) or just the Playlist ID.

---

## Quick Start (Automated Setup)

1. Clone or navigate into the repository:
   ```bash
   cd "Open Highway"
   ```

2. Run the interactive setup script:
   ```bash
   python setup.py
   # or: ./setup.sh
   ```
   *(Works natively across Windows PowerShell, CMD, macOS, and Linux).*

   The script will:
   - Check that Node.js and npm are present.
   - Prompt for your YouTube Data API Key (hidden for security).
   - Prompt for your YouTube Playlist URL or ID (automatically extracting the ID from all standard formats).
   - Safely generate `.env` and `backend/.env`.

3. Install project dependencies:
   ```bash
   npm run install:all
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Manual Configuration (Alternative to `setup.sh`)

If you prefer to configure manually:

1. Copy `.env.example` to `.env` (and optionally `backend/.env`):
   ```bash
   cp .env.example .env
   ```

2. Populate the required variables:
   ```env
   PORT=3001
   YOUTUBE_API_KEY=your_actual_youtube_api_key_here
   YOUTUBE_PLAYLIST_ID=your_actual_playlist_id_here
   ONLINE_COUNT=28
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

---

## Available Scripts

From the root directory:

| Command | Description |
|---|---|
| `npm run dev` | Runs both backend (`localhost:3001`) and frontend (`localhost:5173`) concurrently |
| `npm run dev:frontend` | Runs Vite frontend development server only |
| `npm run dev:backend` | Runs Express backend development server with `--watch` |
| `npm run build` | Builds the frontend production bundle into `frontend/dist` |
| `npm run install:all` | Installs dependencies in both `backend/` and `frontend/` folders |
| `npm start` | Starts the Express server serving static frontend build |

---

## Project Structure

```text
Open Highway/
├── backend/
│   ├── routes/          # Express API routes (/api/playlist, /api/config)
│   ├── services/        # YouTube API data integration
│   ├── config.js        # Environment loader and application configuration
│   └── server.js        # Express application entrypoint
├── frontend/
│   ├── public/          # Static assets (background, icons, svg artwork)
│   ├── src/
│   │   ├── components/  # UI components (Player, Time, Branding, OnlineStatus)
│   │   ├── hooks/       # Custom React hooks (usePlayer)
│   │   ├── index.css    # Tailwind CSS and glassmorphism styling
│   │   └── App.jsx      # Root application layout
│   └── vite.config.js   # Vite configuration with /api proxy to localhost:3001
├── scripts/
│   └── dev.js           # Concurrent local dev process runner
├── setup.sh             # Interactive local setup script
└── package.json         # Root scripts and workspace definition
```

---

## Troubleshooting

### "Music is taking the long way." / Playlist Error
- **Verify API Key**: Confirm that the `YOUTUBE_API_KEY` in `.env` is valid and that "YouTube Data API v3" is enabled in your Google Cloud Console.
- **Verify Playlist Privacy**: Make sure the playlist is **Public** or **Unlisted**. Private playlists return a 404 or 403 error from the YouTube API.
- **Check Quota**: The free YouTube Data API quota provides 10,000 units per day. Each playlist items fetch consumes a minimal number of units and is cached in memory for 5 minutes.

### Port Conflicts
- Default ports are `3001` (Backend) and `5173` (Frontend).
- If port `3001` is already in use on your system, change `PORT=3002` in `.env` and update the proxy target in `frontend/vite.config.js`.

---

## Contributing

Contributions are welcome! Please follow these steps:
1. Ensure changes do not break or alter intentional static visual assets.
2. Verify all builds pass (`npm run build`).
3. Keep pull requests focused on specific features or bug fixes.

---

## Attribution

Created and designed by [TSAR69](https://github.com/TSAR69).
