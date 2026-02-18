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

// News Feed
const feedUrlInput = document.getElementById('feed-url');
const feedLoadBtn = document.getElementById('feed-load-btn');
const feedRefreshBtn = document.getElementById('feed-refresh');
const newsList = document.getElementById('news-list');

let currentFeedUrl = localStorage.getItem('dashboard-feed-url') || 'https://hnrss.org/frontpage';

feedUrlInput.value = currentFeedUrl;

async function fetchFeed(url) {
  newsList.innerHTML = '<div class="news-loading">Loading feed...</div>';
  
  try {
    // Use a CORS proxy for RSS feeds
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    const res = await fetch(proxyUrl);
    const text = await res.text();
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    
    const items = xml.querySelectorAll('item');
    
    if (items.length === 0) {
      // Try Atom format
      const entries = xml.querySelectorAll('entry');
      if (entries.length === 0) {
        throw new Error('No feed items found');
      }
      renderNews(entries, 'atom');
    } else {
      renderNews(items, 'rss');
    }
    
    localStorage.setItem('dashboard-feed-url', url);
    currentFeedUrl = url;
  } catch (e) {
    newsList.innerHTML = `<div class="news-error">Error loading feed: ${e.message}</div>`;
  }
}

function renderNews(items, format) {
  newsList.innerHTML = '';
  
  if (items.length === 0) {
    newsList.innerHTML = '<div class="news-empty">No articles found</div>';
    return;
  }
  
  const maxItems = 10;
  for (let i = 0; i < Math.min(items.length, maxItems); i++) {
    const item = items[i];
    let title, link, date;
    
    if (format === 'rss') {
      title = item.querySelector('title')?.textContent || 'No title';
      link = item.querySelector('link')?.textContent || '#';
      date = item.querySelector('pubDate')?.textContent || item.querySelector('dc\\:date')?.textContent;
    } else {
      title = item.querySelector('title')?.textContent || 'No title';
      link = item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '#';
      date = item.querySelector('published')?.textContent || item.querySelector('updated')?.textContent;
    }
    
    // Format date
    let dateStr = '';
    if (date) {
      try {
        const d = new Date(date);
        dateStr = d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        dateStr = date;
      }
    }
    
    const div = document.createElement('div');
    div.className = 'news-item';
    div.innerHTML = `
      <a href="${link}" target="_blank" rel="noopener">${title}</a>
      ${dateStr ? `<div class="news-meta">${dateStr}</div>` : ''}
    `;
    newsList.appendChild(div);
  }
}

feedLoadBtn.addEventListener('click', () => {
  const url = feedUrlInput.value.trim();
  if (url) {
    fetchFeed(url);
  }
});

feedUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const url = feedUrlInput.value.trim();
    if (url) {
      fetchFeed(url);
    }
  }
});

feedRefreshBtn.addEventListener('click', () => {
  if (currentFeedUrl) {
    fetchFeed(currentFeedUrl);
  }
});

// Load default feed on page load
fetchFeed(currentFeedUrl);

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

// World Clock
let timezones = JSON.parse(localStorage.getItem('dashboard-timezones') || '[]');

const timezoneSelect = document.getElementById('timezone-select');
const addTimezoneBtn = document.getElementById('add-timezone-btn');
const worldClockList = document.getElementById('world-clock-list');

function renderWorldClock() {
  worldClockList.innerHTML = '';
  timezones.forEach((tz, index) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-GB', { 
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit'
    });
    const cityName = tz.split('/').pop().replace(/_/g, ' ');
    
    const div = document.createElement('div');
    div.className = 'world-clock-item';
    div.innerHTML = `
      <span class="city">${cityName}</span>
      <span class="time">${timeStr}</span>
      <button class="remove-btn" data-index="${index}">✕</button>
    `;
    worldClockList.appendChild(div);
  });
  
  // Remove buttons
  worldClockList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      timezones.splice(index, 1);
      localStorage.setItem('dashboard-timezones', JSON.stringify(timezones));
      renderWorldClock();
    });
  });
}

function updateWorldClockTimes() {
  const items = worldClockList.querySelectorAll('.world-clock-item');
  items.forEach((item, index) => {
    const tz = timezones[index];
    if (tz) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { 
        timeZone: tz,
        hour: '2-digit',
        minute: '2-digit'
      });
      item.querySelector('.time').textContent = timeStr;
    }
  });
}

addTimezoneBtn.addEventListener('click', () => {
  const tz = timezoneSelect.value;
  if (tz && !timezones.includes(tz)) {
    timezones.push(tz);
    localStorage.setItem('dashboard-timezones', JSON.stringify(timezones));
    renderWorldClock();
    timezoneSelect.value = '';
  }
});

renderWorldClock();
setInterval(updateWorldClockTimes, 1000);

// Cryptocurrency Prices
const cryptoList = document.getElementById('crypto-list');
const cryptoRefreshBtn = document.getElementById('crypto-refresh');

// Top cryptocurrencies to track
const cryptoCoins = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', icon: 'Ξ' },
  { id: 'tether', symbol: 'USDT', name: 'Tether', icon: '₮' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', icon: '◈' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', icon: '◎' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', icon: '✕' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', icon: '₳' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð' }
];

