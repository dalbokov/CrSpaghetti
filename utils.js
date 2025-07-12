// Utility functions for the cryptocurrency chart application
const Utils = {
    // Cache management
    cache: new Map(),
    
    // Debounce function for search input
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function for API requests
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Cache utilities
    setCache: (key, value, duration = CONFIG.PERFORMANCE.CACHE_DURATION) => {
        const expiry = Date.now() + duration;
        Utils.cache.set(key, { value, expiry });
        
        // Clean up old cache entries
        if (Utils.cache.size > CONFIG.PERFORMANCE.MAX_CACHE_SIZE) {
            const firstKey = Utils.cache.keys().next().value;
            Utils.cache.delete(firstKey);
        }
    },

    getCache: (key) => {
        const cached = Utils.cache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.value;
        }
        Utils.cache.delete(key);
        return null;
    },

    clearCache: () => {
        Utils.cache.clear();
    },

    // Format numbers
    formatNumber: (num, decimals = 2) => {
        if (num === null || num === undefined) return '0';
        
        const absNum = Math.abs(num);
        if (absNum >= 1e9) {
            return (num / 1e9).toFixed(decimals) + 'B';
        } else if (absNum >= 1e6) {
            return (num / 1e6).toFixed(decimals) + 'M';
        } else if (absNum >= 1e3) {
            return (num / 1e3).toFixed(decimals) + 'K';
        }
        return num.toFixed(decimals);
    },

    // Format percentage
    formatPercent: (num, decimals = 2) => {
        if (num === null || num === undefined) return '0.00%';
        return `${num >= 0 ? '+' : ''}${num.toFixed(decimals)}%`;
    },

    // Format currency
    formatCurrency: (num, currency = 'USD') => {
        if (num === null || num === undefined) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(num);
    },

    // Format date
    formatDate: (date) => {
        if (!(date instanceof Date)) date = new Date(date);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Calculate percentage change between two values
    calculatePercentChange: (current, previous) => {
        if (previous === 0 || previous === null || previous === undefined) return 0;
        return ((current - previous) / previous) * 100;
    },

    // Normalize data for chart (convert to percentage changes from baseline)
    normalizeChartData: (data, baselineValue) => {
        if (!data || !Array.isArray(data) || baselineValue === 0) return [];
        
        return data.map(point => {
            const percentChange = Utils.calculatePercentChange(point.value, baselineValue);
            return {
                timestamp: point.timestamp,
                value: percentChange,
                originalValue: point.value
            };
        });
    },

    // Sort coins by performance
    sortCoinsByPerformance: (coins, ascending = false) => {
        return coins.sort((a, b) => {
            const aChange = a.performance || 0;
            const bChange = b.performance || 0;
            return ascending ? aChange - bChange : bChange - aChange;
        });
    },

    // Filter out stablecoins
    filterStablecoins: (coins) => {
        return coins.filter(coin => !CONFIG.UTILS.isStablecoin(coin.id));
    },

    // Get time range for API requests
    getTimeRange: (days) => {
        const now = new Date();
        const start = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
        return {
            start: start.toISOString(),
            end: now.toISOString(),
            days: days
        };
    },

    // Generate unique ID
    generateId: () => {
        return Math.random().toString(36).substr(2, 9);
    },

    // Deep clone object
    deepClone: (obj) => {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const cloned = {};
            Object.keys(obj).forEach(key => {
                cloned[key] = Utils.deepClone(obj[key]);
            });
            return cloned;
        }
    },

    // Check if object is empty
    isEmpty: (obj) => {
        if (obj === null || obj === undefined) return true;
        if (typeof obj === 'string') return obj.length === 0;
        if (Array.isArray(obj)) return obj.length === 0;
        if (typeof obj === 'object') return Object.keys(obj).length === 0;
        return false;
    },

    // Retry function with exponential backoff
    retry: async (fn, maxRetries = 3, delay = 1000) => {
        let lastError;
        
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (i === maxRetries - 1) break;
                
                // Exponential backoff
                const waitTime = delay * Math.pow(2, i);
                await Utils.sleep(waitTime);
            }
        }
        
        throw lastError;
    },

    // Sleep function
    sleep: (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // Validate coin data
    validateCoinData: (coin) => {
        return coin &&
               coin.id &&
               coin.name &&
               typeof coin.current_price === 'number' &&
               !isNaN(coin.current_price);
    },

    // Validate chart data
    validateChartData: (data) => {
        return Array.isArray(data) &&
               data.length > 0 &&
               data.every(point => 
                   point.timestamp &&
                   typeof point.value === 'number' &&
                   !isNaN(point.value)
               );
    },

    // Error handling
    handleError: (error, context = 'Unknown') => {
        console.error(`Error in ${context}:`, error);
        
        // Determine error type
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            return CONFIG.ERRORS.NETWORK_ERROR;
        } else if (error.status === 429) {
            return CONFIG.ERRORS.RATE_LIMIT;
        } else if (error.status >= 400 && error.status < 500) {
            return CONFIG.ERRORS.API_ERROR;
        } else {
            return CONFIG.ERRORS.API_ERROR;
        }
    },

    // Show loading state
    showLoading: (element, message = 'Loading...') => {
        if (!element) return;
        
        element.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <p>${message}</p>
            </div>
        `;
    },

    // Hide loading state
    hideLoading: (element) => {
        if (!element) return;
        
        const loading = element.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    },

    // Show error message
    showError: (element, message) => {
        if (!element) return;
        
        element.innerHTML = `
            <div class="error">
                <p>${message}</p>
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    },

    // Get coin logo URL
    getCoinLogoUrl: (coinId) => {
        return `https://assets.coingecko.com/coins/images/${coinId}/small/`;
    },

    // Search coins by name or symbol
    searchCoins: (coins, query) => {
        if (!query || query.length < 2) return coins;
        
        const lowerQuery = query.toLowerCase();
        return coins.filter(coin => 
            coin.name.toLowerCase().includes(lowerQuery) ||
            coin.symbol.toLowerCase().includes(lowerQuery) ||
            coin.id.toLowerCase().includes(lowerQuery)
        );
    },

    // Get performance color
    getPerformanceColor: (percentage) => {
        if (percentage > 0) {
            return percentage > 10 ? '#00ff00' : '#66ff66';
        } else if (percentage < 0) {
            return percentage < -10 ? '#ff0000' : '#ff6666';
        }
        return '#ffff00';
    },

    // Generate chart tooltip
    generateTooltip: (coin, data) => {
        return `
            <div class="tooltip">
                <h4>${coin.name} (${coin.symbol.toUpperCase()})</h4>
                <p>Price: ${Utils.formatCurrency(data.originalValue)}</p>
                <p>Change: ${Utils.formatPercent(data.value)}</p>
                <p>Date: ${Utils.formatDate(new Date(data.timestamp))}</p>
            </div>
        `;
    },

    // Local storage utilities
    saveToStorage: (key, value) => {
        try {
            // Note: localStorage is not available in Claude artifacts
            // This is a placeholder for when the code is used outside Claude
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (error) {
            console.warn('Could not save to localStorage:', error);
        }
    },

    loadFromStorage: (key, defaultValue = null) => {
        try {
            // Note: localStorage is not available in Claude artifacts
            // This is a placeholder for when the code is used outside Claude
            if (typeof localStorage !== 'undefined') {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            }
        } catch (error) {
            console.warn('Could not load from localStorage:', error);
        }
        return defaultValue;
    }
};

// Export utils
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
} else {
    window.Utils = Utils;
}