// State management
let state = {
    doses: [], // Array of {amount: number, timestamp: number}
    halfLife: 5.5, // hours
    timeWindow: 24, // hours
    currentTime: Date.now(),
    isSyncing: false,
    lastSync: null
};

// Constants
const STORAGE_KEY = 'caffeine-tracker-data';
const USER_ID_KEY = 'caffeine-tracker-user-id';
const SAFE_THRESHOLD = 25; // mg - when caffeine is mostly out of system
const API_URL = '/api/caffeine';

// Canvas setup
const canvas = document.getElementById('caffeine-chart');
const ctx = canvas.getContext('2d');

// Initialize
async function init() {
    await initializeUser();
    loadFromStorage();
    await loadFromCloud();
    setupEventListeners();
    setupCanvas();
    updateVisualization();
    updateSyncStatus();

    // Update current time every minute
    setInterval(() => {
        state.currentTime = Date.now();
        updateVisualization();
    }, 60000);

    // Auto-sync every 5 minutes
    setInterval(() => {
        saveToCloud();
    }, 5 * 60 * 1000);
}

// Get or create user ID
function getUserId() {
    let userId = localStorage.getItem(USER_ID_KEY);
    if (!userId) {
        userId = generateUserId();
        localStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
}

// Generate a unique user ID
function generateUserId() {
    return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Initialize user and display sync info
async function initializeUser() {
    const userId = getUserId();
    console.log('User ID:', userId);
}

// Load data from localStorage
function loadFromStorage() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const data = JSON.parse(saved);
            state.doses = data.doses || [];
            state.halfLife = data.halfLife || 5.5;
            state.timeWindow = data.timeWindow || 24;

            // Remove doses older than 48 hours
            const cutoff = Date.now() - (48 * 60 * 60 * 1000);
            state.doses = state.doses.filter(d => d.timestamp > cutoff);
        }
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

// Save data to localStorage
function saveToStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            doses: state.doses,
            halfLife: state.halfLife,
            timeWindow: state.timeWindow
        }));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Load data from cloud
