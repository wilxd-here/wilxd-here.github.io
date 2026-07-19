const FlightMode = {
    aircrafts: new Map(),
    layer: null,
    updateInterval: null,
    
    init() {
        this.layer = MapEngine.getLayer('flight');
        this.fetchRealFlights();
        
        // Update data otomatis tiap 30 detik
        this.updateInterval = setInterval(() => this.fetchRealFlights(), 30000);
    },

    async fetchRealFlights() {
        try {
            console.log("[Flight] Mencoba mengambil data Live Radar asli...");
            
            // Mengambil data khusus area Indonesia & ASEAN agar API gratis OpenSky tidak error (Tanpa API Key!)
            const response = await fetch('https://opensky-network.org/api/states/all?lamin=-15&lomin=90&lamax=15&lomax=140');
            
            if (!response.ok) throw new Error('API OpenSky sedang limit/sibuk');
            
            const data = await response.json();
            
            if (data && data.states) {
                this.layer.clearLayers();
                this.aircrafts.clear();
                const markersToCluster = [];

                for (let i = 0; i < data.states.length; i++) {
                    const flight = data.states[i];
                    const lat = flight[6];
                    const lng = flight[5];

                    if (lat && lng) {
                        const marker = this.createMarker({
                            id: flight[0],
                            flightNo: flight[1] ? flight[1].trim() : 'UNKNOWN',
                            type: 'Live Aircraft',
                            lat: lat,
                            lng: lng,
                            heading: flight[10] || 0,
                            alt: flight[7] ? Math.round(flight[7] * 3.28084) : 0,
                            speed: flight[9] ? Math.round(flight[9] * 1.94384) : 0,
                            origin: flight[2],
                            dest: 'Live Tracking'
                        });
                        markersToCluster.push(marker);
                    }
                }
                
                // Memasukkan array secara massal ke dalam sistem MarkerCluster
                this.layer.addLayers(markersToCluster);
                console.log(`[Flight] Berhasil memuat ${markersToCluster.length} pesawat asli.`);
            }
        } catch (error) {
            console.warn("[Flight] OpenSky API menolak request karena rate-limit. Menjalankan radar global simulasi...");
            // Kalau gagal API, kita sebar 500 pesawat ke seluruh dunia sebagai cadangan!
            this.generateSimulatedGlobalFlights(500);
        }
    },

    // 🌍 PENGGANTI JIKA INTERNET MATI / API SIBUK
    generateSimulatedGlobalFlights(count) {
        this.layer.clearLayers();
        this.aircrafts.clear();
        const markersToCluster = [];

        const airlines = ['Garuda Indonesia', 'Emirates', 'Qatar Airways', 'Singapore Airlines', 'ANA', 'Cathay Pacific'];

        for (let i = 0; i < count; i++) {
            const randomLat = (Math.random() * 140) - 70; 
            const randomLng = (Math.random() * 360) - 180;
            const randomHeading = Math.floor(Math.random() * 360);
            const randomSpeed = Math.floor(Math.random() * 300) + 200; 

            const marker = this.createMarker({
                id: `SIM-FLIGHT-${i}`,
                flightNo: `${airlines[Math.floor(Math.random() * airlines.length)]} ${Math.floor(Math.random() * 999)}`,
                type: 'Boeing 777 / A350',
                lat: randomLat,
                lng: randomLng,
                heading: randomHeading,
                alt: 35000,
                speed: randomSpeed,
                origin: 'Global',
                dest: 'In Transit'
            });

            markersToCluster.push(marker);
        }

        this.layer.addLayers(markersToCluster);
        console.log(`[Flight] Berhasil menyebar ${count} pesawat simulasi di seluruh dunia.`);
    },

    createMarker(data) {
        const icon = L.divIcon({
            html: `<div class="custom-marker" style="transform: rotate(${data.heading}deg); font-size: 24px; color: var(--neon-purple);">✈</div>`,
            className: 'flight-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const marker = L.marker([data.lat, data.lng], { icon });
        
        marker.on('click', () => {
            UI.openBottomSheet({
                Callsign: data.flightNo,
                Country: data.origin,
                Altitude: `${data.alt} ft`,
                Speed: `${data.speed} kts`,
                Status: 'In Air',
                Type: data.type
            });
        });

        this.aircrafts.set(data.id, { marker, data });
        return marker; // Harus di-return agar ditangkap oleh markersToCluster
    }
};
