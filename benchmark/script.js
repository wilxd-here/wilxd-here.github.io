/**
 * Xaerisoft Media Compressor
 * Created by WillXD
 */

// ==========================================
// 1. BACKGROUND ANIMATION (CANVAS PARTICLES)
// ==========================================
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let mouse = { x: null, y: null };

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.baseColor = Math.random() > 0.5 ? '#8B5CF6' : '#FFFFFF';
        this.opacity = Math.random();
        this.twinkleSpeed = Math.random() * 0.05 + 0.01;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Wrap around
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;

        // Twinkle
        this.opacity += this.twinkleSpeed;
        if (this.opacity > 1 || this.opacity < 0.2) this.twinkleSpeed *= -1;

        // Mouse Parallax
        if (mouse.x && mouse.y) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 150) {
                this.x -= dx * 0.01;
                this.y -= dy * 0.01;
            }
        }
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.baseColor;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    const numParticles = Math.min(window.innerWidth / 10, 150); // Optimize for performance
    for (let i = 0; i < numParticles; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();


// ==========================================
// 2. ROUTING & UI LOGIC
// ==========================================
const app = {
    views: ['home', 'image', 'video'],
    navigate(viewName) {
        this.views.forEach(v => {
            const el = document.getElementById(`view-${v}`);
            if (v === viewName) {
                el.classList.remove('hidden');
                setTimeout(() => el.classList.add('active'), 10);
            } else {
                el.classList.remove('active');
                setTimeout(() => el.classList.add('hidden'), 500); // Wait for fade out
            }
        });
        
        if (viewName === 'home') {
            imageCompressor.reset();
            videoCompressor.reset();
        }
    }
};

// Utilities
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// Drag & Drop Setup
function setupDragAndDrop(zoneId, inputId, callback) {
    const zone = document.getElementById(zoneId);
    const input = document.getElementById(inputId);

    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            callback(e.dataTransfer.files[0]);
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            callback(e.target.files[0]);
        }
    });
}


