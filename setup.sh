#!/usr/bin/env python3
# -*- coding: utf-8 -*-
''''exec python3 "$0" "$@" # '''
''''exec python "$0" "$@" # '''
"""
Open Highway — Local Setup Script (Python)
Configures YouTube API Key and Playlist ID for local development.
"""

import sys
import os
import re
import shutil
import subprocess
import getpass
from pathlib import Path

# ANSI colors
BOLD = "\033[1m"
CYAN = "\033[0;36m"
GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
RED = "\033[0;31m"
RESET = "\033[0m"

# Enable VT100 colors on Windows if possible
if os.name == 'nt':
    try:
        import ctypes
        kernel32 = ctypes.windll.kernel32
        kernel32.SetConsoleMode(kernel32.GetStdHandle(-11), 7)
    except Exception:
        pass


def banner():
    print(f"\n{CYAN}{BOLD}{'═' * 63}{RESET}")
    print(f"{CYAN}{BOLD}{'OPEN HIGHWAY — INITIAL SETUP':^63}{RESET}")
    print(f"{CYAN}{BOLD}{'═' * 63}{RESET}\n")
    print(f"Welcome to {BOLD}Open Highway{RESET}.")
    print("This setup script will configure your local environment by:")
    print("  1. Checking that required tools (Node.js and npm) are installed.")
    print("  2. Setting up your YouTube Data API v3 key.")
    print("  3. Extracting and validating your YouTube playlist ID.")
    print("  4. Generating or safely updating your local .env configuration.\n")
    print(f"{YELLOW}IMPORTANT:{RESET} Your YouTube playlist must be set to {BOLD}Public{RESET} (or Unlisted)")
    print("so the YouTube Data API can fetch the track list.\n")


def check_tools():
    print(f"{BOLD}[1/4] Checking required tools...{RESET}")

    # Check Node.js
    node_path = shutil.which("node")
    if not node_path:
        print(f"{RED}Error:{RESET} Node.js is not installed or not in your PATH.")
        print("Please install Node.js (v18 or higher recommended) from https://nodejs.org/")
        sys.exit(1)

    try:
        node_res = subprocess.run([node_path, "-v"], capture_output=True, text=True, check=True)
        node_version = node_res.stdout.strip()
        print(f"  ✓ Node.js is installed ({GREEN}{node_version}{RESET})")
    except Exception as e:
        print(f"{RED}Error checking Node.js version:{RESET} {e}")
        sys.exit(1)

    # Check npm
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    npm_path = shutil.which(npm_cmd) or shutil.which("npm")
    if not npm_path:
        print(f"{RED}Error:{RESET} npm is not installed or not in your PATH.")
        sys.exit(1)

    try:
        npm_res = subprocess.run([npm_path, "-v"], capture_output=True, text=True, check=True)
        npm_version = npm_res.stdout.strip()
        print(f"  ✓ npm is installed ({GREEN}v{npm_version}{RESET})\n")
    except Exception as e:
        print(f"{RED}Error checking npm version:{RESET} {e}")
        sys.exit(1)


def extract_playlist_id(url: str) -> str:
    url = url.strip()
    match = re.search(r'[?&]list=([a-zA-Z0-9_-]+)', url)
    if match:
        return match.group(1)

    if re.match(r'^[a-zA-Z0-9_-]{10,60}$', url):
        return url

    return ""


def read_existing_env(file_path: Path):
    if not file_path.is_file():
        return {}
    env_vars = {}
    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            if "=" in stripped:
                key, val = stripped.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                env_vars[key] = val
    return env_vars


def get_api_key(existing_key: str) -> str:
    print(f"{BOLD}[2/4] YouTube Data API v3 Key Configuration{RESET}")
    print("You can create a free API key in the Google Cloud Console:")
    print("https://console.cloud.google.com/apis/credentials")
    print("(Ensure 'YouTube Data API v3' is enabled on your project).\n")

    if existing_key:
        if len(existing_key) > 8:
            masked = f"{existing_key[:4]}...{existing_key[-4:]}"
        else:
            masked = "********"
        print(f"Existing YouTube API Key found: {CYAN}{masked}{RESET}")
        try:
            choice = input("Do you want to change it? (y/N): ").strip().lower()
        except EOFError:
            choice = "n"
        if choice != "y":
            return existing_key

    while True:
        try:
            user_key = getpass.getpass("Enter your YouTube Data API Key (input hidden): ")
        except (EOFError, Exception):
            try:
                user_key = input("Enter your YouTube Data API Key: ")
            except EOFError:
                user_key = ""

        user_key = user_key.strip()
        if not user_key:
            print(f"{RED}Error:{RESET} API Key cannot be empty. Please try again.")
            continue

        if len(user_key) < 20:
            print(f"{RED}Error:{RESET} API Key appears too short to be valid. Please check and try again.")
            continue

        print(f"  ✓ API Key accepted ({GREEN}length: {len(user_key)} chars{RESET})\n")
        return user_key


