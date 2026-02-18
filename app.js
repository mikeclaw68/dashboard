// Clock
function updateClock() {
  const now = new Date();
  document.getElementById('time').textContent = now.toLocaleTimeString('en-GB', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  document.getElementById('date').textContent = now.toLocaleDateString('en-GB', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  });
}
updateClock();
setInterval(updateClock, 1000);

// Weather
async function fetchWeather() {
  try {
    const res = await fetch('https://wttr.in/Rome?format=%c%t');
    const text = await res.text();
    document.getElementById('weather').textContent = text.trim();
  } catch (e) {
    document.getElementById('weather').textContent = 'Unavailable';
  }
}
fetchWeather();
setInterval(fetchWeather, 600000); // 10 min

// System Stats
async function fetchStats() {
  try {
    // CPU
    const cpuRes = await fetch('/proc/stat');
    const cpuText = await cpuRes.text();
    const cpuLines = cpuText.split('\n')[0].split(/\s+/).slice(1, 5);
    const idle = parseInt(cpuLines[3]);
    const total = cpuLines.reduce((a, b) => a + parseInt(b), 0);
    const cpu = Math.round((1 - idle / total) * 100);
    document.getElementById('cpu').textContent = cpu;
    
    // RAM
    const memRes = await fetch('/proc/meminfo');
    const memText = await memRes.text();
    const memLines = memText.split('\n');
    const memTotal = parseInt(memLines[0].split(/\s+/)[1]);
    const memAvailable = parseInt(memLines[1].split(/\s+/)[1]);
    const memUsed = memTotal - memAvailable;
    const ram = Math.round((memUsed / memTotal) * 100);
    document.getElementById('ram').textContent = ram;
    
    // Disk (simulated)
    document.getElementById('disk').textContent = 45;
  } catch (e) {
    console.error('Stats error:', e);
  }
}
fetchStats();
setInterval(fetchStats, 5000);

// Calendar
let currentMonth = new Date();

function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  document.getElementById('month-year').textContent = `${monthNames[month]} ${year}`;
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  
  const daysContainer = document.getElementById('calendar-days');
  daysContainer.innerHTML = '';
  
  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('span');
    day.textContent = daysInPrevMonth - i;
    day.className = 'other-month';
    daysContainer.appendChild(day);
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('span');
    day.textContent = i;
    if (isCurrentMonth && i === todayDate) {
      day.className = 'today';
    }
    daysContainer.appendChild(day);
  }
  
  // Next month days
  const totalCells = firstDay + daysInMonth;
  const remainingCells = 7 - (totalCells % 7);
  if (remainingCells < 7) {
    for (let i = 1; i <= remainingCells; i++) {
      const day = document.createElement('span');
      day.textContent = i;
      day.className = 'other-month';
      daysContainer.appendChild(day);
    }
  }
}

document.getElementById('prev-month').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() - 1);
  renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
  currentMonth.setMonth(currentMonth.getMonth() + 1);
  renderCalendar();
});

renderCalendar();

// Music Player
const audio = new Audio();
let playlist = JSON.parse(localStorage.getItem('dashboard-playlist') || '[]');
let currentTrackIndex = -1;
let isPlaying = false;

const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress');
const volumeBar = document.getElementById('volume');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const trackNameEl = document.getElementById('track-name');
const trackArtistEl = document.getElementById('track-artist');
const playlistEl = document.getElementById('playlist');
const addBtn = document.getElementById('add-btn');
const trackUrlInput = document.getElementById('track-url');
const trackTitleInput = document.getElementById('track-title');

