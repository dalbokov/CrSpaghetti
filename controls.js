// ============================
// CONTROLS MODULE
// ============================

const Controls = {
    init() {
        this.setupMethodTabs();
        this.setupTimeButtons();
        this.setupDropdowns();
        this.setupCustomButton();
        this.setupActionButtons();
    },

    setupMethodTabs() {
        const tabs = document.querySelectorAll('.method-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Update app state
                AppState.currentMethod = e.target.dataset.method;
                
                // Toggle visibility of method-specific controls
                this.toggleMethodControls(AppState.currentMethod);
                
                // Update chart data
                Chart.updateData();
            });
        });
    },

    setupTimeButtons() {
        const buttons = document.querySelectorAll('.time-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                buttons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                // Update app state
                AppState.currentPeriod = parseInt(e.target.dataset.period);
                
                // Update chart data
                Chart.updateData();
            });
        });
    },

    setupDropdowns() {
        // Coins count dropdown
        const coinsCountDropdown = document.getElementById('coins-count');
        if (coinsCountDropdown) {
            coinsCountDropdown.addEventListener('change', (e) => {
                AppState.currentCoins = parseInt(e.target.value);
                Chart.updateData();
            });
        }

        // Market cap dropdown
        const marketCapDropdown = document.getElementById('market-cap');
        if (marketCapDropdown) {
            marketCapDropdown.addEventListener('change', (e) => {
                AppState.currentMarketCap = parseInt(e.target.value);
                Chart.updateData();
            });
        }

        // Category dropdown
        const categoryDropdown = document.getElementById('category');
        if (categoryDropdown) {
            categoryDropdown.addEventListener('change', (e) => {
                AppState.currentCategory = e.target.value;
                Chart.updateData();
            });
        }
    },

    setupCustomButton() {
        const customBtn = document.getElementById('custom-select');
        if (customBtn) {
            customBtn.addEventListener('click', () => {
                CustomPicker.open();
            });
        }
    },

    setupActionButtons() {
        // Export chart button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportChart();
            });
        }

        // Share URL button
        const shareBtn = document.getElementById('share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => {
                this.shareURL();
            });
        }

        // Embed code button
        const embedBtn = document.getElementById('embed-btn');
        if (embedBtn) {
            embedBtn.addEventListener('click', () => {
                this.showEmbedCode();
            });
        }

        // Alert button
        const alertBtn = document.getElementById('alert-btn');
        if (alertBtn) {
            alertBtn.addEventListener('click', () => {
                this.showAlert();
            });
        }
    },

    toggleMethodControls(method) {
        const marketCapGroup = document.getElementById('market-cap-group');
        const categoryGroup = document.getElementById('category-group');

        if (method === 'market-cap') {
            marketCapGroup.style.display = 'flex';
            categoryGroup.style.display = 'none';
        } else if (method === 'category') {
            marketCapGroup.style.display = 'none';
            categoryGroup.style.display = 'flex';
        } else {
            // For custom method, hide both
            marketCapGroup.style.display = 'none';
            categoryGroup.style.display = 'none';
        }
    },

    exportChart() {
        if (AppState.chartInstance) {
            const link = document.createElement('a');
            link.download = `crypto-comparison-${Date.now()}.png`;
            link.href = AppState.chartInstance.toBase64Image();
            link.click();
        }
    },

    shareURL() {
        const currentState = {
            method: AppState.currentMethod,
            period: AppState.currentPeriod,
            coins: AppState.currentCoins,
            marketCap: AppState.currentMarketCap,
            category: AppState.currentCategory,
            customCoins: AppState.customCoins.map(c => c.id)
        };

        const url = new URL(window.location.href);
        url.searchParams.set('state', btoa(JSON.stringify(currentState)));

        navigator.clipboard.writeText(url.toString()).then(() => {
            alert('URL copied to clipboard!');
        }).catch(() => {
            prompt('Copy this URL:', url.toString());
        });
    },

    showEmbedCode() {
        const embedCode = `<iframe src="${window.location.href}" width="100%" height="600" frameborder="0"></iframe>`;
        prompt('Copy this embed code:', embedCode);
    },

    showAlert() {
        alert('Price alerts feature coming soon!');
    },

    // Load state from URL if present
    loadStateFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const stateParam = urlParams.get('state');
        
        if (stateParam) {
            try {
                const state = JSON.parse(atob(stateParam));
                
                // Update app state
                AppState.currentMethod = state.method || 'market-cap';
                AppState.currentPeriod = state.period || 30;
                AppState.currentCoins = state.coins || 10;
                AppState.currentMarketCap = state.marketCap || 100;
                AppState.currentCategory = state.category || 'l1s';
                
                // Update UI elements
                this.updateUIFromState();
                
                // If custom coins, load them
                if (state.customCoins && state.customCoins.length > 0) {
                    // This would need to be implemented to restore custom coin selection
                    console.log('Custom coins to restore:', state.customCoins);
                }
                
            } catch (error) {
                console.error('Error loading state from URL:', error);
            }
        }
    },

    updateUIFromState() {
        // Update method tabs
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.method === AppState.currentMethod) {
                tab.classList.add('active');
            }
        });

        // Update time buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
            if (parseInt(btn.dataset.period) === AppState.currentPeriod) {
                btn.classList.add('active');
            }
        });

        // Update dropdowns
        const coinsCountDropdown = document.getElementById('coins-count');
        if (coinsCountDropdown) {
            coinsCountDropdown.value = AppState.currentCoins;
        }

        const marketCapDropdown = document.getElementById('market-cap');
        if (marketCapDropdown) {
            marketCapDropdown.value = AppState.currentMarketCap;
        }

        const categoryDropdown = document.getElementById('category');
        if (categoryDropdown) {
            categoryDropdown.value = AppState.currentCategory;
        }

        // Toggle method controls
        this.toggleMethodControls(AppState.currentMethod);
    }
};