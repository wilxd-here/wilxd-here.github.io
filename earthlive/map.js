const MapEngine = {
    map: null,
    layers: {},
    currentTileLayer: null,
    currentStyle: 'dark', // Status default
    tileProviders: {
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
        satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        terrain: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
    },

    init() {
        // Inisialisasi Peta
        this.map = L.map('map-container', {
            zoomControl: false,
            preferCanvas: true,
            wheelDebounceTime: 150
        }).setView([-2.5, 118], 5); // Tampilan awal: Seluruh Indonesia

        // Load visual peta default
        this.setMapStyle('dark');

        // Setup Layer Group per mode
        this.layers = {
            // LAYER PESAWAT (Menggunakan Cluster)
            flight: L.markerClusterGroup({
                maxClusterRadius: 45,
                disableClusteringAtZoom: 11, 
                spiderfyOnMaxZoom: true,
                showCoverageOnHover: false
            }).addTo(this.map),
            
            // LAYER CUACA
            weather: L.layerGroup()
        };

        this.listenToModeChanges();
    },

    // 🗺 ENGINE PERGANTIAN PETA
    setMapStyle(styleName) {
        if (this.currentTileLayer) {
            this.map.removeLayer(this.currentTileLayer);
        }
        
        const url = this.tileProviders[styleName] || this.tileProviders.dark;
        
        this.currentTileLayer = L.tileLayer(url, {
            attribution: '&copy; XAERISOFT LIVE',
            subdomains: styleName === 'dark' || styleName === 'light' ? 'abcd' : 'abc',
            maxZoom: styleName === 'satellite' ? 18 : 19
        }).addTo(this.map);
        
        this.currentStyle = styleName;
    },

    // 📍 GPS LOCATOR ENGINE
    locateUser() {
        this.map.locate({ setView: true, maxZoom: 13 });
        
        this.map.once('locationfound', (e) => {
            const radius = e.accuracy / 2;
            
            // Lingkaran Akurasi GPS (Neon Purple)
            L.circle(e.latlng, radius, {
                color: 'var(--neon-purple)',
                fillColor: 'var(--neon-purple)',
                fillOpacity: 0.15,
                weight: 1
            }).addTo(this.map);

            // Marker User Khusus dengan Animasi Denyut Nadi (Pulse)
            L.marker(e.latlng, {
                icon: L.divIcon({
                    html: `<div class="user-gps-pulse"></div>`,
                    className: 'gps-marker-container',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(this.map)
              .bindTooltip("Kamu di Sini!", { permanent: false, direction: 'top' })
              .openTooltip();
        });

        this.map.once('locationerror', (e) => {
            alert(`Akses lokasi gagal: ${e.message}`);
        });
    },

    listenToModeChanges() {
        window.addEventListener('xaerisoft:modeChange', (e) => {
            const activeMode = e.detail;
            Object.values(this.layers).forEach(layer => this.map.removeLayer(layer));
            this.map.addLayer(this.layers[activeMode]);
        });
    },

    getLayer(mode) {
        return this.layers[mode];
    }
};
