// Legend component for cryptocurrency chart
const Legend = {
    container: null,
    currentCoins: [],
    
    // Initialize legend
    init: (containerId) => {
        Legend.container = document.getElementById(containerId);
        if (!Legend.container) {
            console.error('Legend container not found:', containerId);
            return false;
        }
        return true;
    },

    // Update legend with coin data
    update: (coinData, chartSeries) => {
        if (!Legend.container) {
            console.error('Legend not initialized');
            return;
        }

        if (!coinData || !Array.isArray(coinData) || coinData.length === 0) {
            Legend.clear();
            return;
        }

        Legend.currentCoins = coinData;
        Legend.render(chartSeries);
    },

    // Render legend items
    render: (chartSeries) => {
        const legendItems = Legend.currentCoins.map((coin, index) => {
            const series = chartSeries?.find(s => s.id === coin.id);
            const color = series?.color || CONFIG.UTILS.getColorForRank(index + 1, Legend.currentCoins.length);
            const performance = series?.performance || 0;
            
            return Legend.createLegendItem(coin, color, performance, index);
        });

        Legend.container.innerHTML = `
            <div class="legend-header">
                <h3>Cryptocurrencies</h3>
                <span class="legend-count">${legendItems.length} coins</span>
            </div>
            <div class="legend-items">
                ${legendItems.join('')}
            </div>
        `;

        // Add event listeners
        Legend.addEventListeners();
    },

    // Create individual legend item
    createLegendItem: (coin, color, performance, index) => {
        const performanceClass = performance > 0 ? 'positive' : performance < 0 ? 'negative' : 'neutral';
        const rank = index + 1;
        
        return `
            <div class="legend-item" data-coin-id="${coin.id}">
                <div class="legend-item-left">
                    <span class="legend-rank">#${rank}</span>
                    <div class="legend-color" style="background-color: ${color}"></div>
                    <div class="legend-info">
                        <div class="legend-name">${coin.name}</div>
                        <div class="legend-symbol">${coin.symbol.toUpperCase()}</div>
                    </div>
                </div>
                <div class="legend-item-right">
                    <div class="legend-price">${Utils.formatCurrency(coin.current_price)}</div>
                    <div class="legend-performance ${performanceClass}">
                        ${Utils.formatPercent(performance)}
                    </div>
                    <div class="legend-market-cap">
                        MC: ${Utils.formatNumber(coin.market_cap)}
                    </div>
                </div>
                <div class="legend-actions">
                    <button class="legend-toggle" data-coin-id="${coin.id}" title="Toggle visibility">
                        <span class="toggle-icon">👁️</span>
                    </button>
                    <button class="legend-remove" data-coin-id="${coin.id}" title="Remove from chart">
                        <span class="remove-icon">✕</span>
                    </button>
                </div>
            </div>
        `;
    },

    // Add event listeners to legend items
    addEventListeners: () => {
        // Toggle visibility buttons
        const toggleButtons = Legend.container.querySelectorAll('.legend-toggle');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const coinId = button.dataset.coinId;
                Legend.toggleCoinVisibility(coinId);
            });
        });

        // Remove buttons
        const removeButtons = Legend.container.querySelectorAll('.legend-remove');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const coinId = button.dataset.coinId;
                Legend.removeCoin(coinId);
            });
        });

        // Legend item click (highlight)
        const legendItems = Legend.container.querySelectorAll('.legend-item');
        legendItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.legend-actions')) return;
                const coinId = item.dataset.coinId;
                Legend.highlightCoin(coinId);
            });
        });
    },

    // Toggle coin visibility in chart
    toggleCoinVisibility: (coinId) => {
        const legendItem = Legend.container.querySelector(`[data-coin-id="${coinId}"]`);
        if (!legendItem) return;

        const isHidden = legendItem.classList.contains('hidden');
        
        if (isHidden) {
            legendItem.classList.remove('hidden');
            legendItem.querySelector('.toggle-icon').textContent = '👁️';
        } else {
            legendItem.classList.add('hidden');
            legendItem.querySelector('.toggle-icon').textContent = '👁️‍🗨️';
        }

        // Dispatch custom event for chart to handle
        document.dispatchEvent(new CustomEvent('legendToggle', {
            detail: { coinId, visible: isHidden }
        }));
    },

    // Remove coin from chart
    removeCoin: (coinId) => {
        const legendItem = Legend.container.querySelector(`[data-coin-id="${coinId}"]`);
        if (!legendItem) return;

        // Add removal animation
        legendItem.classList.add('removing');
        
        setTimeout(() => {
            // Remove from current coins array
            Legend.currentCoins = Legend.currentCoins.filter(coin => coin.id !== coinId);
            
            // Dispatch custom event for chart to handle
            document.dispatchEvent(new CustomEvent('legendRemove', {
                detail: { coinId }
            }));
            
            // Re-render legend
            Legend.render();
        }, 300);
    },

    // Highlight coin in chart
    highlightCoin: (coinId) => {
        // Remove previous highlights
        const allItems = Legend.container.querySelectorAll('.legend-item');
        allItems.forEach(item => item.classList.remove('highlighted'));

        // Add highlight to selected item
        const selectedItem = Legend.container.querySelector(`[data-coin-id="${coinId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('highlighted');
            
            // Dispatch custom event for chart to handle
            document.dispatchEvent(new CustomEvent('legendHighlight', {
                detail: { coinId }
            }));

            // Auto-remove highlight after 3 seconds
            setTimeout(() => {
                selectedItem.classList.remove('highlighted');
                document.dispatchEvent(new CustomEvent('legendHighlight', {
                    detail: { coinId: null }
                }));
            }, 3000);
        }
    },

    // Sort legend items
    sort: (criteria = 'performance') => {
        let sortedCoins = [...Legend.currentCoins];
        
        switch (criteria) {
            case 'performance':
                sortedCoins.sort((a, b) => {
                    const aPref = Legend.getCoinPerformance(a.id);
                    const bPerf = Legend.getCoinPerformance(b.id);
                    return bPerf - aPref;
                });
                break;
            case 'marketCap':
                sortedCoins.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0));
                break;
            case 'price':
                sortedCoins.sort((a, b) => (b.current_price || 0) - (a.current_price || 0));
                break;
            case 'name':
                sortedCoins.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                // Keep original order
                break;
        }

        Legend.currentCoins = sortedCoins;
        Legend.render();
    },

    // Get coin performance from chart series
    getCoinPerformance: (coinId) => {
        // This would be called from chart component
        // For now, return 0 as placeholder
        return 0;
    },

    // Add sort controls
    addSortControls: () => {
        const sortControls = `
            <div class="legend-sort-controls">
                <label>Sort by:</label>
                <select class="sort-select">
                    <option value="performance">Performance</option>
                    <option value="marketCap">Market Cap</option>
                    <option value="price">Price</option>
                    <option value="name">Name</option>
                </select>
            </div>
        `;

        const header = Legend.container.querySelector('.legend-header');
        if (header) {
            header.insertAdjacentHTML('beforeend', sortControls);
            
            const sortSelect = header.querySelector('.sort-select');
            sortSelect.addEventListener('change', (e) => {
                Legend.sort(e.target.value);
            });
        }
    },

    // Export legend data
    exportData: () => {
        return {
            coins: Legend.currentCoins,
            hiddenCoins: Legend.getHiddenCoins(),
            sortOrder: Legend.getCurrentSortOrder()
        };
    },

    // Get hidden coins
    getHiddenCoins: () => {
        const hiddenItems = Legend.container.querySelectorAll('.legend-item.hidden');
        return Array.from(hiddenItems).map(item => item.dataset.coinId);
    },

    // Get current sort order
    getCurrentSortOrder: () => {
        const sortSelect = Legend.container.querySelector('.sort-select');
        return sortSelect ? sortSelect.value : 'performance';
    },

    // Clear legend
    clear: () => {
        if (Legend.container) {
            Legend.container.innerHTML = `
                <div class="legend-empty">
                    <p>No cryptocurrencies selected</p>
                    <p class="legend-hint">Select coins to display their performance</p>
                </div>
            `;
        }
        Legend.currentCoins = [];
    },

    // Show loading state
    showLoading: () => {
        if (Legend.container) {
            Legend.container.innerHTML = `
                <div class="legend-loading">
                    <div class="spinner"></div>
                    <p>Loading cryptocurrency data...</p>
                </div>
            `;
        }
    },

    // Show error state
    showError: (message) => {
        if (Legend.container) {
            Legend.container.innerHTML = `
                <div class="legend-error">
                    <p>Error: ${message}</p>
                    <button onclick="location.reload()">Retry</button>
                </div>
            `;
        }
    },

    // Update single coin data
    updateCoin: (coinId, newData) => {
        const coinIndex = Legend.currentCoins.findIndex(coin => coin.id === coinId);
        if (coinIndex !== -1) {
            Legend.currentCoins[coinIndex] = { ...Legend.currentCoins[coinIndex], ...newData };
            Legend.render();
        }
    },

    // Get visible coins
    getVisibleCoins: () => {
        const hiddenCoins = Legend.getHiddenCoins();
        return Legend.currentCoins.filter(coin => !hiddenCoins.includes(coin.id));
    },

    // Destroy legend
    destroy: () => {
        if (Legend.container) {
            Legend.container.innerHTML = '';
        }
        Legend.currentCoins = [];
        Legend.container = null;
    }
};

// Export legend
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Legend;
} else {
    window.Legend = Legend;
}