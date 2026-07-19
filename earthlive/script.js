// XAERISOFT LIVE - Main Application Entry Point

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Core UI & Search
    UI.init();
    SearchController.init();

    // 2. Initialize Map Engine
    MapEngine.init();

    // 3. Initialize Modes (ShipMode dihapus)
    FlightMode.init();
    WeatherMode.init();

    // 4. Register PWA Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').then(reg => {
                console.log('[PWA] ServiceWorker registered with scope:', reg.scope);
            }).catch(err => {
                console.warn('[PWA] ServiceWorker registration failed:', err);
            });
        });
    }

    console.log("🌍 XAERISOFT LIVE Initialized Successfully.");
});