function formatPrice(price) {
  if (price >= 1000) {
    return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (price >= 1) {
    return '$' + price.toFixed(2);
  } else {
    return '$' + price.toFixed(4);
  }
}

function formatChange(change) {
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(2) + '%';
}

async function fetchCryptoPrices() {
  cryptoList.innerHTML = '<div class="crypto-loading">Loading prices...</div>';
  
  try {
    const ids = cryptoCoins.map(c => c.id).join(',');
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
    
    if (!res.ok) {
      throw new Error('API request failed');
    }
    
    const data = await res.json();
    renderCryptoPrices(data);
  } catch (e) {
    console.error('Crypto fetch error:', e);
    cryptoList.innerHTML = '<div class="crypto-error">Unable to load prices</div>';
  }
}

function renderCryptoPrices(data) {
  cryptoList.innerHTML = '';
  
  cryptoCoins.forEach(coin => {
    const priceData = data[coin.id];
    if (!priceData) return;
    
    const price = priceData.usd;
    const change = priceData.usd_24h_change;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    
    const div = document.createElement('div');
    div.className = 'crypto-item';
    div.innerHTML = `
      <div class="crypto-info">
        <span class="crypto-icon">${coin.icon}</span>
        <div>
          <div class="crypto-name">${coin.name}</div>
          <div class="crypto-symbol">${coin.symbol}</div>
        </div>
      </div>
      <div class="crypto-price">
        <div class="crypto-value">${formatPrice(price)}</div>
        <div class="crypto-change ${changeClass}">${formatChange(change)}</div>
      </div>
    `;
    cryptoList.appendChild(div);
  });
}

cryptoRefreshBtn.addEventListener('click', fetchCryptoPrices);

// Initial fetch
fetchCryptoPrices();

// Refresh every 60 seconds
setInterval(fetchCryptoPrices, 60000);

// Stock Market Widget
const stocksList = document.getElementById('stocks-list');
const stocksRefreshBtn = document.getElementById('stocks-refresh');

// Popular stocks to track
const stockSymbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM'];

function formatStockPrice(price) {
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatStockChange(change) {
  const sign = change >= 0 ? '+' : '';
  return sign + change.toFixed(2) + '%';
}

async function fetchStockPrices() {
  stocksList.innerHTML = '<div class="stocks-loading">Loading stocks...</div>';
  
  try {
    // Using Yahoo Finance API via a proxy (query1.finance.yahoo.com)
    const symbols = stockSymbols.join(',');
    const res = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`);
    
    if (!res.ok) {
      throw new Error('API request failed');
    }
    
    const data = await res.json();
    if (data.quoteResponse && data.quoteResponse.result) {
      renderStockPrices(data.quoteResponse.result);
    } else {
      throw new Error('No data returned');
    }
  } catch (e) {
    console.error('Stock fetch error:', e);
    stocksList.innerHTML = '<div class="stocks-error">Unable to load stocks</div>';
  }
}

function renderStockPrices(stocks) {
  stocksList.innerHTML = '';
  
  stocks.forEach(stock => {
    const price = stock.regularMarketPrice || 0;
    const change = stock.regularMarketChangePercent || 0;
    const changeClass = change >= 0 ? 'positive' : 'negative';
    const name = stock.shortName || stock.longName || stock.symbol;
    
    const div = document.createElement('div');
    div.className = 'stock-item';
    div.innerHTML = `
      <div class="stock-info">
        <span class="stock-symbol">${stock.symbol}</span>
        <span class="stock-name">${name.length > 20 ? name.substring(0, 20) + '...' : name}</span>
      </div>
      <div class="stock-price">
        <div class="stock-value">${formatStockPrice(price)}</div>
        <div class="stock-change ${changeClass}">${formatStockChange(change)}</div>
      </div>
    `;
    stocksList.appendChild(div);
  });
}

stocksRefreshBtn.addEventListener('click', fetchStockPrices);

// Initial fetch
fetchStockPrices();

// Refresh every 60 seconds
setInterval(fetchStockPrices, 60000);

// Currency Converter Widget
const currencyAmount = document.getElementById('currency-amount');
const currencyFrom = document.getElementById('currency-from');
const currencyTo = document.getElementById('currency-to');
const currencyConvertBtn = document.getElementById('currency-convert');
const currencyResult = document.getElementById('currency-result');

let exchangeRates = {};

// Fetch exchange rates from ExchangeRate-API (free tier)
async function fetchExchangeRates() {
  try {
    const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    const data = await res.json();
    exchangeRates = data.rates;
    
    // Store BTC rate separately since it's against USD
    if (exchangeRates.BTC) {
      // Already have BTC rate
    }
    
    // Convert initial value
    convertCurrency();
  } catch (e) {
    console.error('Exchange rate fetch error:', e);
    currencyResult.textContent = 'Error loading rates';
  }
}

function convertCurrency() {
  const amount = parseFloat(currencyAmount.value) || 0;
  const from = currencyFrom.value;
  const to = currencyTo.value;
  
  if (Object.keys(exchangeRates).length === 0) {
    currencyResult.textContent = 'Loading rates...';
    return;
  }
  
  // Convert via USD (base currency)
  let result;
  if (from === 'USD') {
    result = amount * (exchangeRates[to] || 1);
  } else if (to === 'USD') {
    result = amount / (exchangeRates[from] || 1);
  } else {
    // Convert from -> USD -> to
    const inUSD = amount / (exchangeRates[from] || 1);
    result = inUSD * (exchangeRates[to] || 1);
  }
  
  // Format based on currency
  let formatted;
  if (to === 'BTC') {
    formatted = result.toFixed(8) + ' BTC';
  } else if (result >= 1000) {
    formatted = result.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + to;
  } else if (result >= 1) {
    formatted = result.toFixed(2) + ' ' + to;
  } else {
    formatted = result.toFixed(4) + ' ' + to;
  }
  
  currencyResult.textContent = formatted;
}

// Event listeners
currencyConvertBtn.addEventListener('click', convertCurrency);
currencyAmount.addEventListener('input', convertCurrency);
currencyFrom.addEventListener('change', convertCurrency);
currencyTo.addEventListener('change', convertCurrency);

// Load saved currency preferences
const savedFrom = localStorage.getItem('dashboard-currency-from');
const savedTo = localStorage.getItem('dashboard-currency-to');
if (savedFrom) currencyFrom.value = savedFrom;
if (savedTo) currencyTo.value = savedTo;

// Save preferences on change
currencyFrom.addEventListener('change', () => {
  localStorage.setItem('dashboard-currency-from', currencyFrom.value);
});
currencyTo.addEventListener('change', () => {
  localStorage.setItem('dashboard-currency-to', currencyTo.value);
});

// Initial fetch
fetchExchangeRates();

// BMI Calculator Widget
const bmiHeight = document.getElementById('bmi-height');
const bmiWeight = document.getElementById('bmi-weight');
const bmiCalculateBtn = document.getElementById('bmi-calculate');
const bmiValue = document.getElementById('bmi-value');
const bmiCategory = document.getElementById('bmi-category');

function calculateBMI() {
  const height = parseFloat(bmiHeight.value);
  const weight = parseFloat(bmiWeight.value);
  
  if (!height || !weight || height <= 0 || weight <= 0) {
    bmiValue.textContent = '--';
    bmiCategory.textContent = 'Enter valid height and weight';
    bmiCategory.className = 'bmi-category';
    return;
  }
  
  // BMI = weight (kg) / height (m)^2
  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);
  const bmiRounded = bmi.toFixed(1);
  
  bmiValue.textContent = bmiRounded;
  
  // Determine category
  let category, categoryClass;
  if (bmi < 18.5) {
    category = 'Underweight';
    categoryClass = 'underweight';
  } else if (bmi < 25) {
    category = 'Normal weight';
    categoryClass = 'normal';
  } else if (bmi < 30) {
    category = 'Overweight';
    categoryClass = 'overweight';
  } else {
    category = 'Obese';
    categoryClass = 'obese';
  }
  
  bmiCategory.textContent = category;
  bmiCategory.className = 'bmi-category ' + categoryClass;
  
  // Save to localStorage
  localStorage.setItem('dashboard-bmi-height', height);
  localStorage.setItem('dashboard-bmi-weight', weight);
}

bmiCalculateBtn.addEventListener('click', calculateBMI);

// Also calculate on Enter key
bmiWeight.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') calculateBMI();
});

// Load saved values
const savedHeight = localStorage.getItem('dashboard-bmi-height');
const savedWeight = localStorage.getItem('dashboard-bmi-weight');
if (savedHeight) bmiHeight.value = savedHeight;
if (savedWeight) bmiWeight.value = savedWeight;

// Auto-calculate if we have saved values
if (savedHeight && savedWeight) {
  calculateBMI();
}

// Pomodoro Timer Widget
const pomodoroDisplay = document.getElementById('pomodoro-display');
const pomodoroStartBtn = document.getElementById('pomodoro-start');
const pomodoroResetBtn = document.getElementById('pomodoro-reset');
const pomodoroSessionsEl = document.getElementById('pomodoro-sessions');
const pomodoroModes = document.querySelectorAll('.pomodoro-mode');

let pomodoroTime = 25 * 60; // 25 minutes in seconds
let pomodoroRemaining = pomodoroTime;
let pomodoroInterval = null;
let pomodoroIsRunning = false;
let pomodoroCurrentMode = 'work';
let pomodoroSessions = parseInt(localStorage.getItem('pomodoro-sessions') || '0');

pomodoroSessionsEl.textContent = pomodoroSessions;

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updatePomodoroDisplay() {
  pomodoroDisplay.textContent = formatTime(pomodoroRemaining);
  
  // Change color based on mode
  if (pomodoroCurrentMode === 'work') {
    pomodoroDisplay.style.color = '#4fc3f7';
  } else {
    pomodoroDisplay.style.color = '#4caf50';
  }
}

function startPomodoro() {
  if (pomodoroIsRunning) {
    // Pause
    clearInterval(pomodoroInterval);
    pomodoroIsRunning = false;
    pomodoroStartBtn.textContent = 'Start';
  } else {
    // Start
    pomodoroIsRunning = true;
    pomodoroStartBtn.textContent = 'Pause';
    
    pomodoroInterval = setInterval(() => {
      pomodoroRemaining--;
      updatePomodoroDisplay();
      
      if (pomodoroRemaining <= 0) {
        clearInterval(pomodoroInterval);
        pomodoroIsRunning = false;
        pomodoroStartBtn.textContent = 'Start';
        
        // Play notification sound (simple beep via AudioContext)
        try {
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          oscillator.frequency.value = 800;
          gainNode.gain.value = 0.1;
          oscillator.start();
          oscillator.stop(audioCtx.currentTime + 0.3);
        } catch (e) {}
        
        // If work session completed, increment session count
        if (pomodoroCurrentMode === 'work') {
          pomodoroSessions++;
          pomodoroSessionsEl.textContent = pomodoroSessions;
          localStorage.setItem('pomodoro-sessions', pomodoroSessions);
        }
        
        // Auto-switch to next mode
        if (pomodoroCurrentMode === 'work') {
          // Switch to short break
          setTimeout(() => {
            document.querySelector('[data-type="short"]').click();
            pomodoroRemaining = 5 * 60;
            updatePomodoroDisplay();
          }, 1000);
        } else {
          // Switch back to work
          setTimeout(() => {
            document.querySelector('[data-type="work"]').click();
            pomodoroRemaining = 25 * 60;
            updatePomodoroDisplay();
          }, 1000);
        }
      }
    }, 1000);
  }
}

function resetPomodoro() {
  clearInterval(pomodoroInterval);
  pomodoroIsRunning = false;
  pomodoroStartBtn.textContent = 'Start';
  pomodoroRemaining = pomodoroTime;
  updatePomodoroDisplay();
}

pomodoroStartBtn.addEventListener('click', startPomodoro);
pomodoroResetBtn.addEventListener('click', resetPomodoro);

// Mode switching
pomodoroModes.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active state
    pomodoroModes.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Set new time
    pomodoroCurrentMode = btn.dataset.type;
    pomodoroTime = parseInt(btn.dataset.time) * 60;
    pomodoroRemaining = pomodoroTime;
    
    // Stop current timer
    clearInterval(pomodoroInterval);
    pomodoroIsRunning = false;
    pomodoroStartBtn.textContent = 'Start';
    
    updatePomodoroDisplay();
  });
});

// Countdown Timer Widget
const countdownEventInput = document.getElementById('countdown-event');
const countdownDateInput = document.getElementById('countdown-date');
const countdownSetBtn = document.getElementById('countdown-set');
const countdownDisplay = document.getElementById('countdown-display');

let countdownInterval = null;
let countdownTarget = null;
let countdownEventName = '';

// Load saved countdown
const savedEvent = localStorage.getItem('countdown-event');
const savedDate = localStorage.getItem('countdown-date');
if (savedEvent && savedDate) {
  countdownEventInput.value = savedEvent;
  countdownDateInput.value = savedDate;
  if (new Date(savedDate) > new Date()) {
    startCountdown(savedEvent, new Date(savedDate));
  }
}

countdownSetBtn.addEventListener('click', () => {
  const eventName = countdownEventInput.value.trim() || 'Event';
  const targetDate = new Date(countdownDateInput.value);
  
  if (isNaN(targetDate.getTime())) {
    countdownDisplay.innerHTML = '<div class="countdown-result">Please select a valid date</div>';
    return;
  }
  
  if (targetDate <= new Date()) {
    countdownDisplay.innerHTML = '<div class="countdown-result countdown-expired">This date has already passed!</div>';
    return;
  }
  
  // Save to localStorage
  localStorage.setItem('countdown-event', countdownEventInput.value);
  localStorage.setItem('countdown-date', countdownDateInput.value);
  
  startCountdown(eventName, targetDate);
});

function startCountdown(eventName, targetDate) {
  countdownEventName = eventName;
  countdownTarget = targetDate;
  
  if (countdownInterval) clearInterval(countdownInterval);
  
  updateCountdown();
  countdownInterval = setInterval(updateCountdown, 1000);
}

function updateCountdown() {
  const now = new Date();
  const diff = countdownTarget - now;
  
  if (diff <= 0) {
    clearInterval(countdownInterval);
    countdownDisplay.innerHTML = `
      <div class="countdown-event-name">${countdownEventName}</div>
      <div class="countdown-result countdown-expired">🎉 The event has arrived!</div>
    `;
    return;
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  countdownDisplay.innerHTML = `
    <div class="countdown-event-name">${countdownEventName}</div>
    <div class="countdown-time">
      <div class="countdown-unit">
        <span class="countdown-value">${days}</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${hours.toString().padStart(2, '0')}</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${minutes.toString().padStart(2, '0')}</span>
        <span class="countdown-label">Mins</span>
      </div>
      <div class="countdown-unit">
        <span class="countdown-value">${seconds.toString().padStart(2, '0')}</span>
        <span class="countdown-label">Secs</span>
      </div>
    </div>
  `;
}

// Daily Quote Widget
const quoteText = document.querySelector('.quote-text');
const quoteAuthor = document.querySelector('.quote-author');
const quoteRefreshBtn = document.getElementById('quote-refresh');

// Fallback quotes in case API fails
const fallbackQuotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" }
];

async function fetchQuote() {
  quoteText.textContent = 'Loading...';
  quoteAuthor.textContent = '--';
  
  try {
    // Using quotable.io API (free, no key required)
    const res = await fetch('https://api.quotable.io/random?tags=motivational|inspirational');
    
    if (!res.ok) {
      throw new Error('API failed');
    }
    
    const data = await res.json();
    quoteText.textContent = data.content;
    quoteAuthor.textContent = data.author;
  } catch (e) {
    console.error('Quote fetch error:', e);
    // Use fallback
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    quoteText.textContent = randomQuote.text;
    quoteAuthor.textContent = randomQuote.author;
  }
}

quoteRefreshBtn.addEventListener('click', fetchQuote);

// Initial fetch
fetchQuote();

// Habit Tracker Widget
const habitInput = document.getElementById('habit-input');
const habitAddBtn = document.getElementById('habit-add');
const habitList = document.getElementById('habit-list');
const habitCompletedEl = document.getElementById('habit-completed');

// Get today's date string for daily reset
function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

let habits = JSON.parse(localStorage.getItem('dashboard-habits') || '[]');
let completedToday = JSON.parse(localStorage.getItem('dashboard-habits-completed-' + getTodayKey()) || []);

function saveHabits() {
  localStorage.setItem('dashboard-habits', JSON.stringify(habits));
}

function saveCompleted() {
  localStorage.setItem('dashboard-habits-completed-' + getTodayKey(), JSON.stringify(completedToday));
  updateStats();
}

function updateStats() {
  const total = habits.length;
  const done = completedToday.length;
  habitCompletedEl.textContent = `${done}/${total} completed today`;
}

function renderHabits() {
  habitList.innerHTML = '';
  
  habits.forEach((habit, index) => {
    const li = document.createElement('li');
    const isCompleted = completedToday.includes(habit.id);
    
    if (isCompleted) {
      li.classList.add('completed');
    }
    
    li.innerHTML = `
      <input type="checkbox" ${isCompleted ? 'checked' : ''} data-id="${habit.id}">
      <span class="habit-name">${habit.name}</span>
      <button class="habit-delete" data-id="${habit.id}">✕</button>
    `;
    
    // Checkbox handler
    li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => {
      if (e.target.checked) {
        if (!completedToday.includes(habit.id)) {
          completedToday.push(habit.id);
        }
      } else {
        completedToday = completedToday.filter(id => id !== habit.id);
      }
      saveCompleted();
      renderHabits();
    });
    
    // Delete handler
    li.querySelector('.habit-delete').addEventListener('click', () => {
      habits = habits.filter(h => h.id !== habit.id);
      completedToday = completedToday.filter(id => id !== habit.id);
      saveHabits();
      saveCompleted();
      renderHabits();
    });
    
    habitList.appendChild(li);
  });
  
  updateStats();
}

function addHabit() {
  const name = habitInput.value.trim();
  if (name) {
    const habit = {
      id: Date.now().toString(),
      name: name
    };
    habits.push(habit);
    saveHabits();
    habitInput.value = '';
    renderHabits();
  }
}

habitAddBtn.addEventListener('click', addHabit);
habitInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addHabit();
});

// Initial render
renderHabits();

// Book Reading Tracker Widget
const bookTitleInput = document.getElementById('book-title');
const bookPagesInput = document.getElementById('book-pages');
const bookAddBtn = document.getElementById('book-add');
const bookList = document.getElementById('book-list');

let books = JSON.parse(localStorage.getItem('dashboard-books') || '[]');

function saveBooks() {
  localStorage.setItem('dashboard-books', JSON.stringify(books));
}

function renderBooks() {
  bookList.innerHTML = '';
  
  if (books.length === 0) {
    bookList.innerHTML = '<li style="opacity: 0.5; text-align: center; padding: 20px;">No books yet</li>';
    return;
  }
  
  books.forEach((book, index) => {
    const li = document.createElement('li');
    li.className = 'book-item';
    
    const progress = book.currentPage || 0;
    const total = book.totalPages || 1;
    const percent = Math.min(100, Math.round((progress / total) * 100));
    const isComplete = progress >= total;
    
    li.innerHTML = `
      <div class="book-item-header">
        <span class="book-title">${book.title}${isComplete ? ' ✅' : ''}</span>
        <button class="book-delete" data-index="${index}">✕</button>
      </div>
      <div class="book-progress">
        <div class="book-progress-bar">
          <div class="book-progress-fill" style="width: ${percent}%"></div>
        </div>
        <span class="book-pages">${progress}/${total}</span>
      </div>
      <div class="book-update">
        <input type="number" placeholder="Update page..." value="${progress}" data-index="${index}">
        <button class="book-update-btn" data-index="${index}">Update</button>
      </div>
    `;
    
    // Delete handler
    li.querySelector('.book-delete').addEventListener('click', () => {
      books.splice(index, 1);
      saveBooks();
      renderBooks();
    });
    
    // Update handler
    li.querySelector('.book-update-btn').addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      const input = li.querySelector('.book-update input');
      const newPage = parseInt(input.value) || 0;
      books[idx].currentPage = Math.min(newPage, books[idx].totalPages);
      saveBooks();
      renderBooks();
    });
    
    bookList.appendChild(li);
  });
}

function addBook() {
  const title = bookTitleInput.value.trim();
  const pages = parseInt(bookPagesInput.value);
  
  if (title && pages > 0) {
    books.push({
      title: title,
      totalPages: pages,
      currentPage: 0
    });
    saveBooks();
    bookTitleInput.value = '';
    bookPagesInput.value = '';
    renderBooks();
  }
}

bookAddBtn.addEventListener('click', addBook);
bookPagesInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBook();
});

// Initial render
renderBooks();

// Water Intake Tracker Widget
const waterCountEl = document.getElementById('water-count');
const waterProgressFill = document.getElementById('water-progress-fill');
const waterAddBtn = document.getElementById('water-add');
const waterRemoveBtn = document.getElementById('water-remove');
const waterResetBtn = document.getElementById('water-reset');

const DAILY_GOAL = 8;

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

let waterCount = parseInt(localStorage.getItem('dashboard-water-' + getTodayKey()) || '0');

function updateWaterDisplay() {
  waterCountEl.textContent = waterCount;
  const percent = Math.min(100, (waterCount / DAILY_GOAL) * 100);
  waterProgressFill.style.width = percent + '%';
  
  // Change color when goal reached
  if (waterCount >= DAILY_GOAL) {
    waterProgressFill.style.background = 'linear-gradient(90deg, #4caf50, #8bc34a)';
    waterCountEl.style.color = '#4caf50';
  } else {
    waterProgressFill.style.background = 'linear-gradient(90deg, #4fc3f7, #29b6f6)';
    waterCountEl.style.color = '#4fc3f7';
  }
}

function saveWater() {
  localStorage.setItem('dashboard-water-' + getTodayKey(), waterCount);
}

waterAddBtn.addEventListener('click', () => {
  waterCount++;
  saveWater();
  updateWaterDisplay();
});

waterRemoveBtn.addEventListener('click', () => {
  if (waterCount > 0) {
    waterCount--;
    saveWater();
    updateWaterDisplay();
  }
});

waterResetBtn.addEventListener('click', () => {
  waterCount = 0;
  saveWater();
  updateWaterDisplay();
});

// Initial display
updateWaterDisplay();

// Sleep Tracker Widget
const sleepBedtime = document.getElementById('sleep-bedtime');
const sleepWaketime = document.getElementById('sleep-waketime');
const sleepLogBtn = document.getElementById('sleep-log');
const sleepAverageEl = document.getElementById('sleep-average');
const sleepHistoryEl = document.getElementById('sleep-history');

let sleepData = JSON.parse(localStorage.getItem('dashboard-sleep') || '[]');

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function calculateHours(bedtime, waketime) {
  const [bedH, bedM] = bedtime.split(':').map(Number);
  const [wakeH, wakeM] = waketime.split(':').map(Number);
  
  let bedMinutes = bedH * 60 + bedM;
  let wakeMinutes = wakeH * 60 + wakeM;
  
  // If wake time is before bed time, add 24 hours
  if (wakeMinutes <= bedMinutes) {
    wakeMinutes += 24 * 60;
  }
  
  const diffMinutes = wakeMinutes - bedMinutes;
  const hours = diffMinutes / 60;
  return hours;
}

function formatHours(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function saveSleep() {
  localStorage.setItem('dashboard-sleep', JSON.stringify(sleepData));
}

function updateAverage() {
  if (sleepData.length === 0) {
    sleepAverageEl.textContent = '--';
    return;
  }
  
  // Get last 7 days of data
  const recent = sleepData.slice(-7);
  const totalHours = recent.reduce((sum, entry) => sum + entry.hours, 0);
  const avg = totalHours / recent.length;
  sleepAverageEl.textContent = formatHours(avg);
}

function renderHistory() {
  sleepHistoryEl.innerHTML = '';
  
  if (sleepData.length === 0) {
    sleepHistoryEl.innerHTML = '<li style="opacity: 0.5; text-align: center;">No sleep logged yet</li>';
    return;
  }
  
  // Show last 5 entries (most recent first)
  const recent = sleepData.slice(-5).reverse();
  
  recent.forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="sleep-date">${formatDate(entry.date)}</span>
      <span class="sleep-duration">${formatHours(entry.hours)}</span>
    `;
    sleepHistoryEl.appendChild(li);
  });
}

sleepLogBtn.addEventListener('click', () => {
  const bedtime = sleepBedtime.value;
  const waketime = sleepWaketime.value;
  
  if (!bedtime || !waketime) return;
  
  const hours = calculateHours(bedtime, waketime);
  const today = getTodayKey();
  
  // Remove existing entry for today if exists
  sleepData = sleepData.filter(entry => entry.date !== today);
  
  // Add new entry
  sleepData.push({
    date: today,
    bedtime: bedtime,
    waketime: waketime,
    hours: hours
  });
  
  saveSleep();
  updateAverage();
  renderHistory();
});

// Initial load
updateAverage();
renderHistory();

// Mood Tracker Widget
const moodBtns = document.querySelectorAll('.mood-btn');
const moodNoteInput = document.getElementById('mood-note');
const moodTodayEl = document.getElementById('mood-today');
const moodHistoryEl = document.getElementById('mood-history');

let selectedMood = null;
let moodData = JSON.parse(localStorage.getItem('dashboard-mood') || '[]');

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function saveMood() {
  localStorage.setItem('dashboard-mood', JSON.stringify(moodData));
}

function updateTodayMood() {
  const today = getTodayKey();
  const todayEntry = moodData.find(entry => entry.date === today);
  
  if (todayEntry) {
    moodTodayEl.textContent = todayEntry.mood + ' ' + (todayEntry.note || '');
  } else {
    moodTodayEl.textContent = 'Not logged';
  }
}

function renderHistory() {
  moodHistoryEl.innerHTML = '';
  
  if (moodData.length === 0) {
    moodHistoryEl.innerHTML = '<li style="opacity: 0.5; text-align: center;">No moods logged yet</li>';
    return;
  }
  
  // Show last 7 entries (most recent first)
  const recent = moodData.slice(-7).reverse();
  
  recent.forEach(entry => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="mood-icon">${entry.mood}</span>
      <div class="mood-entry">
        <span class="mood-date">${formatDate(entry.date)}</span>
        <span class="mood-text">${entry.note || 'No note'}</span>
      </div>
    `;
    moodHistoryEl.appendChild(li);
  });
}

// Mood button click handlers
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove selected from all
    moodBtns.forEach(b => b.classList.remove('selected'));
    // Add to clicked
    btn.classList.add('selected');
    selectedMood = btn.dataset.mood;
    
    // Save mood immediately when selected
    const today = getTodayKey();
    const note = moodNoteInput.value.trim();
    
    // Remove existing entry for today
    moodData = moodData.filter(entry => entry.date !== today);
    
    // Add new entry
    moodData.push({
      date: today,
      mood: selectedMood,
      note: note
    });
    
    saveMood();
    updateTodayMood();
    renderHistory();
  });
});

// Initial load
updateTodayMood();
renderHistory();

// Expense Tracker Widget
const expenseDesc = document.getElementById('expense-desc');
const expenseAmount = document.getElementById('expense-amount');
const expenseCategory = document.getElementById('expense-category');
const expenseAddBtn = document.getElementById('expense-add');
const expenseTodayEl = document.getElementById('expense-today');
const expenseMonthEl = document.getElementById('expense-month');
const expenseListEl = document.getElementById('expense-list');

let expenses = JSON.parse(localStorage.getItem('dashboard-expenses') || '[]');

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

function formatCurrency(amount) {
  return '$' + amount.toFixed(2);
}

function saveExpenses() {
  localStorage.setItem('dashboard-expenses', JSON.stringify(expenses));
}

function updateSummary() {
  const today = getTodayKey();
  const month = getMonthKey();
  
  const todayTotal = expenses
    .filter(e => e.date === today)
    .reduce((sum, e) => sum + e.amount, 0);
  
  const monthTotal = expenses
    .filter(e => e.date.startsWith(month))
    .reduce((sum, e) => sum + e.amount, 0);
  
  expenseTodayEl.textContent = formatCurrency(todayTotal);
  expenseMonthEl.textContent = formatCurrency(monthTotal);
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function renderExpenses() {
  expenseListEl.innerHTML = '';
  
  if (expenses.length === 0) {
    expenseListEl.innerHTML = '<li style="opacity: 0.5; text-align: center;">No expenses yet</li>';
    return;
  }
  
  // Show last 10 expenses (most recent first)
  const recent = expenses.slice(-10).reverse();
  
  recent.forEach((expense, index) => {
    const originalIndex = expenses.indexOf(expense);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="expense-info">
        <span class="expense-desc">${expense.desc}</span>
        <span class="expense-category">${expense.category} · ${formatDate(expense.date)}</span>
      </div>
      <span class="expense-amount">-${formatCurrency(expense.amount)}</span>
      <button class="expense-delete" data-index="${originalIndex}">✕</button>
    `;
    
    li.querySelector('.expense-delete').addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      expenses.splice(idx, 1);
      saveExpenses();
      updateSummary();
      renderExpenses();
    });
    
    expenseListEl.appendChild(li);
  });
}

