# Dashboard Project

A personal dashboard for the Raspberry Pi with dual monitors.

## Features to Build

- [x] Clock and date widget
- [x] Weather widget (using wttr.in)
- [x] System stats (CPU, memory, disk)
- [x] Quick links panel
- [x] Notes section
- [x] Background image support
- [x] Calendar widget
- [x] Music player controls
- [x] Todo list widget
- [ ] News/feed widget

## Tech Stack
- Plain HTML/CSS/JS
- wttr.in for weather
- /proc for system stats

## Files
- index.html - Main dashboard
- style.css - Styling
- app.js - JavaScript for widgets

## Running
Serve with any static server:
```bash
npx serve .
# or
python3 -m http.server 8080
```