def get_playlist_id(existing_id: str) -> str:
    print(f"{BOLD}[3/4] YouTube Playlist Configuration{RESET}")
    print("Provide the URL or ID of the public YouTube playlist you want to stream.")
    print("Examples:")
    print("  • https://www.youtube.com/playlist?list=PLxxxxxxxxxxxx")
    print("  • https://music.youtube.com/playlist?list=PLxxxxxxxxxxxx")
    print("  • https://www.youtube.com/watch?v=...&list=PLxxxxxxxxxxxx")
    print("  • PLxxxxxxxxxxxx\n")

    if existing_id:
        print(f"Existing Playlist ID found: {CYAN}{existing_id}{RESET}")
        try:
            choice = input("Do you want to change it? (y/N): ").strip().lower()
        except EOFError:
            choice = "n"
        if choice != "y":
            return existing_id

    while True:
        try:
            user_input = input("Enter YouTube Playlist URL or ID: ").strip()
        except EOFError:
            user_input = ""

        if not user_input:
            print(f"{RED}Error:{RESET} Playlist URL/ID cannot be empty. Please try again.")
            continue

        parsed_id = extract_playlist_id(user_input)
        if not parsed_id or len(parsed_id) < 8:
            print(f"{RED}Error:{RESET} Could not extract a valid YouTube playlist ID from '{user_input}'.")
            print("Please make sure the URL contains '?list=...' or provide the raw playlist ID.")
            continue

        print(f"  ✓ Extracted Playlist ID: {GREEN}{parsed_id}{RESET}\n")
        return parsed_id


def write_env(root_dir: Path, api_key: str, playlist_id: str):
    print(f"{BOLD}[4/4] Writing configuration...{RESET}")
    env_file = root_dir / ".env"
    backend_env = root_dir / "backend" / ".env"

    defaults = {
        "PORT": "3001",
        "ONLINE_COUNT": "28",
        "CORS_ORIGIN": "http://localhost:5173",
        "NODE_ENV": "development",
        "YOUTUBE_MUSIC_URL": "https://music.youtube.com/",
    }

    lines = []
    written_keys = set()

    if env_file.is_file():
        with open(env_file, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if not stripped or stripped.startswith("#"):
                    lines.append(line)
                    continue
                if "=" in stripped:
                    key = stripped.split("=", 1)[0].strip()
                    if key == "YOUTUBE_API_KEY":
                        lines.append(f"YOUTUBE_API_KEY={api_key}\n")
                        written_keys.add("YOUTUBE_API_KEY")
                    elif key == "YOUTUBE_PLAYLIST_ID":
                        lines.append(f"YOUTUBE_PLAYLIST_ID={playlist_id}\n")
                        written_keys.add("YOUTUBE_PLAYLIST_ID")
                    else:
                        lines.append(line)
                        written_keys.add(key)
                else:
                    lines.append(line)

    if "YOUTUBE_API_KEY" not in written_keys:
        lines.append(f"YOUTUBE_API_KEY={api_key}\n")
    if "YOUTUBE_PLAYLIST_ID" not in written_keys:
        lines.append(f"YOUTUBE_PLAYLIST_ID={playlist_id}\n")

    for k, v in defaults.items():
        if k not in written_keys:
            lines.append(f"{k}={v}\n")

    content = "".join(lines)
    with open(env_file, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓ Saved configuration to {GREEN}.env{RESET}")

    backend_env.parent.mkdir(parents=True, exist_ok=True)
    with open(backend_env, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  ✓ Synchronized to {GREEN}backend/.env{RESET}\n")


def main():
    root_dir = Path(__file__).resolve().parent
    os.chdir(root_dir)

    banner()
    check_tools()

    existing_env = read_existing_env(root_dir / ".env")
    if existing_env:
        print(f"{YELLOW}Notice:{RESET} Found existing .env configuration.\n")

    api_key = get_api_key(existing_env.get("YOUTUBE_API_KEY", ""))
    playlist_id = get_playlist_id(existing_env.get("YOUTUBE_PLAYLIST_ID", ""))

    write_env(root_dir, api_key, playlist_id)

    print(f"{GREEN}{BOLD}Setup completed successfully!{RESET}\n")
    print(f"{BOLD}Next steps:{RESET}")
    print(f"  1. Install dependencies (if not already done):")
    print(f"     {CYAN}npm run install:all{RESET}\n")
    print(f"  2. Start the local development server:")
    print(f"     {CYAN}npm run dev{RESET}\n")
    print(f"  3. Open your browser at:")
    print(f"     {CYAN}http://localhost:5173{RESET}\n")
    print(f"{CYAN}Enjoy the drive with Open Highway.{RESET}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Setup cancelled by user.{RESET}")
        sys.exit(0)
