// ── UPLOADED URL STORE ──
const uploadedUrls = { ttqc: null, iqcimg: null, musiccard: null };

// ── TABS ──
function switchTab(id, btn) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('panel-' + id).classList.add('active');
  btn.classList.add('active');
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── RESULT RENDER (API URL DIAMANKAN) ──
function showResult(id, blobUrl) {
  const box = document.getElementById('result-' + id);
  box.innerHTML = `
    <p class="result-label">— Hasil Generate</p>
    <div class="result-img-wrap">
      <!-- Menggunakan Blob URL (lokal), jadi URL API asli tersembunyi sepenuhnya dari Inspect Element -->
      <img src="${blobUrl}" alt="Generated Image" onerror="imgError('${id}')"/>
    </div>
    <div class="result-actions">
      <!-- Fungsi download langsung tembak ke memori lokal -->
      <button class="btn-dl" onclick="downloadImg('${blobUrl}', '${id}')">⬇ DOWNLOAD</button>
      <!-- Tombol COPY URL dihapus agar API tidak bocor ke publik -->
    </div>
  `;
  box.classList.add('show');
  box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function imgError(id) {
  showError(id, 'Gambar gagal dimuat. Cek koneksi atau parameter input.');
}

function showError(id, msg) {
  const e = document.getElementById('err-' + id);
  e.textContent = '⚠ ' + msg;
  e.classList.add('show');
  const box = document.getElementById('result-' + id);
  box.classList.remove('show');
}

function clearError(id) {
  const e = document.getElementById('err-' + id);
  if(e) e.classList.remove('show');
}

// ── DOWNLOAD ──
function downloadImg(blobUrl, id) {
  try {
    const a = document.createElement('a');
    a.href = blobUrl; // Download dari file lokal yang udah di fetch
    a.download = 'tools-' + id + '-' + Date.now() + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Download berhasil!');
  } catch(e) {
    showToast('Download gagal.');
  }
}

// ── BUILD URLS & GENERATE (FETCH SISTEM) ──
function encode(s) { return encodeURIComponent(s); }

// Menggunakan Async/Await biar nge-fetch gambar di background
async function generate(id) {
  clearError(id);
  let url = '';

  if (id === 'wmp1') {
    const text = document.getElementById('wmp1-text').value.trim();
    if (!text) return showToast('Isi teks terlebih dahulu!');
    url = `https://apii.nexadev.my.id/wmp1?text=${encode(text)}`;

  } else if (id === 'wmp2') {
    const text = document.getElementById('wmp2-text').value.trim();
    if (!text) return showToast('Isi teks terlebih dahulu!');
    url = `https://apii.nexadev.my.id/wmp2?text=${encode(text)}`;

  } else if (id === 'fakeff') {
    const usn = document.getElementById('fakeff-usn').value.trim();
    if (!usn) return showToast('Isi username terlebih dahulu!');
    url = `https://apii.nexadev.my.id/fakeff?usn=${encode(usn)}`;

  } else if (id === 'nokia') {
    const text  = document.getElementById('nokia-text').value.trim();
    const from  = document.getElementById('nokia-from').value.trim();
    const date  = document.getElementById('nokia-date').value.trim();
    const time  = document.getElementById('nokia-time').value.trim();
    const title = document.getElementById('nokia-title').value.trim();
    if (!text) return showToast('Isi pesan Nokia!');
    url = `https://apii.nexadev.my.id/nokia?text=${encode(text)}&from=${encode(from)}&date=${encode(date)}&time=${encode(time)}&title=${encode(title)}`;

  } else if (id === 'ttqc') {
    const imgUrl = uploadedUrls['ttqc'];
    const name   = document.getElementById('ttqc-name').value.trim();
    const text   = document.getElementById('ttqc-text').value.trim();
    if (!name || !text) return showToast('Isi nama dan teks!');
    url = `https://apii.nexadev.my.id/ttqc?url=${encode(imgUrl || '')}&name=${encode(name)}&text=${encode(text)}`;

  } else if (id === 'iqcimg') {
    const imgUrl = uploadedUrls['iqcimg'];
    const text   = document.getElementById('iqcimg-text').value.trim();
    const time   = document.getElementById('iqcimg-time').value.trim();
    if (!text) return showToast('Isi teks!');
    url = `https://apii.nexadev.my.id/iqc-dark?text=${encode(text)}&time=${encode(time)}&url=${encode(imgUrl || '')}`;

  } else if (id === 'musiccard') {
    const judul = document.getElementById('musiccard-judul').value.trim();
    const nama  = document.getElementById('musiccard-nama').value.trim();
    const imgUrl = uploadedUrls['musiccard'];
    if (!judul || !nama) return showToast('Isi judul dan nama artis!');
    url = `https://api.nexray.eu.cc/canvas/musiccard?judul=${encode(judul)}&nama=${encode(nama)}&image_url=${encode(imgUrl || '')}`;

  } else if (id === 'iqcdark') {
    const text = document.getElementById('iqcdark-text').value.trim();
    const time = document.getElementById('iqcdark-time').value.trim();
    if (!text) return showToast('Isi teks!');
    url = `https://apii.nexadev.my.id/iqc-dark?text=${encode(text)}&time=${encode(time)}`;
  }

  if (!url) return;

  // Tangkap event button untuk ngasih efek loading
  const btn = event ? event.currentTarget : null;
  if (btn) {
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span> GENERATING...';
  }

  try {
    // 1. Fetch gambar langsung sebagai Data mentah (Blob) di background
    const response = await fetch(url);
    if (!response.ok) throw new Error('API/Network Error');
    
    // 2. Ubah data mentah menjadi Blob Image
    const blob = await response.blob();
    
    // 3. Buat URL Sementara/Lokal (Format: blob:http://domainlu.com/xxx-xxx)
    const blobUrl = URL.createObjectURL(blob);

    if (btn) {
      btn.classList.remove('loading');
      btn.textContent = '⚡ GENERATE';
    }

    // 4. Tampilkan gambar pakai URL lokal. URL API bener-bener gak nyentuh HTML
    showResult(id, blobUrl);
    showToast('Gambar berhasil dibuat!');
  } catch (err) {
    if (btn) {
      btn.classList.remove('loading');
      btn.textContent = '⚡ GENERATE';
    }
    // Error biasanya karena API nge-block CORS. Pastikan API lu izinin aksesnya.
    showError(id, 'Gagal render gambar. Cek koneksi API.');
    showToast('Gagal memuat.');
  }
}

// ── DRAG & DROP UPLOAD (URL DIAMANKAN) ──
function onDragOver(e, id) {
  e.preventDefault();
  document.getElementById('drop-' + id).classList.add('dragover');
}

function onDragLeave(e, id) {
  document.getElementById('drop-' + id).classList.remove('dragover');
}

function onDrop(e, id) {
  e.preventDefault();
  document.getElementById('drop-' + id).classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(id, file);
}

function handleFile(id) {
  const input = document.getElementById('file-' + id);
  if (input.files[0]) uploadFile(id, input.files[0]);
}

function removeUpload(id) {
  uploadedUrls[id] = null;
  document.getElementById('preview-' + id).classList.remove('show');
  document.getElementById('file-' + id).value = '';
  document.getElementById('drop-' + id).style.display = '';
}

async function uploadFile(id, file) {
  const drop = document.getElementById('drop-' + id);
  const preview = document.getElementById('preview-' + id);
  const previewImg = document.getElementById('preview-img-' + id);
  const previewFname = document.getElementById('preview-fname-' + id);
  const previewUrl = document.getElementById('preview-url-' + id);

  // Local preview
  const reader = new FileReader();
  reader.onload = e => { previewImg.src = e.target.result; };
  reader.readAsDataURL(file);
  previewFname.textContent = file.name;
  previewUrl.textContent = 'Mengupload...';
  preview.classList.add('show');
  drop.style.display = 'none';

  // Upload to Nexa uploader
  try {
    const formData = new FormData();
    formData.append('files[]', file);
    const res = await fetch('https://api.nexadev.my.id/uploder/', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success && data.files && data.files[0] && data.files[0].url) {
      uploadedUrls[id] = data.files[0].url;
      // Menyembunyikan link API yang terekspos di bawah foto dengan pesan konfirmasi saja
      previewUrl.textContent = 'Upload Selesai ✔'; 
      showToast('Upload berhasil!');
    } else {
      throw new Error('Upload gagal');
    }
  } catch(err) {
    previewUrl.textContent = '⚠ Upload gagal — coba lagi.';
    uploadedUrls[id] = null;
    showToast('Upload gagal!');
  }
}
