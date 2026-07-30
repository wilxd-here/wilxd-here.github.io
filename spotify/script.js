/**
 * XAERISOFT SPOTIFY DOWNLOADER - Frontend Logic
 * Architecture: Clean, Modular, Client-API Interaction
 */

class UIController {
    constructor() {
        this.initIcons();
        this.bindElements();
        this.attachEvents();
        this.simulateLoadingScreen();
    }

    initIcons() {
        lucide.createIcons();
    }

    bindElements() {
        this.input = document.getElementById('url-input');
        this.btnFetch = document.getElementById('btn-fetch');
        this.btnDownload = document.getElementById('btn-download');
        this.resultCard = document.getElementById('result-card');
        
        // Track Elements
        this.elCover = document.getElementById('track-cover');
        this.elTitle = document.getElementById('track-title');
        this.elArtist = document.getElementById('track-artist');
        this.elAlbum = document.getElementById('track-album');
        
        // Progress Elements
        this.progressContainer = document.getElementById('dl-progress-container');
        this.progressFill = document.getElementById('dl-progress-fill');
        this.progressStatus = document.getElementById('dl-status');
        this.progressPercent = document.getElementById('dl-percent');
        
        // Player Elements
        this.playerCover = document.getElementById('player-cover');
        this.playerTitle = document.getElementById('player-title');
        this.playerArtist = document.getElementById('player-artist');
    }

    attachEvents() {
        this.btnFetch.addEventListener('click', () => this.handleFetch());
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleFetch();
        });
        this.btnDownload.addEventListener('click', () => this.handleDownload());
    }

    simulateLoadingScreen() {
        let progress = 0;
        const bar = document.getElementById('init-progress');
        const overlay = document.getElementById('loading-screen');
        
        const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(() => {
                    overlay.style.opacity = '0';
                    setTimeout(() => overlay.remove(), 800);
                }, 500);
            }
            bar.style.width = `${progress}%`;
        }, 150);
    }

    async handleFetch() {
        const url = this.input.value.trim();
        if (!url) return;

        // Reset UI & Show Loading State
        this.btnFetch.classList.add('disabled');
        this.btnFetch.innerHTML = `<i data-lucide="loader" class="spin"></i>`;
        lucide.createIcons();
        this.resultCard.classList.remove('hidden');
        this.resultCard.style.opacity = "0.5";

        try {
            // Call Backend API Wrapper (Localhost:3000 as defined in backend architecture)
            const response = await fetch(`http://localhost:3000/api/info?url=${encodeURIComponent(url)}`);
            const data = await response.json();

            if(data.error) throw new Error(data.error);

            this.currentTrackData = data.post;
            this.updateUI(data.post);
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Failed to fetch track information. Ensure backend engine is running.");
        } finally {
            this.btnFetch.classList.remove('disabled');
            this.btnFetch.innerHTML = `<i data-lucide="search"></i>`;
            lucide.createIcons();
            this.resultCard.style.opacity = "1";
        }
    }

    updateUI(trackData) {
        const title = trackData.name || trackData.tracks?.[0]?.name || "Unknown Track";
        const artist = trackData.artist || "Unknown Artist";
        const coverUrl = trackData.image || trackData.cover || "https://via.placeholder.com/250x250/111315/1ED760?text=NO+COVER";

        // Update Card Info
        this.elTitle.textContent = title;
        this.elArtist.textContent = artist;
        this.elAlbum.innerHTML = `<i data-lucide="disc"></i> ${trackData.album || "Single"}`;
        
        this.elCover.src = coverUrl;
        this.elCover.classList.remove('hidden');
        document.querySelector('.cover-skeleton').classList.add('hidden');

        // Update Bottom Player UI
        this.playerTitle.textContent = title;
        this.playerArtist.textContent = artist;
        this.playerCover.src = coverUrl;

        // Enable Download Button
        this.btnDownload.classList.remove('disabled');
        lucide.createIcons();
    }

    async handleDownload() {
        const url = this.input.value.trim();
        if (!url) return;

        this.btnDownload.classList.add('hidden');
        this.progressContainer.classList.remove('hidden');
        
        // Simulating Polling Progress for UI smoothness (Real polling happens in Engine)
        this.simulateProgress();

        try {
            const response = await fetch('http://localhost:3000/api/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url, format: 'm4a' })
            });

            const result = await response.json();
            
            if (result.success && result.downloadLink) {
                this.progressFill.style.width = '100%';
                this.progressPercent.textContent = '100%';
                this.progressStatus.textContent = 'Complete!';
                
                // Trigger Download
                window.open(result.downloadLink, '_blank');
                
                setTimeout(() => {
                    this.resetDownloadUI();
                }, 3000);
            } else {
                throw new Error("Download Failed in Engine");
            }
        } catch (error) {
            console.error(error);
            this.progressStatus.textContent = 'Error processing request.';
            this.progressStatus.style.color = '#ff4d4d';
            setTimeout(() => this.resetDownloadUI(), 3000);
        }
    }

    simulateProgress() {
        let p = 0;
        this.progressStatus.style.color = 'var(--accent-glow)';
        this.progressInterval = setInterval(() => {
            if (p < 85) p += Math.random() * 5; // Hangs at 85% waiting for backend
            this.progressFill.style.width = `${p}%`;
            this.progressPercent.textContent = `${Math.floor(p)}%`;
            
            if(p < 30) this.progressStatus.textContent = 'Requesting server...';
            else if(p < 60) this.progressStatus.textContent = 'Converting track...';
            else this.progressStatus.textContent = 'Finalizing...';
        }, 800);
    }

    resetDownloadUI() {
        clearInterval(this.progressInterval);
        this.progressContainer.classList.add('hidden');
        this.btnDownload.classList.remove('hidden');
        this.progressFill.style.width = '0%';
    }
}

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
});
