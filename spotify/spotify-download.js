import express from 'express';
import cors from 'cors';
import { gotScraping } from 'got-scraping';

class SpotyLoaderDl {
  constructor() {
    this.baseUrl = 'https://spotyloader.com/api/spotify';
  }

  async request(endpoint, options = {}) {
    let attempts = 0;
    while (attempts < 3) {
      try {
        const response = await gotScraping({
          url: endpoint,
          method: options.method || 'GET',
          json: options.body,
          responseType: 'json',
          headerGeneratorOptions: {
            browsers: [{ name: 'chrome', minVersion: 120 }],
            devices: ['desktop'],
            locales: ['id-ID', 'en-US']
          }
        });
        return response.body;
      } catch (error) {
        const statusCode = error.response?.statusCode;
        if (statusCode === 429) {
          attempts++;
          console.log('\n[ Limit 429 ] Melewati batas request. Menunggu 60 detik...');
          await new Promise(resolve => setTimeout(resolve, 61000));
          continue;
        }
        throw new Error(`[${statusCode || 'NETWORK_ERROR'}] ${error.message}`);
      }
    }
    throw new Error('Gagal: Server masih menolak setelah beberapa kali percobaan.');
  }

  async getInfo(url) {
    const endpoint = `${this.baseUrl}/info?url=${encodeURIComponent(url)}`;
    return await this.request(endpoint, { method: 'GET' });
  }

  async requestDownloadJob(url, format = 'm4a') {
    const endpoint = `${this.baseUrl}/track`;
    return await this.request(endpoint, {
      method: 'POST',
      body: { url, format }
    });
  }

  async checkJobStatus(jobId) {
    const endpoint = `${this.baseUrl}/track/status/${jobId}`;
    return await this.request(endpoint, { method: 'GET' });
  }
  
  async download(url, format = 'm4a', pollInterval = 4000) {
    try {
      const info = await this.getInfo(url);
      const title = info.post.name || info.post.tracks?.[0]?.name;
      const artist = info.post.artist;
      
      const job = await this.requestDownloadJob(url, format);
      const jobId = job.jobId;

      let isReady = false;
      let downloadLink = null;

      while (!isReady) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        const statusRes = await this.checkJobStatus(jobId);

        if (statusRes.status === 'ready') {
          isReady = true;
          downloadLink = statusRes.downloadLink;
        } else if (statusRes.status === 'error') {
          throw new Error('Server gagal memproses lagu ini.');
        }
      }
      return downloadLink;
    } catch (error) {
      console.error(`\n[ Error ] ${error.message}`);
      return null;
    }
  }
}

// ==========================================
// SERVER EXPRESS UNTUK RENDER.COM
// ==========================================
const app = express();
const scraper = new SpotyLoaderDl();

// Izinkan akses dari Vercel / domain lain
app.use(cors());
app.use(express.json());

// Endpoint Download
app.post('/api/download', async (req, res) => {
    try {
        const { url, format } = req.body;
        if (!url) return res.status(400).json({ error: "URL is required" });
        
        console.log(`[Request] Mendownload: ${url} (${format})`);
        const downloadLink = await scraper.download(url, format || 'm4a');
        
        if (downloadLink) {
            res.json({ success: true, downloadLink });
        } else {
            res.status(500).json({ success: false, error: "Gagal mendapatkan link dari SpotyLoader" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint untuk mengecek apakah server hidup
app.get('/', (req, res) => {
    res.send('Engine Xaerisoft berjalan dengan baik!');
});

// PORT dinamis dari Render atau default 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[ Xaerisoft Engine ] Running on port ${PORT}`);
});