function addExpense() {
  const desc = expenseDesc.value.trim();
  const amount = parseFloat(expenseAmount.value);
  const category = expenseCategory.value;
  
  if (!desc || !amount || amount <= 0) return;
  
  expenses.push({
    date: getTodayKey(),
    desc: desc,
    amount: amount,
    category: category
  });
  
  saveExpenses();
  expenseDesc.value = '';
  expenseAmount.value = '';
  updateSummary();
  renderExpenses();
}

expenseAddBtn.addEventListener('click', addExpense);
expenseAmount.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addExpense();
});

// Initial load
updateSummary();
renderExpenses();

// Birthday Reminders Widget
const birthdayName = document.getElementById('birthday-name');
const birthdayDate = document.getElementById('birthday-date');
const birthdayAddBtn = document.getElementById('birthday-add');
const birthdayListEl = document.getElementById('birthday-list');

let birthdays = JSON.parse(localStorage.getItem('dashboard-birthdays') || '[]');

function saveBirthdays() {
  localStorage.setItem('dashboard-birthdays', JSON.stringify(birthdays));
}

function getDaysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const [year, month, day] = dateStr.split('-').map(Number);
  const birthday = new Date(today.getFullYear(), month - 1, day);
  
  // If birthday has passed this year, check next year
  if (birthday < today) {
    birthday.setFullYear(today.getFullYear() + 1);
  }
  
  const diffTime = birthday - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function renderBirthdays() {
  birthdayListEl.innerHTML = '';
  
  if (birthdays.length === 0) {
    birthdayListEl.innerHTML = '<li style="opacity: 0.5; text-align: center;">No birthdays added</li>';
    return;
  }
  
  // Sort by days until birthday
  const sorted = birthdays.map(b => ({...b, days: getDaysUntil(b.date)}))
    .sort((a, b) => a.days - b.days);
  
  sorted.forEach((b, index) => {
    const originalIndex = birthdays.findIndex(x => x.name === b.name && x.date === b.date);
    const li = document.createElement('li');
    
    let daysText, daysClass;
    if (b.days === 0) {
      daysText = '🎂 Today!';
      daysClass = 'today';
    } else if (b.days <= 7) {
      daysText = `In ${b.days} days`;
      daysClass = 'soon';
    } else {
      daysText = `In ${b.days} days`;
      daysClass = '';
    }
    
    li.innerHTML = `
      <div class="birthday-info">
        <span class="birthday-name">${b.name}</span>
        <span class="birthday-date">${formatDate(b.date)}</span>
      </div>
      <span class="birthday-days ${daysClass}">${daysText}</span>
      <button class="birthday-delete" data-index="${originalIndex}">✕</button>
    `;
    
    li.querySelector('.birthday-delete').addEventListener('click', (e) => {
      const idx = parseInt(e.target.dataset.index);
      birthdays.splice(idx, 1);
      saveBirthdays();
      renderBirthdays();
    });
    
    birthdayListEl.appendChild(li);
  });
}

