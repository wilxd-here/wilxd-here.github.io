document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    // DOM Elements
    const tabs = document.querySelectorAll('.tab-btn');
    const formatBtns = document.querySelectorAll('.format-btn');
    const inputUrl = document.getElementById('url-input');
    const btnPaste = document.getElementById('btn-paste');
    const btnStart = document.getElementById('btn-start');
    const resultArea = document.getElementById('result-area');

    let currentFormat = 'm4a';

    // 1. Tab Switching Logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            inputUrl.placeholder = `Tempel link ${tab.dataset.type} di sini...`;
        });
    });

    // 2. Format Selection Logic
    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => {
                b.classList.remove('active');
                b.style.color = 'var(--text-primary)';
            });
            btn.classList.add('active');
            btn.style.color = '#000'; // Make text black on active green background
            currentFormat = btn.dataset.format;
        });
    });

    // 3. Paste Button Logic (Clipboard API)
    btnPaste.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputUrl.value = text;
        } catch (err) {
            alert('Gagal mengakses clipboard. Silakan tempel secara manual.');
        }
    });

    // 4. Start Download Logic
    btnStart.addEventListener('click', async () => {
        const url = inputUrl.value.trim();
        if (!url) {
            alert('Mohon masukkan URL terlebih dahulu!');
            return;
        }

        // Setup Loading State
        const originalBtnHtml = btnStart.innerHTML;
        btnStart.innerHTML = `<i data-lucide="loader" class="spin"></i> Memproses...`;
        btnStart.style.pointerEvents = 'none';
        lucide.createIcons();
        
        resultArea.classList.remove('hidden');
        resultArea.innerHTML = `<p style="color: var(--accent-primary);">Menginisialisasi Engine Xaerisoft...</p>`;

        try {
            // GANTI DENGAN KODE INI:
// Ganti 'https://xaerisoft-engine.onrender.com' dengan URL asli dari Render kamu
const response = await fetch('https://xaerisoft-engine.onrender.com/api/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: url, format: currentFormat })
});
            const data = await response.json();

            if (data.success && data.downloadLink) {
                // Tampilkan sukses di area hasil
                resultArea.innerHTML = `
                    <div style="color: #1ED760; margin-bottom: 15px;">
                        <i data-lucide="check-circle" style="width: 48px; height: 48px;"></i>
                    </div>
                    <h3 class="result-title">Konversi Berhasil!</h3>
                    <p class="result-artist" style="margin-bottom: 15px;">File siap diunduh.</p>
                    <a href="${data.downloadLink}" target="_blank" class="btn-primary" style="text-decoration: none;">
                        <i data-lucide="download-cloud"></i> Unduh File Sekarang
                    </a>
                `;
                lucide.createIcons();
            } else {
                throw new Error("Gagal memproses tautan.");
            }

        } catch (error) {
            console.error(error);
            resultArea.innerHTML = `
                <div style="color: #ff4d4d; margin-bottom: 15px;">
                    <i data-lucide="x-circle" style="width: 48px; height: 48px;"></i>
                </div>
                <h3 class="result-title" style="color: #ff4d4d;">Terjadi Kesalahan</h3>
                <p class="result-artist">Silakan periksa tautan atau coba beberapa saat lagi.</p>
            `;
            lucide.createIcons();
        } finally {
            // Restore Button
            btnStart.innerHTML = originalBtnHtml;
            btnStart.style.pointerEvents = 'auto';
            lucide.createIcons();
        }
    });
});
