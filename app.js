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
