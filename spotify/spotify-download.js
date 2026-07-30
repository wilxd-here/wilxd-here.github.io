/**
 * Name Scrape: SpotyLoaderDl
 * Type: ESM
 * Credits By Zx 
 * Note: Kalau Mau Di Share Minimal sumber gak di hapus 😹
 * 
 * Website Downloader: savenest.web.id
 *
**/

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
          json: options.body, // Jika POST, ini otomatis mengatur Content-Type ke application/json
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
  
   /**
   * @param {string} url - URL Spotify
   * @param {string} format - Format audio (m4a, mp3, flac)
   */
  async download(url, format = 'm4a', pollInterval = 4000) {
    try {
      console.log('1. Mengambil informasi lagu...');
      await new Promise(r => setTimeout(r, Math.random() * 1000 + 500)); 
      
      const info = await this.getInfo(url);
      
      const title = info.post.name || info.post.tracks?.[0]?.name;
      const artist = info.post.artist;
      console.log(`[ Info ] Ditemukan: ${title} - ${artist}`);

      console.log('2. Meminta server memproses lagu...');
      await new Promise(r => setTimeout(r, Math.random() * 1000 + 1000));

      const job = await this.requestDownloadJob(url, format);
      const jobId = job.jobId;
      console.log(`[ Job ] Job ID diterima: ${jobId}`);

      console.log('3. Menunggu proses konversi (polling)...');
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
        } else {
          process.stdout.write('.'); // Indikator loading
        }
      }

      console.log('\n[ Selesai ] Konversi berhasil!');
      console.log(`[ Link Unduhan ] : ${downloadLink}`);
      
      return downloadLink;

    } catch (error) {
      console.error(`\n[ Error ] ${error.message}`);
      return null;
    }
  }
}

// --- Cara Penggunaan ---
(async () => {
  const scraper = new SpotyLoaderDl();
  const spotifyUrl = 'https://open.spotify.com/track/3y8RcMPYG22fRnrOi4oFJ1'; 
  
  await scraper.download(spotifyUrl, 'm4a', 4000);
})();

