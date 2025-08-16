<p align="center">
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
  <a href="#downloads">Downloads</a> •
  <a href="#install">Install</a> •
  <a href="#build-from-source">Build</a>
</p>

---

## Getting Started
- Want the desktop app? Download the latest Windows installer: https://github.com/ozny35/FocusTicks/releases/latest
- Want the mobile app? Get the Android APK from Releases (signed): https://github.com/ozny35/FocusTicks/releases/latest
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

## Screenshots
<img src="focusticks_screenshot.png" alt="FocusTicks screenshot" width="800">

## Tech Stack
- Vite + React + TypeScript
- Tailwind CSS
- Framer Motion
- emoji-picker-react

## Downloads
- Windows (.msi): see the latest Release: https://github.com/ozny35/FocusTicks/releases/latest (`FocusTicks_0.1.0_x64_en-US.msi`)
- Android (APK): see the latest Release: https://github.com/ozny35/FocusTicks/releases/latest (`FocusTicks-android-universal-v0.1.0-signed.apk`)

## System Requirements
- Windows: 10/11 (64‑bit)
- Android: 7.0+ (API 24+) recommended

## Install
- Windows
  - Download the .msi and run it
  - SmartScreen may warn for unsigned apps → click "More info" → "Run anyway"
- Android
  - Enable "Install unknown apps" on your device
  - Install the APK directly or via ADB:
    ```bash
    adb install -r FocusTicks-android-universal-v0.1.0-signed.apk 
    ```

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