function addBirthday() {
  const name = birthdayName.value.trim();
  const date = birthdayDate.value;
  
  if (!name || !date) return;
  
  birthdays.push({ name, date });
  saveBirthdays();
  birthdayName.value = '';
  birthdayDate.value = '';
  renderBirthdays();
}

birthdayAddBtn.addEventListener('click', addBirthday);
birthdayDate.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addBirthday();
});

// Initial load
renderBirthdays();

// Holiday Countdown Widget
const holidayListEl = document.getElementById('holiday-list');

// Default holidays for the year
const defaultHolidays = [
  { name: "New Year's Day", month: 0, day: 1 },
  { name: "Valentine's Day", month: 1, day: 14 },
  { name: "Easter", month: 3, day: 20, variable: true }, // Approximate
  { name: "Memorial Day", month: 4, day: 26, variable: true },
  { name: "Independence Day", month: 6, day: 4 },
  { name: "Labor Day", month: 8, day: 1, variable: true },
  { name: "Halloween", month: 9, day: 31 },
  { name: "Thanksgiving", month: 10, day: 27, variable: true },
  { name: "Christmas", month: 11, day: 25 },
  { name: "New Year's Eve", month: 11, day: 31 }
];

function getHolidays() {
  let holidays = JSON.parse(localStorage.getItem('dashboard-holidays'));
  if (!holidays) {
    holidays = [...defaultHolidays];
    localStorage.setItem('dashboard-holidays', JSON.stringify(holidays));
  }
  return holidays;
}

function getDaysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const year = today.getFullYear();
  let holidayDate = new Date(year, date.month, date.day);
  
  // If holiday has passed this year, show next year
  if (holidayDate < today) {
    holidayDate.setFullYear(year + 1);
  }
  
  const diffTime = holidayDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function formatDate(month, day) {
  const date = new Date(2000, month, day);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

function renderHolidays() {
  const holidays = getHolidays();
  
  // Calculate days for each holiday
  const withDays = holidays.map(h => ({
    ...h,
    days: getDaysUntil(h)
  }));
  
  // Sort by days until
  const sorted = withDays.sort((a, b) => a.days - b.days);
  
  // Show top 6 upcoming holidays
  const upcoming = sorted.slice(0, 6);
  
  holidayListEl.innerHTML = '';
  
  upcoming.forEach(holiday => {
    const div = document.createElement('div');
    div.className = 'holiday-item';
    if (holiday.days === 0) {
      div.innerHTML = `
        <div class="holiday-info">
          <span class="holiday-name">🎉 ${holiday.name}</span>
          <span class="holiday-date">${formatDate(holiday.month, holiday.day)}</span>
        </div>
        <div class="holiday-countdown">
          <div class="holiday-days">Today!</div>
        </div>
      `;
    } else if (holiday.days < 0) {
      div.className += ' holiday-passed';
      div.innerHTML = `
        <div class="holiday-info">
          <span class="holiday-name">${holiday.name}</span>
          <span class="holiday-date">${formatDate(holiday.month, holiday.day)}</span>
        </div>
        <div class="holiday-countdown">
          <div class="holiday-days">Passed</div>
        </div>
      `;
    } else {
      div.innerHTML = `
        <div class="holiday-info">
          <span class="holiday-name">${holiday.name}</span>
          <span class="holiday-date">${formatDate(holiday.month, holiday.day)}</span>
        </div>
        <div class="holiday-countdown">
          <div class="holiday-days">${holiday.days}</div>
          <div class="holiday-label">days</div>
        </div>
      `;
    }
    holidayListEl.appendChild(div);
  });
}

// Initial render
renderHolidays();

// GitHub Contributions Widget
const githubUsername = document.getElementById('github-username');
const githubFetchBtn = document.getElementById('github-fetch');
const githubStatsEl = document.getElementById('github-stats');

// Load saved username
const savedUsername = localStorage.getItem('dashboard-github-username');
if (savedUsername) {
  githubUsername.value = savedUsername;
  fetchGitHub(savedUsername);
}

githubFetchBtn.addEventListener('click', () => {
  const username = githubUsername.value.trim();
  if (username) {
    localStorage.setItem('dashboard-github-username', username);
    fetchGitHub(username);
  }
});

githubUsername.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const username = githubUsername.value.trim();
    if (username) {
      localStorage.setItem('dashboard-github-username', username);
      fetchGitHub(username);
    }
  }
});

