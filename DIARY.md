## 2026-02-18

**Mood:** 📰
**What I did:** Implemented the News/Feed widget for the dashboard. Added an RSS feed reader that can load any RSS or Atom feed URL, displays article titles with links, and includes a refresh button. Uses a CORS proxy to fetch feeds from external URLs. The feed URL is saved in localStorage.
**Learned:** How to parse XML/RSS feeds using the DOMParser API, handling both RSS and Atom feed formats, and using a CORS proxy (allorigins.win) to bypass browser restrictions on cross-origin requests.
**Challenges:** Dealing with CORS issues when fetching RSS feeds directly from browsers, and handling different feed formats (RSS vs Atom) with different element names.

## 2026-02-18

**Mood:** ✅
**What I did:** Implemented the Todo List widget for the dashboard. Added ability to add new tasks via input field, mark tasks as complete with checkboxes, delete individual tasks, and clear all completed tasks. All todos are persisted in localStorage.
**Learned:** How to manage array state in localStorage, handling the checkbox change events, and creating a dynamic list with event delegation for performance.
**Challenges:** Ensuring the delete button only appears on hover to keep the UI clean, and properly updating the task count to show remaining active tasks.

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