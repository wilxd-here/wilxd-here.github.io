/* =========================================================
   XAERISOFT CONTACT LOOKUP - HYBRID PRODUCTION LOGIC
   Architect: Senior Full Stack Engineer
   ========================================================= */

const CONFIG = {
    API_BASE_URL: 'http://localhost:3000/api/v1',
    HEADERS: { 'Content-Type': 'application/json' },
    TIMEOUT: 2000 // Batas waktu tunggu server (2 detik)
};

// Database Lokal (Fallback jika server offline)
const LocalFallbackDB = [
    {
        id: "USR-001",
        name: "Alex Mercer",
        phone: "+62 812-3456-7890",
        email: "alex.mercer@xmail.com",
        provider: "Telkomsel",
        country: "Indonesia",
        timezone: "UTC+7 (WIB)",
        updated: "2026-03-15",
        status: "online",
        tags: ["Developer", "Teman Kerja", "Programmer"],
        avatar: "https://i.pravatar.cc/150?u=alex"
    },
    {
        id: "USR-002",
        name: "Sarah Jenkins",
        phone: "+1 555-019-8372",
        email: "s.jenkins@corpnet.us",
        provider: "AT&T",
        country: "United States",
        timezone: "UTC-5 (EST)",
        updated: "2026-03-10",
        status: "offline",
        tags: ["Customer", "VIP"],
        avatar: "https://i.pravatar.cc/150?u=sarah"
    }
];

const AppState = {
    currentSearchTarget: null,
    history: JSON.parse(localStorage.getItem('xaeri_history') || '[]'),
    bookmarks: JSON.parse(localStorage.getItem('xaeri_bookmarks') || '[]'),
    stats: { totalSearches: 1204, totalBookmarks: 0 }
};

const DOM = {
    searchInput: document.getElementById('search-input'),
    inputTypeBadge: document.getElementById('input-type-badge'),
    searchForm: document.getElementById('search-form'),
    loadingState: document.getElementById('loading-state'),
    resultContainer: document.getElementById('result-container'),
    toastContainer: document.getElementById('toast-container'),
    bookmarkBtn: document.getElementById('btn-bookmark'),
    historyList: document.getElementById('history-list'),
    bookmarkList: document.getElementById('bookmark-list')
};

document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    AppState.stats.totalBookmarks = AppState.bookmarks.length;
    renderStats();
});

function initEvents() {
    DOM.searchInput.addEventListener('input', handleInputDetection);
    DOM.searchForm.addEventListener('submit', handleSearch);
    DOM.bookmarkBtn.addEventListener('click', toggleBookmark);
}

// ==========================================
// SEARCH LOGIC (API WITH FALLBACK)
// ==========================================

async function handleSearch(e) {
    e.preventDefault();
    const query = DOM.searchInput.value.trim();
    if (!query) return;

    DOM.resultContainer.classList.add('hidden');
    DOM.loadingState.classList.remove('hidden');
    showToast('Initializing secure lookup...', 'loading');

    try {
        // Coba panggil Backend dengan Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

        const response = await fetch(`${CONFIG.API_BASE_URL}/search`, {
            method: 'POST',
            headers: CONFIG.HEADERS,
            body: JSON.stringify({ query }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            const result = await response.json();
            processSearchResult(result.data, query, 'Server Node active');
            return;
        }
    } catch (error) {
        // Jika server offline/error, gunakan Local Fallback
        console.warn("Backend offline. Beralih ke Local Engine.");
    }

    // LOCAL ENGINE FALLBACK
    setTimeout(() => {
        let match = LocalFallbackDB.find(u => 
            u.phone.includes(query) || 
            u.email.toLowerCase().includes(query.toLowerCase()) || 
            u.name.toLowerCase().includes(query.toLowerCase())
        );

        if (!match) {
            match = {
                id: "USR-OFFLINE-" + Math.floor(Math.random() * 1000),
                name: query,
                phone: query,
                email: `${query.replace(/\s/g, '').toLowerCase()}@xaerisoft.node`,
                provider: "Secured Provider",
                country: "Local Node",
                timezone: "UTC+7",
                updated: new Date().toISOString().split('T')[0],
                status: "unknown",
                tags: ["Scanned", "Unverified"],
                avatar: "https://i.pravatar.cc/150?u=" + query
            };
        }

        processSearchResult(match, query, 'Offline/Demo Mode');
    }, 800);
}

function processSearchResult(data, query, sourceInfo) {
    DOM.loadingState.classList.add('hidden');
    AppState.currentSearchTarget = data;
    
    // Simpan History
    AppState.history.unshift({
        keyword: query,
        found: true,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString()
    });
    localStorage.setItem('xaeri_history', JSON.stringify(AppState.history));

    AppState.stats.totalSearches++;
    renderStats();
    renderSearchResult(data);
    showToast(`Target decrypted (${sourceInfo})`, 'success');
}

// ==========================================
// BOOKMARK LOGIC
// ==========================================

function toggleBookmark() {
    if (!AppState.currentSearchTarget) return;
    
    const target = AppState.currentSearchTarget;
    const index = AppState.bookmarks.findIndex(b => b.id === target.id);

    if (index > -1) {
        AppState.bookmarks.splice(index, 1);
        DOM.bookmarkBtn.classList.remove('active');
        showToast('Target removed from bookmarks.', 'success');
    } else {
        AppState.bookmarks.push(target);
        DOM.bookmarkBtn.classList.add('active');
        showToast('Target secured to bookmarks.', 'success');
    }

    localStorage.setItem('xaeri_bookmarks', JSON.stringify(AppState.bookmarks));
    AppState.stats.totalBookmarks = AppState.bookmarks.length;
    renderStats();
}

// ==========================================
// UI RENDERING
// ==========================================

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`${tabId}-section`).classList.add('active');
    event.currentTarget.classList.add('active');

    if(tabId === 'history') renderHistory();
    if(tabId === 'bookmarks') renderBookmarks();
}