async function loadFromCloud() {
    try {
        state.isSyncing = true;
        updateSyncStatus();

        const userId = getUserId();
        const response = await fetch(`${API_URL}?userId=${encodeURIComponent(userId)}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const cloudData = await response.json();

        if (cloudData.doses && cloudData.doses.length > 0) {
            // Merge cloud data with local data
            const mergedDoses = mergeDoses(state.doses, cloudData.doses);
            state.doses = mergedDoses;
            state.halfLife = cloudData.halfLife || state.halfLife;
            state.timeWindow = cloudData.timeWindow || state.timeWindow;
            state.lastSync = cloudData.lastSync;

            // Save merged data locally
            saveToStorage();
        }

        console.log('Synced from cloud:', cloudData);
    } catch (error) {
        console.error('Error loading from cloud:', error);
    } finally {
        state.isSyncing = false;
        updateSyncStatus();
    }
}

// Save data to cloud
async function saveToCloud() {
    try {
        state.isSyncing = true;
        updateSyncStatus();

        const userId = getUserId();

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId,
                doses: state.doses,
                halfLife: state.halfLife,
                timeWindow: state.timeWindow
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const result = await response.json();
        state.lastSync = result.lastSync;

        console.log('Synced to cloud:', result);
    } catch (error) {
        console.error('Error saving to cloud:', error);
    } finally {
        state.isSyncing = false;
        updateSyncStatus();
    }
}

// Merge doses from two sources (local and cloud)
function mergeDoses(localDoses, cloudDoses) {
    // Create a map of all doses by timestamp
    const doseMap = new Map();

    // Add local doses
    localDoses.forEach(dose => {
        const key = `${dose.timestamp}-${dose.amount}`;
        doseMap.set(key, dose);
    });

    // Add cloud doses (may overwrite or add new)
    cloudDoses.forEach(dose => {
        const key = `${dose.timestamp}-${dose.amount}`;
        doseMap.set(key, dose);
    });

    // Convert back to array and sort by timestamp
    const merged = Array.from(doseMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    // Remove doses older than 48 hours
    const cutoff = Date.now() - (48 * 60 * 60 * 1000);
    return merged.filter(d => d.timestamp > cutoff);
}

// Update sync status display
function updateSyncStatus() {
    const syncStatus = document.getElementById('sync-status');
    if (!syncStatus) return;

    if (state.isSyncing) {
        syncStatus.innerHTML = '<span class="syncing">⟳ Syncing...</span>';
    } else if (state.lastSync) {
        const syncTime = new Date(state.lastSync);
        const now = new Date();
        const diffMinutes = Math.floor((now - syncTime) / (1000 * 60));

        let timeAgo;
        if (diffMinutes < 1) {
            timeAgo = 'just now';
        } else if (diffMinutes < 60) {
            timeAgo = `${diffMinutes}m ago`;
        } else {
            const diffHours = Math.floor(diffMinutes / 60);
            timeAgo = `${diffHours}h ago`;
        }

        syncStatus.innerHTML = `<span class="synced">✓ Synced ${timeAgo}</span>`;
    } else {
        syncStatus.innerHTML = '<span class="not-synced">○ Not synced</span>';
    }
}

// Calculate caffeine amount at a given time for a single dose
function calculateCaffeineAtTime(initialAmount, doseTime, currentTime, halfLife) {
    const hoursElapsed = (currentTime - doseTime) / (1000 * 60 * 60);
    if (hoursElapsed < 0) return 0;
    return initialAmount * Math.pow(0.5, hoursElapsed / halfLife);
}

// Calculate total current caffeine from all doses
function getCurrentCaffeine() {
    return state.doses.reduce((total, dose) => {
        return total + calculateCaffeineAtTime(dose.amount, dose.timestamp, state.currentTime, state.halfLife);
    }, 0);
}

// Calculate total caffeine at a specific time from all doses
function getTotalCaffeineAtTime(time) {
    return state.doses.reduce((total, dose) => {
        return total + calculateCaffeineAtTime(dose.amount, dose.timestamp, time, state.halfLife);
    }, 0);
}

// Add a new caffeine dose
async function addDose(amount) {
    if (amount <= 0) return;

    state.doses.push({
        amount: amount,
        timestamp: state.currentTime
    });

    saveToStorage();
    await saveToCloud();
    updateVisualization();
}

// Clear all doses
async function clearHistory() {
    if (confirm('Are you sure you want to clear all caffeine intake history?')) {
        state.doses = [];
        saveToStorage();
        await saveToCloud();
        updateVisualization();
    }
}

// Setup canvas with proper sizing
function setupCanvas() {
    function resizeCanvas() {
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = container.clientWidth * dpr;
        canvas.height = container.clientHeight * dpr;

        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';

        ctx.scale(dpr, dpr);

        updateVisualization();
    }

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Draw the caffeine decay chart
function drawChart() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (state.doses.length === 0) {
        // Show empty state message
        ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--text-secondary').trim() || '#666';
        ctx.font = '16px Poppins, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Add some caffeine to see the decay curve', width / 2, height / 2);
        return;
    }

    // Calculate time range
    const now = state.currentTime;
    const startTime = now - (state.timeWindow * 60 * 60 * 1000);
    const endTime = now + (state.timeWindow * 0.25 * 60 * 60 * 1000); // Show 25% future

    // Find earliest dose for better visualization
    const earliestDose = Math.min(...state.doses.map(d => d.timestamp));
    const visualStartTime = Math.min(startTime, earliestDose - (60 * 60 * 1000));

    // Calculate max caffeine for scaling
    let maxCaffeine = 0;
    const samplePoints = 200;
    const timeStep = (endTime - visualStartTime) / samplePoints;

    for (let i = 0; i <= samplePoints; i++) {
        const time = visualStartTime + (i * timeStep);
        const caffeine = getTotalCaffeineAtTime(time);
        maxCaffeine = Math.max(maxCaffeine, caffeine);
    }

    maxCaffeine = Math.max(maxCaffeine, 100); // Minimum scale
    maxCaffeine = Math.ceil(maxCaffeine / 50) * 50; // Round to nearest 50

    // Chart dimensions
    const padding = { top: 30, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Get theme colors
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#374151' : '#e5e7eb';
    const textColor = isDark ? '#9ca3af' : '#6b7280';
    const lineColor = isDark ? '#3b82f6' : '#2563eb';
    const currentTimeColor = isDark ? '#ef4444' : '#dc2626';
    const doseMarkerColor = isDark ? '#10b981' : '#059669';

    // Draw grid lines and labels
    ctx.strokeStyle = gridColor;
    ctx.fillStyle = textColor;
    ctx.font = '12px Poppins, sans-serif';
    ctx.lineWidth = 1;

    // Horizontal grid lines (caffeine levels)
    const horizontalLines = 5;
    for (let i = 0; i <= horizontalLines; i++) {
        const y = padding.top + (chartHeight * i / horizontalLines);
        const caffeineValue = maxCaffeine * (1 - i / horizontalLines);

        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText(Math.round(caffeineValue) + ' mg', padding.left - 10, y + 4);
    }

    // Vertical grid lines (time)
    const verticalLines = 6;
    for (let i = 0; i <= verticalLines; i++) {
        const x = padding.left + (chartWidth * i / verticalLines);
        const time = visualStartTime + ((endTime - visualStartTime) * i / verticalLines);

        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();

        ctx.textAlign = 'center';
        const timeLabel = formatTimeLabel(time, now);
        ctx.fillText(timeLabel, x, height - padding.bottom + 20);
    }

    // Draw "now" line
    const nowX = padding.left + ((now - visualStartTime) / (endTime - visualStartTime)) * chartWidth;
    ctx.strokeStyle = currentTimeColor;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(nowX, padding.top);
    ctx.lineTo(nowX, padding.top + chartHeight);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw "now" label
    ctx.fillStyle = currentTimeColor;
    ctx.font = 'bold 12px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NOW', nowX, padding.top - 10);

    // Draw dose markers
    state.doses.forEach(dose => {
        const x = padding.left + ((dose.timestamp - visualStartTime) / (endTime - visualStartTime)) * chartWidth;

        if (x >= padding.left && x <= padding.left + chartWidth) {
            ctx.fillStyle = doseMarkerColor;
            ctx.beginPath();
            ctx.arc(x, padding.top + chartHeight + 10, 5, 0, Math.PI * 2);
            ctx.fill();

            // Draw dose amount
            ctx.fillStyle = textColor;
            ctx.font = '10px Poppins, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(dose.amount + 'mg', x, padding.top + chartHeight + 30);
        }
    });

    // Draw decay curve
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 3;
    ctx.beginPath();

    let firstPoint = true;
    for (let i = 0; i <= samplePoints; i++) {
        const time = visualStartTime + (i * timeStep);
        const caffeine = getTotalCaffeineAtTime(time);

        const x = padding.left + ((time - visualStartTime) / (endTime - visualStartTime)) * chartWidth;
        const y = padding.top + chartHeight - (caffeine / maxCaffeine) * chartHeight;

        if (firstPoint) {
            ctx.moveTo(x, y);
            firstPoint = false;
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();

    // Draw current caffeine point
    const currentCaffeine = getCurrentCaffeine();
    if (currentCaffeine > 0) {
        const currentY = padding.top + chartHeight - (currentCaffeine / maxCaffeine) * chartHeight;

        ctx.fillStyle = lineColor;
        ctx.beginPath();
        ctx.arc(nowX, currentY, 6, 0, Math.PI * 2);
        ctx.fill();

        // Draw current value label
        ctx.fillStyle = lineColor;
        ctx.font = 'bold 14px Poppins, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(Math.round(currentCaffeine) + ' mg', nowX + 10, currentY - 10);
    }
}

// Format time label for chart
function formatTimeLabel(time, now) {
    const diff = time - now;
    const hours = Math.round(diff / (1000 * 60 * 60));

    if (hours === 0) return 'Now';
    if (hours > 0) return '+' + hours + 'h';
    return hours + 'h';
}

// Update all displays and visualization
function updateVisualization() {
    const currentCaffeine = getCurrentCaffeine();

    // Update current caffeine display
    document.getElementById('current-caffeine').textContent = Math.round(currentCaffeine) + ' mg';

    // Calculate percentage (400mg is considered max safe daily intake)
    const percentage = Math.min(100, (currentCaffeine / 400) * 100);
    const percentageEl = document.getElementById('caffeine-percentage');
    percentageEl.textContent = Math.round(percentage) + '% of safe daily limit';
    percentageEl.className = 'caffeine-percentage';
    if (percentage > 75) {
        percentageEl.classList.add('high');
    } else if (percentage > 50) {
        percentageEl.classList.add('medium');
    }

    // Update peak caffeine
    let peakCaffeine = 0;
    const now = state.currentTime;
    const pastWindow = now - (state.timeWindow * 60 * 60 * 1000);

    for (let i = 0; i <= 100; i++) {
        const time = pastWindow + ((now - pastWindow) * i / 100);
        peakCaffeine = Math.max(peakCaffeine, getTotalCaffeineAtTime(time));
    }
    document.getElementById('peak-caffeine').textContent = Math.round(peakCaffeine) + ' mg';

    // Calculate time to threshold
    let timeToThreshold = null;
    if (currentCaffeine > SAFE_THRESHOLD) {
        // Binary search for when caffeine drops to threshold
        let low = now;
        let high = now + (48 * 60 * 60 * 1000); // Check up to 48 hours

        while (high - low > 60000) { // 1 minute precision
            const mid = (low + high) / 2;
            const caffeineAtMid = getTotalCaffeineAtTime(mid);

            if (caffeineAtMid > SAFE_THRESHOLD) {
                low = mid;
            } else {
                high = mid;
            }
        }

        const hoursUntil = (high - now) / (1000 * 60 * 60);
        timeToThreshold = hoursUntil;
    }

    if (timeToThreshold !== null) {
        const hours = Math.floor(timeToThreshold);
        const minutes = Math.round((timeToThreshold - hours) * 60);
        document.getElementById('time-to-threshold').textContent =
            `${hours}h ${minutes}m`;
    } else if (currentCaffeine > 0) {
        document.getElementById('time-to-threshold').textContent = 'Below threshold';
    } else {
        document.getElementById('time-to-threshold').textContent = 'N/A';
    }

    // Update history list
    updateHistoryList();

    // Draw chart
    drawChart();
}

// Update history list display
function updateHistoryList() {
    const historyList = document.getElementById('history-list');

    if (state.doses.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No caffeine intake recorded yet</p>';
        return;
    }

    // Sort doses by time (newest first)
    const sortedDoses = [...state.doses].sort((a, b) => b.timestamp - a.timestamp);

    historyList.innerHTML = sortedDoses.map((dose, index) => {
        const timeAgo = formatTimeAgo(dose.timestamp);
        const currentAmount = calculateCaffeineAtTime(dose.amount, dose.timestamp, state.currentTime, state.halfLife);
        const percentage = (currentAmount / dose.amount) * 100;

        return `
            <div class="history-item">
                <div class="history-time">${timeAgo}</div>
                <div class="history-amount">${dose.amount} mg</div>
                <div class="history-remaining">${Math.round(currentAmount)} mg remaining (${Math.round(percentage)}%)</div>
            </div>
        `;
    }).join('');
}

// Format time ago string
function formatTimeAgo(timestamp) {
    const diff = state.currentTime - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Setup event listeners
function setupEventListeners() {
    // Add caffeine button
    document.getElementById('add-caffeine-btn').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('caffeine-amount').value);
        if (amount > 0) {
            addDose(amount);
        }
    });

    // Enter key in amount input
    document.getElementById('caffeine-amount').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const amount = parseFloat(document.getElementById('caffeine-amount').value);
            if (amount > 0) {
                addDose(amount);
            }
        }
    });

    // Quick amount buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amount = parseFloat(btn.dataset.amount);
            document.getElementById('caffeine-amount').value = amount;
            addDose(amount);
        });
    });

    // Clear history button
    document.getElementById('clear-history-btn').addEventListener('click', clearHistory);

    // Half-life setting
    document.getElementById('half-life').addEventListener('change', async (e) => {
        state.halfLife = parseFloat(e.target.value);
        saveToStorage();
        await saveToCloud();
        updateVisualization();
    });

    // Time window setting
    document.getElementById('time-window').addEventListener('change', async (e) => {
        state.timeWindow = parseFloat(e.target.value);
        saveToStorage();
        await saveToCloud();
        updateVisualization();
    });

    // Sync now button
    const syncBtn = document.getElementById('sync-now-btn');
    if (syncBtn) {
        syncBtn.addEventListener('click', async () => {
            await saveToCloud();
            await loadFromCloud();
            updateVisualization();
        });
    }

    // Copy user ID button
    const copyIdBtn = document.getElementById('copy-id-btn');
    if (copyIdBtn) {
        copyIdBtn.addEventListener('click', () => {
            const userId = getUserId();
            navigator.clipboard.writeText(userId).then(() => {
                alert('User ID copied to clipboard! Share this ID to sync across devices.');
            }).catch(err => {
                prompt('Copy this User ID to sync across devices:', userId);
            });
        });
    }

    // Set user ID button
    const setIdBtn = document.getElementById('set-id-btn');
    if (setIdBtn) {
        setIdBtn.addEventListener('click', async () => {
            const newUserId = prompt('Enter your User ID from another device:');
            if (newUserId && newUserId.trim()) {
                localStorage.setItem(USER_ID_KEY, newUserId.trim());
                await loadFromCloud();
                updateVisualization();
                alert('User ID updated! Your data has been synced.');
            }
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');

    // Load saved theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';

        // Redraw chart with new colors
        drawChart();
    });

    // Load settings from inputs
    state.halfLife = parseFloat(document.getElementById('half-life').value);
    state.timeWindow = parseFloat(document.getElementById('time-window').value);
}

// Start the app
init();
