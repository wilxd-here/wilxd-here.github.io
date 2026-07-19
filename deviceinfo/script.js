/**
 * Xaerisoft Device Info - Core System
 * Created by WillXD
 * Copyright (c) 2026 WillXD. All Rights Reserved.
 */

// ==========================================
// 1. GLOBAL STATE & UTILITIES
// ==========================================
const appData = {};

const $ = (id) => document.getElementById(id);
const setText = (id, text, type) => {
    const el = $(id);
    if(el) {
        el.innerText = text;
        if(type === 'good') el.classList.add('highlight');
        if(type === 'bad') el.classList.add('warning');
    }
};

// ==========================================
// 2. UNIVERSE CANVAS (STAR PARTICLES)
// ==========================================
class Universe {
    constructor() {
        this.canvas = $('universe-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.sparkles = [];
        this.mouseX = window.innerWidth / 2;
        this.mouseY = window.innerHeight / 2;
        this.lastShootingStar = 0;
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        this.initStars();
        this.animate();
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    initStars() {
        const starCount = Math.floor((this.width * this.height) / 1000); // Responsive amount
        for(let i=0; i<starCount; i++) {
            this.stars.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                z: Math.random() * 2 + 0.1, // Depth for parallax
                size: Math.random() * 1.5,
                alpha: Math.random(),
                flicker: Math.random() * 0.05,
                color: Math.random() > 0.8 ? '#A855F7' : '#FFFFFF' // 20% purple stars
            });
        }
    }

    createShootingStar() {
        this.shootingStars.push({
            x: Math.random() * this.width,
            y: 0,
            len: Math.random() * 80 + 20,
            speed: Math.random() * 10 + 15,
            angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
            alpha: 1
        });
    }

