/**
 * Xaerisoft Scan - Frontend Logic
 * Prepared for Backend Integration via API simulation.
 */

// --- DOM Elements ---
const tabs = document.querySelectorAll('.tab-btn');
const scanAreas = document.querySelectorAll('.scan-area');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const fileInfo = document.getElementById('file-info');
const fileNameDisplay = document.getElementById('file-name');
const fileSizeDisplay = document.getElementById('file-size');
const btnScanFile = document.getElementById('btn-scan-file');
const btnScanUrl = document.getElementById('btn-scan-url');
const urlInput = document.getElementById('url-input');

const loadingState = document.getElementById('loading-state');
const resultsSection = document.getElementById('results-section');
const scannerSection = document.getElementById('scanner-section');

// --- Global Chart Instances ---
let pieChartInstance = null;
let barChartInstance = null;

// --- Tab Switching ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        scanAreas.forEach(area => area.classList.add('hidden'));
        
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.remove('hidden');
    });
});

// --- File Handling (Drag & Drop) ---
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--neon-blue)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--glass-border)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--glass-border)';
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});
fileInput.addEventListener('change', function() {
    if (this.files.length > 0) handleFile(this.files[0]);
});

function handleFile(file) {
    fileNameDisplay.textContent = file.name;
    fileSizeDisplay.textContent = `(${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
    fileInfo.classList.remove('hidden');
    btnScanFile.classList.remove('hidden');
}

// --- API Simulation & Mock Data ---
// Struktur ini disiapkan agar backend engineer cukup mengganti fetch API di dalam fungsi ini.
async function submitScanAPI(type, payload) {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Dummy Data Response
            const isMalware = Math.random() > 0.4; // Randomize result for demo
            resolve({
                status: isMalware ? 'Malicious' : 'Safe',
                score: isMalware ? Math.floor(Math.random() * (100 - 60) + 60) : Math.floor(Math.random() * 20),
                details: {
                    Name: type === 'file' ? payload.name : payload,
                    Size: type === 'file' ? `${(payload.size / 1048576).toFixed(2)} MB` : 'N/A',
                    Type: type === 'file' ? 'PE32 Executable' : 'Web URL',
                    "Mime Type": type === 'file' ? 'application/x-dosexec' : 'text/html',
                    SHA256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                    MD5: 'd41d8cd98f00b204e9800998ecf8427e',
                    SHA1: 'da39a3ee5e6b4b0d3255bfef95601890afd80709',
                    Entropy: '6.452 (Packed)',
                    "Compile Time": '2026-03-12 08:15:43',
                    Signature: 'Unsigned / Invalid'
                },
                analysis: {
                    "Malware Detection": isMalware,
                    "Phishing Detection": false,
                    "Trojan Detection": isMalware,
                    "Ransomware Detection": false,
                    "Adware Detection": false,
                    "Spyware Detection": false,
                    "Downloader Detection": isMalware,
                    "Packed File": true,
                    "Macro Detection": false,
                    "Obfuscation": true
                },
                engines: [
                    { name: 'Windows Defender', status: isMalware ? 'Malware' : 'Clean' },
                    { name: 'Bitdefender', status: isMalware ? 'Malware' : 'Clean' },
                    { name: 'Kaspersky', status: isMalware ? 'Suspicious' : 'Clean' },
                    { name: 'ESET', status: 'Clean' },
                    { name: 'Avast', status: isMalware ? 'Malware' : 'Clean' },
                    { name: 'AVG', status: 'Clean' },
                    { name: 'Malwarebytes', status: isMalware ? 'Malware' : 'Clean' },
                    { name: 'ClamAV', status: 'Clean' },
                    { name: 'Trend Micro', status: 'Clean' },
                    { name: 'Sophos', status: isMalware ? 'Suspicious' : 'Clean' },
                    { name: 'McAfee', status: isMalware ? 'Malware' : 'Clean' },
                    { name: 'Norton', status: 'Clean' }
                ]
            });
        }, 2000); // 2 second delay to simulate analysis
    });
}

// --- Trigger Scans ---
btnScanFile.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if(!file) return alert("Please select a file first.");
    executeScan('file', file);
});

btnScanUrl.addEventListener('click', async () => {
    const url = urlInput.value;
    if(!url) return alert("Please enter a URL.");
    executeScan('url', url);
});

async function executeScan(type, payload) {
    // UI State: Loading
    document.getElementById('file-scan').classList.add('hidden');
    document.getElementById('url-scan').classList.add('hidden');
    document.querySelector('.tabs').classList.add('hidden');
    loadingState.classList.remove('hidden');
    resultsSection.classList.add('hidden');

    // Call API
    const result = await submitScanAPI(type, payload);

    // UI State: Complete
    loadingState.classList.add('hidden');
    document.querySelector('.tabs').classList.remove('hidden');
    if(type === 'file') document.getElementById('file-scan').classList.remove('hidden');
    else document.getElementById('url-scan').classList.remove('hidden');
    
    renderResults(result);
}

// --- Render Logic ---
function renderResults(data) {
    resultsSection.classList.remove('hidden');
    
    // 1. Status & Score
    const statusEl = document.getElementById('result-status');
    statusEl.textContent = data.status;
    statusEl.className = '';
    statusEl.classList.add(`status-${data.status.toLowerCase()}`);

    const scoreEl = document.getElementById('result-score');
    scoreEl.textContent = data.score;
    const scoreCircle = scoreEl.parentElement;
    
    let scoreColor = 'var(--safe)';
    if(data.score > 30) scoreColor = 'var(--suspicious)';
    if(data.score > 70) scoreColor = 'var(--malicious)';
    
    scoreCircle.style.borderColor = scoreColor;
    scoreCircle.style.boxShadow = `0 0 20px ${scoreColor}`;
    scoreEl.style.color = scoreColor;

    // 2. Details List
    const detailsList = document.getElementById('detail-list');
    detailsList.innerHTML = '';
    for (const [key, value] of Object.entries(data.details)) {
        detailsList.innerHTML += `<li><span>${key}</span> <span>${value}</span></li>`;
    }

    // 3. Security Analysis Badges
    const analysisBadges = document.getElementById('analysis-badges');
    analysisBadges.innerHTML = '';
    for (const [key, isDetected] of Object.entries(data.analysis)) {
        const cssClass = isDetected ? 'detected' : 'clean';
        const icon = isDetected ? '<i class="fa-solid fa-triangle-exclamation"></i>' : '<i class="fa-solid fa-check"></i>';
        analysisBadges.innerHTML += `<div class="badge ${cssClass}">${icon} ${key}</div>`;
    }

    // 4. Antivirus Engines List
    const enginesList = document.getElementById('engines-list');
    enginesList.innerHTML = '';
    let detectedCount = 0;
    
    data.engines.forEach(engine => {
        let iconClass = 'fa-circle-check engine-clean';
        if(engine.status === 'Malware') { iconClass = 'fa-bug engine-malware'; detectedCount++; }
        else if(engine.status === 'Suspicious') { iconClass = 'fa-triangle-exclamation engine-suspicious'; detectedCount++; }

        enginesList.innerHTML += `
            <li>
                <span>${engine.name}</span> 
                <span class="${iconClass.split(' ')[1]}"><i class="fa-solid ${iconClass.split(' ')[0]}"></i> ${engine.status}</span>
            </li>
        `;
    });

    // 5. Render Charts
    renderCharts(detectedCount, data.engines.length - detectedCount);
}

// --- Chart.js Configuration ---
function renderCharts(malicious, clean) {
    const pieCtx = document.getElementById('pieChart').getContext('2d');
    const barCtx = document.getElementById('barChart').getContext('2d');

    // Destroy existing instances if any (to prevent hover glitches)
    if(pieChartInstance) pieChartInstance.destroy();
    if(barChartInstance) barChartInstance.destroy();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Space Grotesk', sans-serif";

    const chartData = {
        labels: ['Detected', 'Clean'],
        datasets: [{
            data: [malicious, clean],
            backgroundColor: ['#ff3366', '#00ff88'],
            borderColor: 'rgba(15, 23, 42, 0.8)',
            borderWidth: 2
        }]
    };

    pieChartInstance = new Chart(pieCtx, {
        type: 'doughnut',
        data: chartData,
        options: {
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    barChartInstance = new Chart(barCtx, {
        type: 'bar',
        data: chartData,
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