function formatTime(seconds) {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function renderPlaylist() {
  playlistEl.innerHTML = '';
  playlist.forEach((track, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${track.title}</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    `;
    if (index === currentTrackIndex) {
      li.classList.add('playing');
    }
    li.addEventListener('click', (e) => {
      if (!e.target.classList.contains('remove-btn')) {
        playTrack(index);
      }
    });
    playlistEl.appendChild(li);
  });
  
  // Remove buttons
  playlistEl.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      playlist.splice(idx, 1);
      if (idx < currentTrackIndex) {
        currentTrackIndex--;
      } else if (idx === currentTrackIndex) {
        audio.pause();
        audio.src = '';
        currentTrackIndex = -1;
        isPlaying = false;
        updatePlayButton();
      }
      localStorage.setItem('dashboard-playlist', JSON.stringify(playlist));
      renderPlaylist();
    });
  });
}

function playTrack(index) {
  if (index < 0 || index >= playlist.length) return;
  
  currentTrackIndex = index;
  const track = playlist[index];
  audio.src = track.url;
  audio.play().then(() => {
    isPlaying = true;
    updatePlayButton();
  }).catch(err => {
    console.error('Playback error:', err);
  });
  
  trackNameEl.textContent = track.title;
  trackArtistEl.textContent = track.artist || 'Unknown Artist';
  renderPlaylist();
}

function updatePlayButton() {
  playBtn.textContent = isPlaying ? '⏸' : '▶';
}

playBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  
  if (currentTrackIndex === -1) {
    playTrack(0);
  } else if (isPlaying) {
    audio.pause();
    isPlaying = false;
  } else {
    audio.play();
    isPlaying = true;
  }
  updatePlayButton();
});

prevBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  const newIndex = currentTrackIndex <= 0 ? playlist.length - 1 : currentTrackIndex - 1;
  playTrack(newIndex);
});

nextBtn.addEventListener('click', () => {
  if (playlist.length === 0) return;
  const newIndex = currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
  playTrack(newIndex);
});

audio.addEventListener('timeupdate', () => {
  if (audio.duration) {
    const progress = (audio.currentTime / audio.duration) * 100;
    progressBar.value = progress;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
});

audio.addEventListener('loadedmetadata', () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('ended', () => {
  // Auto play next track
  const newIndex = currentTrackIndex >= playlist.length - 1 ? 0 : currentTrackIndex + 1;
  playTrack(newIndex);
});

progressBar.addEventListener('input', () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

volumeBar.addEventListener('input', () => {
  audio.volume = volumeBar.value / 100;
  localStorage.setItem('dashboard-volume', volumeBar.value);
});

// Load saved volume
const savedVolume = localStorage.getItem('dashboard-volume') || 80;
volumeBar.value = savedVolume;
audio.volume = savedVolume / 100;

// Add track
addBtn.addEventListener('click', () => {
  const url = trackUrlInput.value.trim();
  const title = trackTitleInput.value.trim() || 'Unknown Track';
  
  if (url) {
    playlist.push({ url, title, artist: 'Unknown Artist' });
    localStorage.setItem('dashboard-playlist', JSON.stringify(playlist));
    trackUrlInput.value = '';
    trackTitleInput.value = '';
    renderPlaylist();
    
    // If first track, select it
    if (playlist.length === 1) {
      currentTrackIndex = 0;
      trackNameEl.textContent = title;
      trackArtistEl.textContent = 'Unknown Artist';
    }
  }
});

// Initialize playlist display
renderPlaylist();

// Todo List
let todos = JSON.parse(localStorage.getItem('dashboard-todos') || '[]');

const todoInput = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoList = document.getElementById('todo-list');
const todoCount = document.getElementById('todo-count');
const todoClearCompleted = document.getElementById('todo-clear-completed');

function renderTodos() {
  todoList.innerHTML = '';
  todos.forEach((todo, index) => {
    const li = document.createElement('li');
    if (todo.completed) {
      li.classList.add('completed');
    }
    li.innerHTML = `
      <input type="checkbox" ${todo.completed ? 'checked' : ''} data-index="${index}">
      <span>${todo.text}</span>
      <button class="delete-btn" data-index="${index}">✕</button>
    `;
    todoList.appendChild(li);
  });
  
  // Checkbox handlers
  todoList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index);
      todos[index].completed = e.target.checked;
      localStorage.setItem('dashboard-todos', JSON.stringify(todos));
      renderTodos();
    });
  });
  
  // Delete handlers
  todoList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      todos.splice(index, 1);
      localStorage.setItem('dashboard-todos', JSON.stringify(todos));
      renderTodos();
    });
  });
  
  // Update count
  const activeCount = todos.filter(t => !t.completed).length;
  todoCount.textContent = `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`;
}

function addTodo() {
  const text = todoInput.value.trim();
  if (text) {
    todos.push({ text, completed: false });
    localStorage.setItem('dashboard-todos', JSON.stringify(todos));
    todoInput.value = '';
    renderTodos();
  }
}

todoAddBtn.addEventListener('click', addTodo);
todoInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    addTodo();
  }
});

todoClearCompleted.addEventListener('click', () => {
  todos = todos.filter(t => !t.completed);
  localStorage.setItem('dashboard-todos', JSON.stringify(todos));
  renderTodos();
});

renderTodos();

// Notes - save to localStorage
const notes = document.getElementById('notes');
notes.value = localStorage.getItem('dashboard-notes') || '';
notes.addEventListener('input', () => {
  localStorage.setItem('dashboard-notes', notes.value);
});

// Background Image Support
const bgToggle = document.getElementById('bg-toggle');
const bgUrlInput = document.getElementById('bg-url');
const bgApplyBtn = document.getElementById('bg-apply');

// Load saved settings
const savedBgEnabled = localStorage.getItem('dashboard-bg-enabled') === 'true';
const savedBgUrl = localStorage.getItem('dashboard-bg-url') || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920';

bgToggle.checked = savedBgEnabled;
bgUrlInput.value = savedBgUrl;

function applyBackground() {
  const body = document.body;
  if (bgToggle.checked) {
    const bgUrl = bgUrlInput.value || savedBgUrl;
    body.style.backgroundImage = `linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)), url(${bgUrl})`;
    body.classList.add('bg-image');
    localStorage.setItem('dashboard-bg-enabled', 'true');
    localStorage.setItem('dashboard-bg-url', bgUrl);
  } else {
    body.style.backgroundImage = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
    body.classList.remove('bg-image');
    localStorage.setItem('dashboard-bg-enabled', 'false');
  }
}

// Apply saved background on load
applyBackground();

// Event listeners
bgToggle.addEventListener('change', applyBackground);
bgApplyBtn.addEventListener('click', applyBackground);