    animate(timestamp) {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Parallax offset
        const cx = this.width / 2;
        const cy = this.height / 2;
        const dx = (this.mouseX - cx) * 0.02;
        const dy = (this.mouseY - cy) * 0.02;

        // Draw Stars
        this.stars.forEach(s => {
            // Flicker
            s.alpha += s.flicker;
            if(s.alpha > 1 || s.alpha < 0.1) s.flicker *= -1;

            // Parallax movement based on Z
            let px = s.x - (dx * s.z);
            let py = s.y - (dy * s.z);

            // Wrap around
            if(px < 0) px += this.width;
            if(px > this.width) px -= this.width;
            if(py < 0) py += this.height;
            if(py > this.height) py -= this.height;

            this.ctx.globalAlpha = s.alpha;
            this.ctx.fillStyle = s.color;
            
            // Subtle glow for bigger stars
            if(s.size > 1.2) {
                this.ctx.shadowBlur = 5;
                this.ctx.shadowColor = s.color;
            } else {
                this.ctx.shadowBlur = 0;
            }

            this.ctx.beginPath();
            this.ctx.arc(px, py, s.size, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw Shooting Stars (spawn 8-15s)
        if(!timestamp) timestamp = 0;
        if(timestamp - this.lastShootingStar > (Math.random() * 7000 + 8000)) {
            this.createShootingStar();
            this.lastShootingStar = timestamp;
        }

        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#A855F7';
        for(let i = this.shootingStars.length - 1; i >= 0; i--) {
            let ss = this.shootingStars[i];
            ss.x -= Math.cos(ss.angle) * ss.speed;
            ss.y += Math.sin(ss.angle) * ss.speed;
            ss.alpha -= 0.02;

            this.ctx.globalAlpha = ss.alpha;
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(ss.x, ss.y);
            this.ctx.lineTo(ss.x + Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
            this.ctx.stroke();

            if(ss.alpha <= 0) this.shootingStars.splice(i, 1);
        }

        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        requestAnimationFrame((ts) => this.animate(ts));
    }
}

// ==========================================
// 3. CUSTOM CURSOR
// ==========================================
const cursor = $('glow-cursor');
let cX = window.innerWidth / 2, cY = window.innerHeight / 2;
let tX = cX, tY = cY;

window.addEventListener('mousemove', (e) => {
    tX = e.clientX;
    tY = e.clientY;
});

document.querySelectorAll('button, .glass-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.style.transform = 'translate(-50%, -50%) scale(1.5)');
    el.addEventListener('mouseleave', () => cursor.style.transform = 'translate(-50%, -50%) scale(1)');
});

function animateCursor() {
    cX += (tX - cX) * 0.2; // Smooth lerp
    cY += (tY - cY) * 0.2;
    cursor.style.left = cX + 'px';
    cursor.style.top = cY + 'px';
    requestAnimationFrame(animateCursor);
}
if(window.innerWidth > 768) animateCursor(); // Only on desktop

// ==========================================
// 4. DATA COLLECTION ENGINE
// ==========================================
async function collectData() {
    // -- Device & Browser --
    const ua = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    appData.deviceType = isMobile ? 'Mobile/Tablet' : 'Desktop';
    appData.touchSupport = hasTouch ? 'Supported' : 'Not Supported';
    appData.orientation = (window.screen.orientation || {}).type || 'Unknown';
    
    // Simple Browser Name Parser
    let browserName = "Unknown";
    if (ua.indexOf("Firefox") > -1) browserName = "Mozilla Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browserName = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browserName = "Opera";
    else if (ua.indexOf("Trident") > -1) browserName = "Microsoft Internet Explorer";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browserName = "Microsoft Edge";
    else if (ua.indexOf("Chrome") > -1) browserName = "Google Chrome";
    else if (ua.indexOf("Safari") > -1) browserName = "Apple Safari";
    
    appData.browserName = browserName;
    appData.browserVersion = navigator.appVersion.split(' ')[0] || "Unknown";
    appData.userAgent = ua;

    // -- Display --
    appData.res = `${window.screen.width} x ${window.screen.height}`;
    appData.viewport = `${window.innerWidth} x ${window.innerHeight}`;
    appData.pixelRatio = window.devicePixelRatio || 1;
    appData.colorDepth = `${window.screen.colorDepth}-bit`;
    appData.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark Mode' : 'Light Mode';

    // -- Network --
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    appData.online = navigator.onLine ? 'Online' : 'Offline';
    if(conn) {
        appData.connType = conn.effectiveType || 'Unknown';
        appData.downlink = conn.downlink ? `${conn.downlink} Mbps` : 'Unknown';
        appData.rtt = conn.rtt ? `${conn.rtt} ms` : 'Unknown';
        appData.saveData = conn.saveData ? 'Enabled' : 'Disabled';
    } else {
        appData.connType = appData.downlink = appData.rtt = appData.saveData = 'Unsupported';
    }

    // -- Hardware --
    appData.cpu = navigator.hardwareConcurrency || 'Unknown';
    appData.memory = navigator.deviceMemory ? `${navigator.deviceMemory} GB+` : 'Unknown';
    
    // GPU Detection
    try {
        const gl = $('gpu-canvas').getContext('webgl') || $('gpu-canvas').getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            appData.gpuVendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';
            appData.gpuRenderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
            appData.webglVersion = gl.getParameter(gl.VERSION);
        } else {
            appData.gpuVendor = appData.gpuRenderer = appData.webglVersion = 'WebGL Not Supported';
        }
    } catch(e) {
        appData.gpuVendor = appData.gpuRenderer = appData.webglVersion = 'Restricted';
    }

    // -- Time --
    const date = new Date();
    appData.localTime = date.toLocaleTimeString();
    appData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    appData.utcOffset = `UTC ${(date.getTimezoneOffset() > 0 ? '-' : '+')}${Math.abs(date.getTimezoneOffset() / 60)}`;

    // -- Language & Features --
    appData.brwLang = navigator.language;
    appData.prefLang = navigator.languages ? navigator.languages.join(', ') : appData.brwLang;
    appData.cookies = navigator.cookieEnabled ? 'Enabled' : 'Disabled';
    
    try { appData.storage = (window.localStorage && window.sessionStorage) ? 'Supported' : 'Disabled'; } 
    catch(e) { appData.storage = 'Disabled'; }
    
    appData.clipboard = navigator.clipboard ? 'Supported' : 'Not Supported';
    appData.webShare = navigator.share ? 'Supported' : 'Not Supported';

    // -- Media & Sensors --
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCam = devices.some(d => d.kind === 'videoinput');
        const hasMic = devices.some(d => d.kind === 'audioinput');
        appData.cam = hasCam ? 'Available' : 'Not Available';
        appData.mic = hasMic ? 'Available' : 'Not Available';
    } catch(e) {
        appData.cam = appData.mic = 'Requires Permission/HTTPS';
    }

    appData.gyro = window.DeviceOrientationEvent ? 'Supported' : 'Not Supported';
    appData.accel = window.DeviceMotionEvent ? 'Supported' : 'Not Supported';
    appData.touchSensor = hasTouch ? 'Available' : 'Not Available';

    // -- Location (Geolocation API + Reverse Geocoding) --
    await fetchLocation();
}

async function fetchLocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            appData.location = `🌍 Indonesia | ${appData.timezone} | ${appData.brwLang}`;
            resolve();
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    // Using free nominatim API (no key needed, but rate limited. Fail softly)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                    if(!res.ok) throw new Error("API Error");
                    const data = await res.json();
                    
                    const city = data.address.city || data.address.town || data.address.village || 'Unknown City';
                    const county = data.address.county || data.address.state_district || '';
                    const state = data.address.state || '';
                    const country = data.address.country || 'Unknown Country';
                    
                    appData.location = `📍 ${city}, ${county}, ${state}, ${country}`.replace(/, ,/g, ',');
                } catch(err) {
                    appData.location = `🌍 Lat: ${position.coords.latitude.toFixed(4)}, Lon: ${position.coords.longitude.toFixed(4)}`;
                }
                resolve();
            },
            (error) => {
                // Denied or error
                appData.location = `🌍 Indonesia | ${appData.timezone} | ${appData.brwLang}`;
                resolve();
            },
            { timeout: 5000 }
        );
    });
}

