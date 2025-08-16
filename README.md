<p align="center">
  <!-- Replace the src below with your actual logo path -->
  <a href="https://ozny35.github.io/FocusTicks/" target="_blank" rel="noopener">
    <img src="focusticks_logo.png" alt="FocusTicks Logo" height="96">
  </a>
</p>

<h1 align="center">FocusTicks</h1>
<p align="center">
  Plan tasks, track time, stay focused.
</p>

<p align="center">
  <a href="https://ozny35.github.io/FocusTicks/">Live Demo</a> •
  <a href="https://github.com/ozny35/FocusTicks/releases/latest">Download</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#build-from-source">Build</a> •
  <a href="#development">Development</a> •
  <a href="#deploy-to-github-pages">Deploy</a>
</p>

<p align="center">
  <strong>
    <a href="https://github.com/ozny35/FocusTicks/releases/latest">⬇️ Download for Windows (.msi)</a>
  </strong>
</p>

---

## Getting Started
- Want the desktop app? Download the latest Windows installer: https://github.com/ozny35/FocusTicks/releases/latest
- Want to try in the browser? Open the Live Demo: https://ozny35.github.io/FocusTicks/

---

## Features
- Minimal to‑do lists with drag‑and‑drop reordering
- Stopwatch per list: start/stop/reset, elapsed time tracking
- Categories with emoji + color to organize lists
- Color customization for both lists and individual tasks
- Notes and due dates on tasks
- Smooth animations, responsive UI
- LocalStorage persistence
- Performance optimizations: debounced storage writes, memoized components, lazy‑loaded Emoji Picker
- Built with Vite, React, TypeScript, Tailwind, and Framer Motion

## Desktop (Windows) Installer
- Get the latest .msi from Releases:
  - https://github.com/ozny35/FocusTicks/releases/latest
- After installing, Windows SmartScreen may warn for unsigned apps. Click "More info" → "Run anyway".

## Screenshots
<img src="focusticks_screenshot.png" alt="FocusTicks screenshot" width="800"> 

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS
- Framer Motion
- emoji-picker-react

## Build from Source
```bash
# 1) Install deps
npm install

# 2) Web dev (Vite)
npm run dev
# then open http://localhost:5173

# 3) Desktop dev (Tauri)
# Prereqs: Rust toolchain + VS Build Tools (Windows)
# https://tauri.app/v2/guides/getting-started/prerequisites/
npm run tauri dev

# 4) Production builds
# Web bundle
npm run build
# Windows installer (.msi)
npm run tauri build
```
