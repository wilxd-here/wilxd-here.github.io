const SearchController = {
    init() {
        const searchInput = document.getElementById('global-search');
        // Debounce input to prevent UI freezing
        searchInput.addEventListener('input', this.debounce((e) => {
            this.handleSearch(e.target.value);
        }, 300), { passive: true });
    },

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    handleSearch(query) {
        if (query.length < 2) return;
        console.log(`[Search] Resolving query for: ${query}`);
        // Arsitektur API-ready
        // fetch(`/api/search?q=${query}`).then(res => res.json()).then(data => {...})
    }
};