// ==========================================
// 5. RENDER UI
// ==========================================
function renderData() {
    // Device
    setText('dev-type', appData.deviceType);
    setText('dev-touch', appData.touchSupport, appData.touchSupport === 'Supported' ? 'good' : '');
    setText('dev-orient', appData.orientation);

    // Browser
    setText('brw-name', appData.browserName);
    setText('brw-version', appData.browserVersion);
    setText('brw-ua', appData.userAgent);

    // Display
    setText('disp-res', appData.res);
    setText('disp-view', appData.viewport);
    setText('disp-ratio', appData.pixelRatio);
    setText('disp-color', appData.colorDepth);
    setText('disp-theme', appData.darkMode);

    // Network
    setText('net-status', appData.online, appData.online === 'Online' ? 'good' : 'bad');
    setText('net-type', appData.connType);
    setText('net-downlink', appData.downlink);
    setText('net-rtt', appData.rtt);
    setText('net-save', appData.saveData);

    // Hardware
    setText('hw-cpu', appData.cpu);
    setText('hw-mem', appData.memory);
    setText('hw-gpu-v', appData.gpuVendor);
    setText('hw-gpu-r', appData.gpuRenderer);
    setText('hw-webgl', appData.webglVersion);

    // Time & Location
    setText('time-local', appData.localTime);
    setText('time-zone', appData.timezone);
    setText('time-utc', appData.utcOffset);
    setText('loc-data', appData.location);

    // Features
    setText('lang-brw', appData.brwLang);
    setText('lang-pref', appData.prefLang);
    setText('feat-cookies', appData.cookies, appData.cookies === 'Enabled' ? 'good' : 'bad');
    setText('feat-storage', appData.storage, appData.storage === 'Supported' ? 'good' : 'bad');
    setText('feat-clip', appData.clipboard);
    setText('feat-share', appData.webShare);

    // Media
    setText('media-cam', appData.cam, appData.cam === 'Available' ? 'good' : '');
    setText('media-mic', appData.mic, appData.mic === 'Available' ? 'good' : '');
    setText('sens-gyro', appData.gyro);
    setText('sens-accel', appData.accel);
    setText('sens-touch', appData.touchSensor);
}

// ==========================================
// 6. EXPORT & ACTIONS
// ==========================================
function formatForExport(type) {
    if(type === 'json') {
        return JSON.stringify(appData, null, 4);
    }
    
    let txt = `=======================================\n`;
    txt += `       XAERISOFT DEVICE INFO           \n`;
    txt += `=======================================\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    for(const [key, value] of Object.entries(appData)) {
        txt += `${key.padEnd(20)}: ${value}\n`;
    }
    txt += `\n=======================================\n`;
    txt += `Copyright (c) 2026 WillXD\n`;
    return txt;
}

function triggerDownload(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

$('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(formatForExport('txt')).then(() => {
        const btn = $('btn-copy');
        const orgText = btn.innerText;
        btn.innerText = '✅ Copied!';
        setTimeout(() => btn.innerText = orgText, 2000);
    });
});

$('btn-txt').addEventListener('click', () => {
    triggerDownload(formatForExport('txt'), 'Xaerisoft_Device_Info.txt', 'text/plain');
});

$('btn-json').addEventListener('click', () => {
    triggerDownload(formatForExport('json'), 'Xaerisoft_Device_Info.json', 'application/json');
});

$('btn-refresh').addEventListener('click', () => {
    location.reload();
});

// Update time clock every second
setInterval(() => {
    if(appData.localTime) {
        appData.localTime = new Date().toLocaleTimeString();
        setText('time-local', appData.localTime);
    }
}, 1000);

// ==========================================
// 7. INITIALIZATION & PERMISSION FLOW
// ==========================================
function setAllUnable() {
    // Jika ditolak, set semua data menjadi Unable
    const items = document.querySelectorAll('.glass-card ul li span:last-child');
    items.forEach(item => {
        item.innerText = 'Unable to scan (Permission Denied)';
        item.classList.add('warning');
    });
}

window.onload = () => {
    // Start universe background
    new Universe();

    // Hilangkan loading screen, lalu munculkan modal izin
    setTimeout(() => {
        const loader = $('loader');
        loader.style.opacity = '0';
        
        setTimeout(() => {
            loader.style.display = 'none';
            $('main-content').style.display = 'block'; // Tampilkan layout web
            
            // Tampilkan Modal Izin
            const modal = $('permission-modal');
            modal.style.display = 'flex';
            
            // Kasih sedikit delay agar animasi CSS berjalan
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
                document.querySelector('.modal-content').classList.add('show');
            });
        }, 500);
    }, 1500);
};

// Tombol Allow di-klik
$('btn-allow').addEventListener('click', async () => {
    const modal = $('permission-modal');
    modal.style.opacity = '0';
    document.querySelector('.modal-content').classList.remove('show');
    
    setTimeout(async () => {
        modal.style.display = 'none';
        // Jalankan pemindaian spesifikasi HP
        await collectData();
        renderData();
    }, 400);
});

// Tombol Deny di-klik (Unable)
$('btn-deny').addEventListener('click', () => {
    const modal = $('permission-modal');
    modal.style.opacity = '0';
    document.querySelector('.modal-content').classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
        // Kunci semua akses data
        setAllUnable();
    }, 400);
});
