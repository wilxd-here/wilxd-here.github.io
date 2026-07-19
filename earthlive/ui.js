const FlightMode = {
    aircrafts: new Map(),
    layer: null,
    updateInterval: null,
    
    init() {
        this.layer = MapEngine.getLayer('flight');
        // Panggil data asli saat pertama kali dibuka
        this.fetchRealFlights();
        
        // Update data secara otomatis setiap 30 detik
        this.updateInterval = setInterval(() => this.fetchRealFlights(), 30000);
    },

    async fetchRealFlights() {
        try {
            console.log("[Flight] Fetching real live radar data...");
            // Mengambil data dari OpenSky Network
            // Dibatasi untuk area Asia Tenggara & Indonesia agar HP tidak lag me-render 15,000 pesawat sekaligus
            const response = await fetch('https://opensky-network.org/api/states/all?lamin=-15&lomin=90&lamax=15&lomax=140');
            
            if (!response.ok) throw new Error('API Sedang sibuk / Rate limit');
            
            const data = await response.json();
            
            if (data && data.states) {
                // Bersihkan pesawat lama sebelum menaruh posisi yang baru
                this.layer.clearLayers();
                this.aircrafts.clear();

                // Looping ratusan data pesawat dari API
                data.states.forEach(flight => {
                    const id = flight[0];
                    const callsign = flight[1] ? flight[1].trim() : 'UNKNOWN';
                    const origin = flight[2];
                    const lng = flight[5];
                    const lat = flight[6];
                    const altMeters = flight[7];
                    const speedMs = flight[9];
                    const heading = flight[10] || 0;

                    // Konversi ke standar penerbangan (Feet dan Knots)
                    const altFeet = altMeters ? Math.round(altMeters * 3.28084) : 0;
                    const speedKnots = speedMs ? Math.round(speedMs * 1.94384) : 0;

                    // Jika pesawat punya kordinat valid, gambar di peta
                    if (lat && lng) {
                        this.createMarker({
                            id: id,
                            flightNo: callsign || 'N/A',
                            type: 'Live Aircraft',
                            lat: lat,
                            lng: lng,
                            heading: heading,
                            alt: altFeet,
                            speed: speedKnots,
                            origin: origin,
                            dest: 'Live Tracking'
                        });
                    }
                });
                console.log(`[Flight] Berhasil memuat ${data.states.length} pesawat asli.`);
            }
        } catch (error) {
            console.warn("Gagal mengambil data asli. Server API OpenSky mungkin sedang sibuk. Menggunakan data simulasi...", error);
            // Fallback: Jika internet mati atau API limit, kembalikan 2 pesawat simulasi
            this.simulateLiveData();
        }
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
        marker.addTo(this.layer);
    },

    simulateLiveData() {
        this.layer.clearLayers();
        this.createMarker({ id: 1, flightNo: 'XA01', type: 'B777', lat: -6.1, lng: 106.8, heading: 45, alt: 35000, speed: 480, origin: 'CGK', dest: 'HND' });
        this.createMarker({ id: 2, flightNo: 'XA02', type: 'A350', lat: 1.3, lng: 103.8, heading: 120, alt: 32000, speed: 460, origin: 'SIN', dest: 'SYD' });
    }
};
