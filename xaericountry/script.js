/* =========================================================
   XAERISOFT CONTACT LOOKUP - PRODUCTION LOGIC
   Architect: Senior Full Stack Engineer
   ========================================================= */

// 1. CONFIGURATION & STATE
const CONFIG = {
    // Ganti dengan URL backend Node.js/Express Anda nanti
    API_BASE_URL: 'http://localhost:3000/api/v1', 
    HEADERS: {
        'Content-Type': 'application/json',
        // Tambahkan token otorisasi jika ada: 'Authorization': `Bearer ${token}`
    }
};

const AppState = {
    currentSearchTarget: null,
    history: [],
    bookmarks: [],
    stats: { totalSearches: 0, totalBookmarks: 0 }
};

// 2. DOM ELEMENTS
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

// 3. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    fetchInitialData();
});

function initEvents() {
    DOM.searchInput.addEventListener('input', handleInputDetection);
    DOM.searchForm.addEventListener('submit', handleSearch);
    DOM.bookmarkBtn.addEventListener('click', toggleBookmark);
}

// ==========================================
// API INTEGRATION (REAL FETCH CALLS)
// ==========================================

async function fetchInitialData() {
    try {
        // Fetch History
        const historyRes = await fetch(`${CONFIG.API_BASE_URL}/history`, { headers: CONFIG.HEADERS });
        if (historyRes.ok) {
            AppState.history = await historyRes.json();
            renderHistory();
        }

        // Fetch Bookmarks
        const bookmarkRes = await fetch(`${CONFIG.API_BASE_URL}/bookmarks`, { headers: CONFIG.HEADERS });
        if (bookmarkRes.ok) {
            AppState.bookmarks = await bookmarkRes.json();
            AppState.stats.totalBookmarks = AppState.bookmarks.length;
            renderBookmarks();
        }

        // Fetch System Stats (Optional)
        const statsRes = await fetch(`${CONFIG.API_BASE_URL}/stats`, { headers: CONFIG.HEADERS });
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            AppState.stats.totalSearches = statsData.totalSearches || 0;
        }

        renderStats();
    } catch (error) {
        console.error("Gagal memuat data awal:", error);
        showToast("Error connecting to server.", "error");
    }
}

async function handleSearch(e) {
    e.preventDefault();
    const query = DOM.searchInput.value.trim();
    if (!query) return;

    // UI State: Loading
    DOM.resultContainer.classList.add('hidden');
    DOM.loadingState.classList.remove('hidden');
    showToast('Initializing secure lookup...', 'loading');

    try {
        // Call Backend Search API
        const response = await fetch(`${CONFIG.API_BASE_URL}/search`, {
            method: 'POST',
            headers: CONFIG.HEADERS,
            body: JSON.stringify({ query: query })
        });

        const result = await response.json();
        DOM.loadingState.classList.add('hidden');

        if (response.ok && result.data) {
            AppState.currentSearchTarget = result.data;
            renderSearchResult(result.data);
            
            // Perbarui history setelah pencarian sukses
            fetchInitialData(); 
            showToast('Target data decrypted successfully.', 'success');
        } else {
            showToast(result.message || 'Target not found in database.', 'warning');
        }
    } catch (error) {
        DOM.loadingState.classList.add('hidden');
        showToast('Server connection failed.', 'error');
        console.error("Search error:", error);
    }
}

async function toggleBookmark() {
    if (!AppState.currentSearchTarget) return;
    
    const target = AppState.currentSearchTarget;
    const isBookmarked = AppState.bookmarks.some(b => b.id === target.id);
    const originalState = isBookmarked;

    // Optimistic UI Update
    DOM.bookmarkBtn.classList.toggle('active', !isBookmarked);

    try {
        if (isBookmarked) {
            // Delete Bookmark API
            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmark/${target.id}`, {
                method: 'DELETE',
                headers: CONFIG.HEADERS
            });
            if (!res.ok) throw new Error('Gagal menghapus bookmark');
            showToast('Target removed from bookmarks.', 'success');
        } else {
            // Add Bookmark API
            const res = await fetch(`${CONFIG.API_BASE_URL}/bookmark`, {
                method: 'POST',
                headers: CONFIG.HEADERS,
                body: JSON.stringify({ targetId: target.id })
            });
            if (!res.ok) throw new Error('Gagal menambah bookmark');
            showToast('Target secured to bookmarks.', 'success');
        }
        // Refresh data dari server
        fetchInitialData();
    } catch (error) {
        // Rollback UI jika gagal
        DOM.bookmarkBtn.classList.toggle('active', originalState);
        showToast(error.message, 'error');
    }
}

// ==========================================
// UI RENDERING & LOGIC
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
    
    // Mapping Data dari Database
    document.getElementById('res-avatar').src = data.avatar || 'default-avatar.png';
    document.getElementById('res-name').textContent = data.name || 'Unknown';
    document.getElementById('res-identifier').textContent = data.phone || data.email || 'N/A';
    
    const statusEl = document.getElementById('res-status');
    statusEl.textContent = data.status || 'unknown';
    statusEl.className = `status-indicator ${data.status || 'unknown'}`;

    document.getElementById('res-email').textContent = data.email || 'N/A';
    document.getElementById('res-provider').textContent = data.provider || 'N/A';
    document.getElementById('res-country').textContent = data.country || 'N/A';
    document.getElementById('res-timezone').textContent = data.timezone || 'N/A';
    document.getElementById('res-updated').textContent = data.updated || 'N/A';

    const isBookmarked = AppState.bookmarks.some(b => b.id === data.id);
    DOM.bookmarkBtn.classList.toggle('active', isBookmarked);

    const tagsContainer = document.getElementById('tags-container');
    tagsContainer.innerHTML = '';
    if (data.tags && Array.isArray(data.tags)) {
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
        // Format tanggal sesuai struktur data backend Anda
        DOM.historyList.innerHTML += `
            <div class="list-item">
                <div class="list-info">
                    <h4>${item.keyword}</h4>
                    <p>${new Date(item.createdAt).toLocaleString()} | Status: ${item.found ? 'Match' : 'Unverified'}</p>
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

window.loadBookmark = async function(id) {
    const target = AppState.bookmarks.find(b => b.id === id);
    if(target) {
        switchTab('search');
        AppState.currentSearchTarget = target;
        DOM.searchInput.value = target.phone || target.name;
        renderSearchResult(target);
    }
}

// EXPORT MODULE (Tetap berjalan murni di Frontend)
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
    a.download = `xaerisoft_target_${data.id || 'export'}.${format}`;
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
