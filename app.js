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