async function fetchGitHub(username) {
  githubStatsEl.innerHTML = '<div class="github-loading">Loading...</div>';
  
  try {
    // Fetch user profile
    const userRes = await fetch(`https://api.github.com/users/${username}`);
    if (!userRes.ok) throw new Error('User not found');
    const user = await userRes.json();
    
    // Fetch events (for recent activity)
    const eventsRes = await fetch(`https://api.github.com/users/${username}/events?per_page=10`);
    const events = eventsRes.ok ? await eventsRes.json() : [];
    
    // Count contributions from last 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentContributions = events.filter(e => {
      const eventDate = new Date(e.created_at);
      return eventDate >= sevenDaysAgo && (e.type === 'PushEvent' || e.type === 'PullRequestEvent' || e.type === 'IssuesEvent');
    }).length;
    
    // Calculate total contributions (approximate from public repos)
    const totalContribs = user.public_repos + user.followers;
    
    renderGitHubStats(user, recentContributions, totalContribs);
  } catch (e) {
    console.error('GitHub fetch error:', e);
    githubStatsEl.innerHTML = `<div class="github-error">Error: ${e.message}</div>`;
  }
}

function renderGitHubStats(user, recentContribs, totalContribs) {
  githubStatsEl.innerHTML = `
    <div class="github-profile">
      <img src="${user.avatar_url}" alt="${user.login}" class="github-avatar">
      <div>
        <div class="github-name">${user.name || user.login}</div>
        <div class="github-username">@${user.login}</div>
      </div>
    </div>
    <div class="github-contributions">
      <div class="github-stat">
        <div class="github-stat-value">${user.public_repos}</div>
        <div class="github-stat-label">Repositories</div>
      </div>
      <div class="github-stat">
        <div class="github-stat-value">${user.followers}</div>
        <div class="github-stat-label">Followers</div>
      </div>
      <div class="github-stat">
        <div class="github-stat-value">${recentContribs}</div>
        <div class="github-stat-label">This Week</div>
      </div>
      <div class="github-stat">
        <div class="github-stat-value">${user.following}</div>
        <div class="github-stat-label">Following</div>
      </div>
    </div>
  `;
}

