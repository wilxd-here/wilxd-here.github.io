document.addEventListener("DOMContentLoaded", async () => {
    // Init Device Info
    await DeviceDetector.render('device-info');

    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('status-text');
    const progressCircle = document.querySelector('.progress-value');
    
    // Progress calculation variables
    const circumference = 2 * Math.PI * 90; // 565.48
    let currentStep = 0;
    const totalSteps = 6;

    function setProgress(percent, text) {
        const offset = circumference - (percent / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
        statusText.innerText = text;
    }

    function getRank(score) {
        if (score < 30000) return "🥉 Basic\nmain pou ajaa 😹✌️";
        if (score < 80000) return "🥈 Good\nlumayann lahh 🤓";
        if (score < 150000) return "🥇 Excellent\nloginn ML bangg 😎";
        if (score < 250000) return "💎 Flagship\nsiap menampung Genshin 🔥";
        return "🚀 OP\ngacorr... infokan game berat 💀";
    }

    function animateScore(targetValue, elementId) {
        const el = document.getElementById(elementId);
        let start = 0;
        const duration = 2000;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const easeOut = progress * (2 - progress);
            const current = Math.floor(easeOut * targetValue);
            el.innerText = current.toLocaleString('id-ID');
            
            if (progress < 1) requestAnimationFrame(update);
            else el.innerText = targetValue.toLocaleString('id-ID');
        }
        requestAnimationFrame(update);
    }

    startBtn.addEventListener('click', async () => {
        startBtn.disabled = true;
        document.getElementById('results').classList.add('hidden');
        currentStep = 0;
        setProgress(0, "Mulai...");

        const result = await BenchmarkEngine.runAll((status) => {
            currentStep++;
            const percent = (currentStep / totalSteps) * 100;
            setProgress(percent, Math.round(percent) + "%");
            statusText.style.fontSize = "1rem";
            statusText.innerText = status;
        });

        // Finish
        setProgress(100, "Selesai!");
        setTimeout(() => {
            document.querySelector('.benchmark-ui').classList.add('hidden');
            document.getElementById('results').classList.remove('hidden');
            
            // Populate Details
            animateScore(result.total, 'final-score');
            animateScore(result.details.cpu, 'score-cpu');
            animateScore(result.details.gpu, 'score-gpu');
            animateScore(result.details.ram, 'score-ram');
            animateScore(result.details.storage, 'score-storage');
            animateScore(result.details.browser, 'score-browser');
            animateScore(result.details.ai, 'score-ai');

            // Set Rank
            document.getElementById('rank-badge').innerText = getRank(result.total);

            // Confetti
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.6 },
                colors: ['#00ffcc', '#ffffff', '#20134e']
            });
            
            // Play success sound
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.1);
            } catch(e) {}
            
        }, 500);
    });
});
