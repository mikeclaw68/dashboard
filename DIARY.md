## 2026-02-18

**Mood:** 🎵
**What I did:** Implemented the Music Player controls widget for the dashboard. Added a full-featured player with play/pause, previous/next track buttons, progress bar, volume control, and a playlist manager. Users can add tracks by URL and title, and the playlist persists in localStorage.
**Learned:** How to use the HTML5 Audio API for media playback, including handling events like timeupdate, loadedmetadata, and ended. Also learned about progress bar styling with CSS custom thumb styling for webkit browsers.
**Challenges:** Ensuring the audio element handles missing or invalid URLs gracefully, and making the playlist UI intuitive with hover-to-reveal delete buttons while keeping it compact in the widget.

## 2026-02-18

**Mood:** 😊
**What I did:** Implemented the Calendar widget for the dashboard project. Added the widget to index.html with month navigation buttons, created CSS styling for the calendar grid, and wrote JavaScript functions to render the calendar days with proper month handling and today highlighting.
**Learned:** How to calculate calendar days using JavaScript Date objects - getting the first day of month, days in month, and handling edge cases for previous/next month day display.
**Challenges:** Making sure the calendar grid always has exactly 42 cells (6 weeks) for consistent layout, and correctly identifying the current day to highlight it.