// Steam Status Widget
const steamId = document.getElementById('steam-id');
const steamFetchBtn = document.getElementById('steam-fetch');
const steamStatusEl = document.getElementById('steam-status');

// Load saved Steam ID
const savedSteamId = localStorage.getItem('dashboard-steam-id');
if (savedSteamId) {
  steamId.value = savedSteamId;
  fetchSteam(savedSteamId);
}

steamFetchBtn.addEventListener('click', () => {
  const id = steamId.value.trim();
  if (id) {
    localStorage.setItem('dashboard-steam-id', id);
    fetchSteam(id);
  }
});

steamId.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const id = steamId.value.trim();
    if (id) {
      localStorage.setItem('dashboard-steam-id', id);
      fetchSteam(id);
    }
  }
});

async function fetchSteam(steamIdOrName) {
  steamStatusEl.innerHTML = '<div class="steam-loading">Loading...</div>';
  
  try {
    // First resolve the vanity URL or use the ID directly
    // Note: Steam Web API requires API key for most endpoints
    // Using steamPowered API as alternative
    const res = await fetch(`https://api.steampowered.com/ISteamUser/ResolveVanityURL/v0001/?key=STEAM_API_KEY&vanityurl=${steamIdOrName}`);
    
    // Since we don't have an API key, show instructions
    steamStatusEl.innerHTML = `
      <div class="steam-profile">
        <div style="text-align: center; width: 100%;">
          <div style="font-size: 3rem;">🎮</div>
          <div class="steam-name">${steamIdOrName}</div>
          <div class="steam-state offline">
            <span class="steam-dot offline"></span> API key required
          </div>
        </div>
      </div>
      <div class="steam-game">
        <div class="steam-game-label">Note</div>
        <div class="steam-game-name">Configure Steam API key in app.js for live data</div>
      </div>
    `;
  } catch (e) {
    console.error('Steam fetch error:', e);
    steamStatusEl.innerHTML = `<div class="steam-error">Error: ${e.message}</div>`;
  }
}

// Alternative: Simple manual status toggle for demo
const steamStatusManual = document.getElementById('steam-status');

function renderSteamStatus(status) {
  const states = {
    'online': { label: 'Online', class: 'online', icon: '🟢' },
    'away': { label: 'Away', class: 'away', icon: '🟡' },
    'offline': { label: 'Offline', class: 'offline', icon: '⚫' }
  };
  
  const current = states[status] || states.offline;
  
  steamStatusEl.innerHTML = `
    <div class="steam-profile">
      <div style="font-size: 3rem;">🎮</div>
      <div>
        <div class="steam-name">Steam User</div>
        <div class="steam-state ${current.class}">
          <span class="steam-dot ${current.class}"></span> ${current.label}
        </div>
      </div>
    </div>
    <div class="steam-game" style="text-align: center;">
      <div class="steam-game-label">Currently Playing</div>
      <div class="steam-game-name">Configure Steam API key in app.js</div>
    </div>
  `;
}

// Show offline by default (API key required for real data)
renderSteamStatus('offline');

// Plex/Emby Now Playing Widget
const plexUrl = document.getElementById('plex-url');
const plexApiKey = document.getElementById('plex-api-key');
const plexConnectBtn = document.getElementById('plex-connect');
const plexStatusEl = document.getElementById('plex-status');

// Load saved settings
const savedUrl = localStorage.getItem('dashboard-plex-url');
const savedKey = localStorage.getItem('dashboard-plex-api-key');
if (savedUrl) plexUrl.value = savedUrl;
if (savedKey) plexApiKey.value = savedKey;

if (savedUrl && savedKey) {
  fetchNowPlaying(savedUrl, savedKey);
}

plexConnectBtn.addEventListener('click', () => {
  const url = plexUrl.value.trim();
  const key = plexApiKey.value.trim();
  if (url && key) {
    localStorage.setItem('dashboard-plex-url', url);
    localStorage.setItem('dashboard-plex-api-key', key);
    fetchNowPlaying(url, key);
  }
});

async function fetchNowPlaying(serverUrl, apiKey) {
  plexStatusEl.innerHTML = '<div class="plex-loading">Connecting...</div>';
  
  try {
    // Try Plex API
    // Note: This requires proper Plex server configuration
    // Using placeholder for demonstration
    
    // Check if it's Plex or Emby
    const isPlex = serverUrl.includes('plex') || !serverUrl.includes('emby');
    
    if (isPlex) {
      // Plex would require an authenticated session
      plexStatusEl.innerHTML = `
        <div class="plex-idle">
          <div class="plex-idle-icon">📺</div>
          <div class="plex-idle-text">Configure Plex server URL and API key for live now playing</div>
        </div>
      `;
    } else {
      // Emby API endpoint
      const res = await fetch(`${serverUrl}/emby/Sessions?api_key=${apiKey}`);
      
      if (!res.ok) throw new Error('Connection failed');
      
      const sessions = await res.json();
      const playing = sessions.find(s => s.NowPlayingItem);
      
      if (playing && playing.NowPlayingItem) {
        const item = playing.NowPlayingItem;
        plexStatusEl.innerHTML = `
          <div class="plex-now-playing">
            <div class="plex-media-thumb">${item.Type === 'Episode' ? '📺' : '🎬'}</div>
            <div class="plex-media-title">${item.Name}</div>
            <div class="plex-media-meta">
              ${playing.UserName} • ${Math.floor((playing.PlayState || 0) / 1000 / 60)}m left
            </div>
          </div>
        `;
      } else {
        plexStatusEl.innerHTML = `
          <div class="plex-idle">
            <div class="plex-idle-icon">📺</div>
            <div class="plex-idle-text">No one is watching right now</div>
          </div>
        `;
      }
    }
  } catch (e) {
    console.error('Plex/Emby error:', e);
    // Show idle state on error (server might not be reachable locally)
    plexStatusEl.innerHTML = `
      <div class="plex-idle">
        <div class="plex-idle-icon">📺</div>
        <div class="plex-idle-text">Configure server to see now playing</div>
      </div>
    `;
  }
}

