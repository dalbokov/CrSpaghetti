// ============================
// CUSTOM COIN PICKER MODULE
// ============================

const CustomPicker = {
    modal: null,
    searchInput: null,
    coinList: null,
    confirmBtn: null,
    selectedCoins: new Set(),
    allCoins: [],
    maxSelection: 10,

    init() {
        this.createModal();
        this.setupEventListeners();
    },

    createModal() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'custom-modal-overlay';
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            border-radius: 12px;
            width: 90%;
            max-width: 600px;
            max-height: 80vh;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        `;

        modalContent.innerHTML = `
            <div class="modal-header" style="
                padding: 20px;
                border-bottom: 1px solid #e9ecef;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <h3 style="margin: 0; color: #2c3e50;">Select Coins (Max ${this.maxSelection})</h3>
                <button id="close-modal" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #6c757d;
                    padding: 0;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            </div>
            
            <div class="modal-body" style="padding: 20px;">
                <div class="search-section" style="margin-bottom: 20px;">
                    <input type="text" id="coin-search" placeholder="Search coins..." style="
                        width: 100%;
                        padding: 12px;
                        border: 2px solid #e9ecef;
                        border-radius: 8px;
                        font-size: 14px;
                        transition: border-color 0.3s;
                    ">
                </div>
                
                <div class="selected-count" style="
                    margin-bottom: 15px;
                    font-size: 14px;
                    color: #6c757d;
                ">
                    Selected: <span id="selected-count">0</span>/${this.maxSelection}
                </div>
                
                <div id="coin-list" style="
                    max-height: 300px;
                    overflow-y: auto;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 10px;
                "></div>
            </div>
            
            <div class="modal-footer" style="
                padding: 20px;
                border-top: 1px solid #e9ecef;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            ">
                <button id="cancel-selection" style="
                    padding: 10px 20px;
                    border: 2px solid #e9ecef;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">Cancel</button>
                
                <button id="confirm-selection" style="
                    padding: 10px 20px;
                    border: 2px solid #3498db;
                    background: #3498db;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: all 0.3s;
                " disabled>Confirm Selection</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Store references
        this.modal = modalOverlay;
        this.searchInput = modalContent.querySelector('#coin-search');
        this.coinList = modalContent.querySelector('#coin-list');
        this.confirmBtn = modalContent.querySelector('#confirm-selection');
        this.selectedCountSpan = modalContent.querySelector('#selected-count');
    },

    setupEventListeners() {
        // Close modal events
        this.modal.querySelector('#close-modal').addEventListener('click', () => this.close());
        this.modal.querySelector('#cancel-selection').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Search input
        this.searchInput.addEventListener('input', (e) => {
            this.filterCoins(e.target.value);
        });

        // Confirm selection
        this.confirmBtn.addEventListener('click', () => this.confirmSelection());

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close();
            }
        });
    },

    async open() {
        // Load coins if not already loaded
        if (this.allCoins.length === 0) {
            await this.loadCoins();
        }

        // Reset selection
        this.selectedCoins.clear();
        this.searchInput.value = '';
        this.updateSelectedCount();
        this.renderCoins();

        // Show modal
        this.modal.style.display = 'flex';
        this.searchInput.focus();
    },

    close() {
        this.modal.style.display = 'none';
        this.selectedCoins.clear();
        this.searchInput.value = '';
    },

    async loadCoins() {
        try {
            // Show loading state
            this.coinList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading coins...</div>';

            // Fetch top 500 coins for selection
            const coins = await API.getTopCoins(500);
            
            // Filter out stablecoins
            this.allCoins = coins.filter(coin => !this.isStableCoin(coin));
            
            this.renderCoins();
        } catch (error) {
            console.error('Error loading coins:', error);
            this.coinList.innerHTML = '<div style="text-align: center; padding: 20px; color: #e74c3c;">Error loading coins. Please try again.</div>';
        }
    },

    isStableCoin(coin) {
        const stableCoinPatterns = [
            'usdt', 'usdc', 'busd', 'dai', 'tusd', 'usdp', 'usdn', 'fei',
            'frax', 'lusd', 'susd', 'cusd', 'dusd', 'husd', 'gusd', 'ustc',
            'terra-usd', 'tether', 'usd-coin', 'binance-usd', 'true-usd',
            'paxos-standard', 'neutrino', 'fei-protocol', 'frax-protocol'
        ];
        
        const name = coin.name.toLowerCase();
        const id = coin.id.toLowerCase();
        const symbol = coin.symbol.toLowerCase();
        
        return stableCoinPatterns.some(pattern => 
            name.includes(pattern) || id.includes(pattern) || symbol.includes(pattern)
        ) || name.includes('usd') || symbol.includes('usd');
    },

    renderCoins(filteredCoins = null) {
        const coinsToRender = filteredCoins || this.allCoins;
        
        if (coinsToRender.length === 0) {
            this.coinList.innerHTML = '<div style="text-align: center; padding: 20px; color: #6c757d;">No coins found</div>';
            return;
        }

        this.coinList.innerHTML = coinsToRender.map(coin => `
            <div class="coin-option" style="
                display: flex;
                align-items: center;
                padding: 10px;
                border-bottom: 1px solid #f8f9fa;
                cursor: pointer;
                transition: background-color 0.3s;
            " data-coin-id="${coin.id}">
                <input type="checkbox" 
                       id="coin-${coin.id}" 
                       style="margin-right: 10px;" 
                       ${this.selectedCoins.has(coin.id) ? 'checked' : ''}
                       ${this.selectedCoins.size >= this.maxSelection && !this.selectedCoins.has(coin.id) ? 'disabled' : ''}>
                <label for="coin-${coin.id}" style="
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    flex: 1;
                    gap: 10px;
                ">
                    <div style="
                        width: 24px;
                        height: 24px;
                        background: ${coin.image ? `url(${coin.image})` : '#e9ecef'};
                        background-size: cover;
                        border-radius: 50%;
                        flex-shrink: 0;
                    "></div>
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: #2c3e50;">
                            ${coin.name}
                        </div>
                        <div style="font-size: 12px; color: #6c757d;">
                            ${coin.symbol.toUpperCase()} • #${coin.market_cap_rank || 'N/A'}
                        </div>
                    </div>
                    <div style="
                        font-size: 12px;
                        color: #6c757d;
                        text-align: right;
                    ">
                        ${coin.current_price ? '$' + coin.current_price.toLocaleString() : 'N/A'}
                    </div>
                </label>
            </div>
        `).join('');

        // Add click event listeners
        this.coinList.querySelectorAll('.coin-option').forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            const coinId = option.dataset.coinId;

            option.addEventListener('click', (e) => {
                if (e.target.type !== 'checkbox') {
                    checkbox.click();
                }
            });

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (this.selectedCoins.size < this.maxSelection) {
                        this.selectedCoins.add(coinId);
                    } else {
                        e.target.checked = false;
                        return;
                    }
                } else {
                    this.selectedCoins.delete(coinId);
                }
                
                this.updateSelectedCount();
                this.updateCheckboxStates();
            });
        });

        // Add hover effects
        this.coinList.querySelectorAll('.coin-option').forEach(option => {
            option.addEventListener('mouseenter', () => {
                option.style.backgroundColor = '#f8f9fa';
            });
            option.addEventListener('mouseleave', () => {
                option.style.backgroundColor = '';
            });
        });
    },

    filterCoins(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderCoins();
            return;
        }

        const term = searchTerm.toLowerCase();
        const filtered = this.allCoins.filter(coin => 
            coin.name.toLowerCase().includes(term) || 
            coin.symbol.toLowerCase().includes(term)
        );

        this.renderCoins(filtered);
    },

    updateSelectedCount() {
        this.selectedCountSpan.textContent = this.selectedCoins.size;
        this.confirmBtn.disabled = this.selectedCoins.size === 0;
        
        // Update button appearance
        if (this.selectedCoins.size === 0) {
            this.confirmBtn.style.opacity = '0.5';
            this.confirmBtn.style.cursor = 'not-allowed';
        } else {
            this.confirmBtn.style.opacity = '1';
            this.confirmBtn.style.cursor = 'pointer';
        }
    },

    updateCheckboxStates() {
        this.coinList.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            const coinId = checkbox.id.replace('coin-', '');
            checkbox.disabled = this.selectedCoins.size >= this.maxSelection && !this.selectedCoins.has(coinId);
        });
    },

    confirmSelection() {
        if (this.selectedCoins.size === 0) return;

        // Get selected coin objects
        const selectedCoinObjects = this.allCoins.filter(coin => 
            this.selectedCoins.has(coin.id)
        );

        // Update app state
        AppState.currentMethod = 'custom';
        AppState.customCoins = selectedCoinObjects;

        // Update method tabs UI
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('[data-method="custom"]')?.classList.add('active');

        // Update controls visibility
        Controls.toggleMethodControls('custom');

        // Update chart
        Chart.updateData();

        // Close modal
        this.close();
    }
};