function handleInputDetection(e) {
    const val = e.target.value.trim();
    const badge = DOM.inputTypeBadge;
    
    if (val === '') {
        badge.textContent = 'TEXT';
        badge.style.color = 'var(--neon-blue)';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/im;

    if (emailRegex.test(val)) {
        badge.textContent = 'EMAIL';
        badge.style.color = 'var(--warning)';
    } else if (phoneRegex.test(val) || /^[\d\+\-\s]+$/.test(val)) {
        badge.textContent = 'PHONE';
        badge.style.color = 'var(--success)';
    } else {
        badge.textContent = 'NAME';
        badge.style.color = 'var(--neon-purple)';
    }
}

function renderSearchResult(data) {
    DOM.resultContainer.classList.remove('hidden');
    
    document.getElementById('res-avatar').src = data.avatar;
    document.getElementById('res-name').textContent = data.name;
    document.getElementById('res-identifier').textContent = data.phone || data.email;
    
    const statusEl = document.getElementById('res-status');
    statusEl.textContent = data.status;
    statusEl.className = `status-indicator ${data.status}`;

    document.getElementById('res-email').textContent = data.email || 'N/A';
    document.getElementById('res-provider').textContent = data.provider;
    document.getElementById('res-country').textContent = data.country;
    document.getElementById('res-timezone').textContent = data.timezone;
    document.getElementById('res-updated').textContent = data.updated;

    const isBookmarked = AppState.bookmarks.some(b => b.id === data.id);
    DOM.bookmarkBtn.classList.toggle('active', isBookmarked);

    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    if (data.tags) {
        data.tags.forEach(tag => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.textContent = tag;
            tagsContainer.appendChild(span);
        });
    }
}

function renderHistory() {
    DOM.historyList.innerHTML = AppState.history.length ? '' : '<p style="color:var(--text-muted)">No search history found.</p>';
    AppState.history.forEach(item => {
        DOM.historyList.innerHTML += `
            <div class="list-item">
                <div class="list-info">
                    <h4>${item.keyword}</h4>
                    <p>${item.date} • ${item.time}</p>
                </div>
            </div>
        `;
    });
}

function renderBookmarks() {
    DOM.bookmarkList.innerHTML = AppState.bookmarks.length ? '' : '<p style="color:var(--text-muted)">No bookmarks secured yet.</p>';
    AppState.bookmarks.forEach(target => {
        DOM.bookmarkList.innerHTML += `
            <div class="list-item">
                <div class="list-info">
                    <h4>${target.name}</h4>
                    <p>${target.phone || target.email} | ${target.country}</p>
                </div>
                <button class="cyber-btn-outline" onclick="loadBookmark('${target.id}')">View</button>
            </div>
        `;
    });
}

window.loadBookmark = function(id) {
    const target = AppState.bookmarks.find(b => b.id === id);
    if(target) {
        switchTab('search');
        AppState.currentSearchTarget = target;
        DOM.searchInput.value = target.phone || target.name;
        renderSearchResult(target);
    }
}

window.exportData = function(format) {
    if (!AppState.currentSearchTarget) return showToast('No target data to export.', 'error');
    
    const data = AppState.currentSearchTarget;
    let content = '';
    let mimeType = '';

    if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    } else if (format === 'csv') {
        const headers = Object.keys(data).join(',');
        const values = Object.values(data).map(v => typeof v === 'object' ? `"${JSON.stringify(v)}"` : `"${v}"`).join(',');
        content = `${headers}\n${values}`;
        mimeType = 'text/csv';
    } else if (format === 'txt') {
        content = `XAERISOFT CONTACT LOOKUP\n==========================\n`;
        for (const [key, value] of Object.entries(data)) {
            content += `${key.toUpperCase()}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
        }
        mimeType = 'text/plain';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xaerisoft_target_${data.id}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast(`Data exported as ${format.toUpperCase()}`, 'success');
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    DOM.toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function renderStats() {
    document.getElementById('stat-searches').textContent = AppState.stats.totalSearches.toLocaleString();
    document.getElementById('stat-bookmarks').textContent = AppState.stats.totalBookmarks.toLocaleString();
}