// Initial state
plexStatusEl.innerHTML = `
  <div class="plex-idle">
    <div class="plex-idle-icon">📺</div>
    <div class="plex-idle-text">Configure server URL and API key</div>
  </div>
`;

// Spotify Current Track Widget
const spotifyToken = document.getElementById('spotify-token');
const spotifyConnectBtn = document.getElementById('spotify-connect');
const spotifyStatusEl = document.getElementById('spotify-status');

// Load saved token
const savedToken = localStorage.getItem('dashboard-spotify-token');
if (savedToken) {
  spotifyToken.value = savedToken;
  fetchSpotify(savedToken);
}

spotifyConnectBtn.addEventListener('click', () => {
  const token = spotifyToken.value.trim();
  if (token) {
    localStorage.setItem('dashboard-spotify-token', token);
    fetchSpotify(token);
  }
});

spotifyToken.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const token = spotifyToken.value.trim();
    if (token) {
      localStorage.setItem('dashboard-spotify-token', token);
      fetchSpotify(token);
    }
  }
});

let spotifyInterval = null;

async function fetchSpotify(token) {
  spotifyStatusEl.innerHTML = '<div class="spotify-idle"><div class="spotify-idle-icon">⏳</div><div class="spotify-idle-text">Loading...</div></div>';
  
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    
    if (res.status === 204 || res.status === 401) {
      // No track playing or expired token
      showSpotifyIdle('No track playing or token expired');
      return;
    }
    
    if (!res.ok) throw new Error('API error');
    
    const data = await res.json();
    
    if (!data.item) {
      showSpotifyIdle('No track playing');
      return;
    }
    
    const track = data.item;
    const album = track.album;
    const artists = track.artists.map(a => a.name).join(', ');
    
    // Get best available image
    const image = album.images[0]?.url || '';
    
    spotifyStatusEl.innerHTML = `
      <div class="spotify-track">
        <img src="${image}" alt="${track.name}" class="spotify-art" onerror="this.style.display='none'">
        <div class="spotify-info">
          <div class="spotify-title">${track.name}</div>
          <div class="spotify-artist">${artists}</div>
          <div class="spotify-album">${album.name}</div>
          ${data.is_playing ? `
            <div class="spotify-playing">
              <div class="spotify-bar"></div>
              <div class="spotify-bar"></div>
              <div class="spotify-bar"></div>
              <span>Playing</span>
            </div>
          ` : '<div style="margin-top:8px;font-size:0.8rem;opacity:0.6">Paused</div>'}
        </div>
      </div>
    `;
    
    // Refresh every 30 seconds if playing
    if (spotifyInterval) clearInterval(spotifyInterval);
    if (data.is_playing) {
      spotifyInterval = setInterval(() => fetchSpotify(token), 30000);
    }
    
  } catch (e) {
    console.error('Spotify error:', e);
    showSpotifyIdle('Error: ' + e.message);
  }
}

function showSpotifyIdle(message) {
  spotifyStatusEl.innerHTML = `
    <div class="spotify-idle">
      <div class="spotify-idle-icon">🎵</div>
      <div class="spotify-idle-text">${message}</div>
    </div>
  `;
}

// YouTube Trending Widget
const youtubeRegion = document.getElementById('youtube-region');
const youtubeRefreshBtn = document.getElementById('youtube-refresh');
const youtubeListEl = document.getElementById('youtube-list');

// Save selected region
const savedRegion = localStorage.getItem('dashboard-youtube-region');
if (savedRegion) {
  youtubeRegion.value = savedRegion;
}

// Load trending on page load
fetchYouTubeTrending();

youtubeRegion.addEventListener('change', () => {
  localStorage.setItem('dashboard-youtube-region', youtubeRegion.value);
  fetchYouTubeTrending();
});

youtubeRefreshBtn.addEventListener('click', fetchYouTubeTrending);

async function fetchYouTubeTrending() {
  youtubeListEl.innerHTML = '<li class="youtube-loading">Loading trending videos...</li>';
  
  const region = youtubeRegion.value;
  
  try {
    // Try using noembed for YouTube link previews (fallback method)
    // Note: YouTube Data API v3 requires API key, so we use RSS alternative
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?region=${region}&category=Entertainment`);
    
    if (!res.ok) throw new Error('Failed to fetch');
    
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const entries = xml.querySelectorAll('entry');
    
    if (entries.length === 0) {
      // Use fallback demo data
      renderDemoTrending(region);
      return;
    }
    
    renderTrending(entries);
  } catch (e) {
    console.error('YouTube fetch error:', e);
    // Show demo data as fallback
    renderDemoTrending(region);
  }
}

function renderTrending(entries) {
  youtubeListEl.innerHTML = '';
  
  const maxItems = 8;
  for (let i = 0; i < Math.min(entries.length, maxItems); i++) {
    const entry = entries[i];
    const title = entry.querySelector('title')?.textContent || 'Untitled';
    const videoId = entry.querySelector('videoId')?.textContent || '';
    const channel = entry.querySelector('author > name')?.textContent || 'Unknown';
    const published = entry.querySelector('published')?.textContent || '';
    
    const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '';
    
    const li = document.createElement('li');
    li.className = 'youtube-item';
    li.innerHTML = `
      <img src="${thumbnail}" alt="${title}" class="youtube-thumb" onerror="this.style.display='none'">
      <div class="youtube-info">
        <div class="youtube-title">${title}</div>
        <div class="youtube-channel">${channel}</div>
      </div>
    `;
    
    // Make the item clickable
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      if (videoId) {
        window.open(`https://youtube.com/watch?v=${videoId}`, '_blank');
      }
    });
    
    youtubeListEl.appendChild(li);
  }
}

function renderDemoTrending(region) {
  // Demo data when API not available
  const demoVideos = [
    { title: 'Trending Video 1', channel: 'Channel One', views: '1.2M views' },
    { title: 'Popular Video 2', channel: 'Channel Two', views: '890K views' },
    { title: 'Hot Video 3', channel: 'Channel Three', views: '750K views' },
    { title: 'Viral Video 4', channel: 'Channel Four', views: '620K views' },
    { title: 'Top Video 5', channel: 'Channel Five', views: '540K views' },
    { title: 'Trending Video 6', channel: 'Channel Six', views: '430K views' }
  ];
  
  youtubeListEl.innerHTML = '';
  
  demoVideos.forEach(video => {
    const li = document.createElement('li');
    li.className = 'youtube-item';
    li.innerHTML = `
      <div class="youtube-thumb" style="display:flex;align-items:center;justify-content:center;font-size:2rem;">▶</div>
      <div class="youtube-info">
        <div class="youtube-title">${video.title}</div>
        <div class="youtube-channel">${video.channel}</div>
        <div class="youtube-views">${video.views}</div>
      </div>
    `;
    youtubeListEl.appendChild(li);
  });
}