// ==========================================
// 3. IMAGE COMPRESSOR (CANVAS API)
// ==========================================
const imageCompressor = {
    file: null,
    originalDataUrl: null,
    compressedBlob: null,

    init() {
        setupDragAndDrop('image-drop-zone', 'image-input', this.handleFile.bind(this));
        
        document.getElementById('img-quality').addEventListener('input', (e) => {
            document.getElementById('img-quality-val').innerText = `${e.target.value}%`;
        });

        document.getElementById('img-quality').addEventListener('change', (e) => {
            if (this.file) this.compressImage(e.target.value / 100);
        });

        document.getElementById('btn-img-reset').addEventListener('click', () => this.reset());
        document.getElementById('btn-img-download').addEventListener('click', () => this.download());
    },

    handleFile(file) {
        if (!file.type.startsWith('image/')) return alert('Please upload an image file.');
        this.file = file;
        
        document.getElementById('image-drop-zone').classList.add('hidden');
        document.getElementById('image-editor').classList.remove('hidden');

        const reader = new FileReader();
        reader.onload = (e) => {
            this.originalDataUrl = e.target.result;
            const img = document.getElementById('img-original');
            img.src = this.originalDataUrl;
            
            img.onload = () => {
                document.getElementById('img-orig-size').innerText = formatBytes(this.file.size);
                document.getElementById('img-orig-res').innerText = `${img.naturalWidth} x ${img.naturalHeight}`;
                
                // Initial compression
                const quality = document.getElementById('img-quality').value / 100;
                this.compressImage(quality);
            };
        };
        reader.readAsDataURL(file);
    },

    compressImage(quality) {
        const img = document.getElementById('img-original');
        const cvs = document.createElement('canvas');
        cvs.width = img.naturalWidth;
        cvs.height = img.naturalHeight;
        const ctx = cvs.getContext('2d');
        ctx.drawImage(img, 0, 0);

        // Convert to webp for better compression, fallback to jpeg
        const mimeType = this.file.type === 'image/png' && quality === 1 ? 'image/png' : 'image/webp';

        cvs.toBlob((blob) => {
            this.compressedBlob = blob;
            const compUrl = URL.createObjectURL(blob);
            document.getElementById('img-compressed').src = compUrl;
            
            document.getElementById('img-comp-size').innerText = formatBytes(blob.size);
            document.getElementById('img-comp-res').innerText = `${cvs.width} x ${cvs.height}`;

            const savings = ((this.file.size - blob.size) / this.file.size * 100).toFixed(1);
            const savingsEl = document.getElementById('img-savings');
            
            if (savings > 0) {
                savingsEl.innerText = `-${savings}%`;
                savingsEl.style.background = 'var(--primary)';
            } else {
                savingsEl.innerText = `+${Math.abs(savings)}%`;
                savingsEl.style.background = '#ef4444'; // red if larger
            }

        }, mimeType, quality);
    },

    download() {
        if (!this.compressedBlob) return;
        const url = window.URL.createObjectURL(this.compressedBlob);
        const a = document.createElement('a');
        a.href = url;
        const ext = this.compressedBlob.type.split('/')[1];
        a.download = `Xaerisoft_Compressed_${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    },

    reset() {
        this.file = null;
        this.originalDataUrl = null;
        this.compressedBlob = null;
        document.getElementById('image-input').value = '';
        document.getElementById('image-drop-zone').classList.remove('hidden');
        document.getElementById('image-editor').classList.add('hidden');
        document.getElementById('img-quality').value = 80;
        document.getElementById('img-quality-val').innerText = '80%';
    }
};


// ==========================================
// 4. VIDEO COMPRESSOR (METADATA & SIMULATION)
// ==========================================
const videoCompressor = {
    file: null,
    qualityMultipliers: {
        medium: 0.5,
        high: 0.7,
        ultra: 0.9
    },
    selectedQuality: 'medium',

    init() {
        setupDragAndDrop('video-drop-zone', 'video-input', this.handleFile.bind(this));
        
        document.querySelectorAll('.btn-quality').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.btn-quality').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedQuality = e.target.dataset.q;
                this.simulateCompression();
            });
        });

        document.getElementById('btn-vid-reset').addEventListener('click', () => this.reset());
    },

    handleFile(file) {
        if (!file.type.startsWith('video/')) return alert('Please upload a video file.');
        this.file = file;
        
        document.getElementById('video-drop-zone').classList.add('hidden');
        document.getElementById('video-editor').classList.remove('hidden');

        const video = document.getElementById('vid-preview');
        const fileURL = URL.createObjectURL(file);
        video.src = fileURL;

        document.getElementById('vid-orig-size').innerText = formatBytes(file.size);

        video.onloadedmetadata = () => {
            document.getElementById('vid-duration').innerText = formatTime(video.duration);
            document.getElementById('vid-res').innerText = `${video.videoWidth} x ${video.videoHeight}`;
            this.simulateCompression();
        };
    },

    simulateCompression() {
        if (!this.file) return;
        const multiplier = this.qualityMultipliers[this.selectedQuality];
        const estimatedSize = this.file.size * multiplier;
        document.getElementById('vid-comp-size').innerText = formatBytes(estimatedSize);
    },

    reset() {
        this.file = null;
        const video = document.getElementById('vid-preview');
        video.pause();
        video.src = "";
        video.removeAttribute('src'); 
        video.load();
        
        document.getElementById('video-input').value = '';
        document.getElementById('video-drop-zone').classList.remove('hidden');
        document.getElementById('video-editor').classList.add('hidden');
        
        // Reset quality buttons
        document.querySelectorAll('.btn-quality').forEach(b => b.classList.remove('active'));
        document.querySelector('.btn-quality[data-q="medium"]').classList.add('active');
        this.selectedQuality = 'medium';
    }
};

// Initialize Modules
document.addEventListener('DOMContentLoaded', () => {
    imageCompressor.init();
    videoCompressor.init();
});
