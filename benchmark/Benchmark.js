const BenchmarkEngine = {
    scores: { cpu: 0, gpu: 0, ram: 0, storage: 0, browser: 0, ai: 0 },
    updateProgress: null,

    runAll: async function(progressCallback) {
        this.updateProgress = progressCallback;
        
        // Kita gunakan await berurutan, jika salah satu gagal/lama, tetap lanjut!
        await this.testCPU();
        await this.testGPU();
        await this.testRAM();
        await this.testStorage();
        await this.testBrowser();
        await this.testAI();

        return this.calculateTotal();
    },

    // FUNGSI BANTUAN: Mencegah stuck dengan maksimal waktu eksekusi (Timeout)
    withTimeout: function(promise, ms, testName) {
        return Promise.race([
            promise,
            new Promise((resolve) => {
                setTimeout(() => {
                    console.warn(`[Timeout] ${testName} memakan waktu terlalu lama (> ${ms}ms)`);
                    resolve(true); // Paksa selesai
                }, ms);
            })
        ]);
    },

    testCPU: async function() {
        this.updateProgress("Testing CPU (Multi-thread)...");
        const cpuTask = new Promise((resolve) => {
            const worker = new Worker('worker.js');
            worker.postMessage('start_cpu_test');
            worker.onmessage = (e) => {
                if (e.data.type === 'cpu_done') {
                    this.scores.cpu = e.data.score;
                    worker.terminate();
                    resolve();
                }
            };
        });
        // Maksimal CPU test berjalan 4 detik
        await this.withTimeout(cpuTask, 4000, "CPU Test"); 
    },

    testGPU: async function() {
        this.updateProgress("Testing GPU (WebGL)...");
        const gpuTask = new Promise((resolve) => {
            const canvas = document.getElementById('gpu-canvas');
            const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
            
            if (!gl) { 
                this.scores.gpu = 2000; 
                resolve(); return; 
            }

            let frames = 0;
            const startTime = performance.now();
            let isDone = false;
            
            function renderLoop() {
                if (isDone) return;
                
                gl.clearColor(Math.random(), 0.5, 0.5, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                frames++;
                
                // Berjalan HANYA selama 1 detik (1000ms) untuk mencegah freeze
                if (performance.now() - startTime < 1000) { 
                    requestAnimationFrame(renderLoop);
                } else {
                    isDone = true;
                    const fps = frames;
                    // Skor GPU disesuaikan dengan FPS
                    this.scores.gpu = Math.floor(fps * 2500); 
                    resolve();
                }
            }
            requestAnimationFrame(renderLoop);
        });
        
        // Maksimal GPU test berjalan 2.5 detik (jika requestAnimationFrame nyangkut)
        await this.withTimeout(gpuTask, 2500, "GPU Test");
    },

    testRAM: async function() {
        this.updateProgress("Testing RAM (Allocations)...");
        await new Promise(r => setTimeout(r, 100)); // Beri napas ke UI
        
        const start = performance.now();
        try {
            // Turunkan sedikit ukuran array agar HP tidak Force Close (dari 5MB ke 3MB)
            const size = 3 * 1024 * 1024; 
            let arr = new Float64Array(size);
            for(let i = 0; i < size; i += 8) arr[i] = Math.random();
            let sum = 0;
            for(let i = 0; i < size; i += 100) sum += arr[i];
            arr = null; // Bersihkan dari memori
        } catch(e) {
            console.error("RAM Test Error", e);
        }
        
        const duration = performance.now() - start;
        this.scores.ram = duration > 0 ? Math.floor(8000000 / duration) : 1000;
    },

    testStorage: async function() {
        this.updateProgress("Testing Storage (I/O)...");
        await new Promise(r => setTimeout(r, 100));
        
        const start = performance.now();
        try {
            const dummyData = "X".repeat(5000); // 5KB
            for(let i = 0; i < 300; i++) { // Turunkan dari 500 ke 300 iterasi
                localStorage.setItem('bench_test_' + i, dummyData);
            }
            for(let i = 0; i < 300; i++) {
                localStorage.getItem('bench_test_' + i);
                localStorage.removeItem('bench_test_' + i);
            }
        } catch(e) {
            console.error("Storage Test Error (Quota full?)", e);
        }
        
        const duration = performance.now() - start;
        this.scores.storage = duration > 0 ? Math.floor(4000000 / duration) : 1000;
    },

    testBrowser: async function() {
        this.updateProgress("Testing Browser (DOM)...");
        await new Promise(r => setTimeout(r, 100));

        const start = performance.now();
        try {
            const frag = document.createDocumentFragment();
            // Turunkan dari 5000 ke 2000 div agar HP tidak blank putih
            for(let i = 0; i < 2000; i++) {
                const div = document.createElement('div');
                div.style.width = '2px';
                div.style.height = '2px';
                div.className = 'test-node';
                frag.appendChild(div);
            }
            document.body.appendChild(frag);
            
            const nodes = document.querySelectorAll('.test-node');
            nodes.forEach(n => n.getBoundingClientRect()); // Paksa reflow
            nodes.forEach(n => n.remove());
        } catch(e) {
            console.error("Browser Test Error", e);
        }

        const duration = performance.now() - start;
        this.scores.browser = duration > 0 ? Math.floor(2000000 / duration) : 1000;
    },

    testAI: async function() {
        this.updateProgress("Testing AI (Neural Sim)...");
        await new Promise(r => setTimeout(r, 100));

        const start = performance.now();
        // Simulasi hitungan matriks neural network ringan
        const matrixSize = 200; 
        let img = new Float32Array(matrixSize * matrixSize).fill(255);
        
        for(let y = 1; y < matrixSize - 1; y++) {
            for(let x = 1; x < matrixSize - 1; x++) {
                let sum = (img[(y-1)*matrixSize + (x-1)] * -1) + (img[(y)*matrixSize + (x)] * 5); 
            }
        }
        
        const duration = performance.now() - start;
        this.scores.ai = duration > 0 ? Math.floor(6000000 / duration) : 1000;
    },

    calculateTotal: function() {
        // Mencegah skor Infinity atau NaN jika terjadi error
        Object.keys(this.scores).forEach(k => {
            if (!isFinite(this.scores[k]) || isNaN(this.scores[k])) this.scores[k] = 1000;
        });

        const finalScore = 
            (this.scores.cpu * 0.30) + 
            (this.scores.gpu * 0.30) + 
            (this.scores.ram * 0.15) + 
            (this.scores.storage * 0.10) + 
            (this.scores.browser * 0.10) + 
            (this.scores.ai * 0.05);

        return {
            details: this.scores,
            total: Math.floor(finalScore)
        };
    }
};
