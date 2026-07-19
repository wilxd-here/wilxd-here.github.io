self.onmessage = function(e) {
    if (e.data === 'start_cpu_test') {
        const start = performance.now();
        
        // 1. Prime Number Generator (Integer Math) - Diturunkan dari 100k ke 60k
        let primes = 0;
        for (let i = 2; i < 60000; i++) {
            let isPrime = true;
            for (let j = 2; j <= Math.sqrt(i); j++) {
                if (i % j === 0) { isPrime = false; break; }
            }
            if (isPrime) primes++;
        }

        // 2. Matrix Simulation (Float Math) - Diturunkan ukurannya jadi 200
        const size = 200;
        let matrix = new Float32Array(size * size);
        for(let i=0; i<size*size; i++) matrix[i] = Math.random();
        
        for(let i=0; i<size; i++) {
            for(let j=0; j<size; j++) {
                matrix[i * size + j] *= 1.0001; 
            }
        }

        const end = performance.now();
        const duration = end - start;
        
        // Pastikan tidak bagi dengan nol
        let finalDuration = duration > 0 ? duration : 1;
        
        // Kalkulasi skor
        const score = Math.floor(40000000 / finalDuration);
        
        self.postMessage({ type: 'cpu_done', score: score });
    }
};
