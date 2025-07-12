// ============================
// MAIN APPLICATION STATE & INITIALIZATION
// ============================

// Global Application State
const AppState = {
    // Current selections
    currentMethod: 'market-cap',
    currentPeriod: 30,
    currentCoins: 10,
    currentCategory: 'layer-1',
    
    // Data storage
    chartData: [],
    selectedCoins: [],
    customCoins: [],
    
    // Chart instance
    chartInstance: null,
    
    // Performance colors (best to worst)
    performanceColors: [
        '#27ae60', // Green - Best performer
        '#3498db', // Blue - Second best
        '#f39c12', // Yellow - Mid performer
        '#e67e22', // Orange - Second worst
        '#e74c3c'  // Red - Worst performer
    ],
    
    // Extended colors for 10 coins
    extendedColors: [
        '#27ae60', // Green - Best
        '#2ecc71', // Light green
        '#3498db', // Blue
        '#5dade2', // Light blue
        '#f39c12', // Yellow
        '#f7dc6f', // Light yellow
        '#e67e22', // Orange
        '#ec7063', // Light orange
        '#e74c3c', // Red
        '#cd6155'  // Dark red - Worst
    ],
    
    // Category mapping for CoinGecko API
    categoryMap: {
        'l1s': 'layer-1',
        'l2s': 'layer-2',
        'ai': 'artificial-intelligence',
        'memes': 'meme-token',
        'gaming': 'gaming',
        'rwa': 'real-world-assets',
        'defi': 'decentralized-finance-defi',
        'infrastructure': 'infrastructure',
        'exchange': 'centralized-exchange-token-cex'
    },
    
    // Known stablecoins to filter out
    stablecoins: [
        'tether', 'usd-coin', 'binance-usd', 'dai', 'frax',
        'true-usd', 'pax-dollar', 'gemini-dollar', 'terrausd',
        'magic-internet-money', 'neutrino', 'fei-usd', 'liquity-usd'
    ]
};

// ============================
// INITIALIZATION
// ============================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing Crypto Chart Comparison App...');
    
    try {
        // Initialize all modules
        await initializeApp();
        
        // Load initial data
        await loadInitialData();
        
        // Remove mockup note
        removeMockupNote();
        
        console.log('✅ App initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        showErrorMessage('Failed to initialize the application. Please refresh the page.');
    }
});

async function initializeApp() {
    // Initialize all modules in correct order
    Controls.init();
    ActionButtons.init();
    await CustomPicker.init();
    Chart.init();
}

async function loadInitialData() {
    // Load initial chart data
    await Chart.updateData();
}

function removeMockupNote() {
    const mockupNote = document.querySelector('.mockup-note');
    if (mockupNote) {
        mockupNote.style.display = 'none';
    }
}

// ============================
// THEME TOGGLE
// ============================

// ============================
// ACTION BUTTONS
// ============================

const ActionButtons = {
    init() {
        document.getElementById('export-btn').addEventListener('click', this.exportChart);
        document.getElementById('share-btn').addEventListener('click', this.shareURL);
        document.getElementById('embed-btn').addEventListener('click', this.embedCode);
        document.getElementById('alert-btn').addEventListener('click', this.setAlert);
    },

    exportChart() {
        if (!AppState.chartInstance) return;
        
        const canvas = AppState.chartInstance.canvas;
        const link = document.createElement('a');
        link.download = `crypto-comparison-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    },

    shareURL() {
        const url = this.generateShareableURL();
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Share URL copied to clipboard!');
        }).catch(() => {
            prompt('Copy this URL:', url);
        });
    },

    embedCode() {
        const embedCode = `<iframe src="${this.generateShareableURL()}" width="800" height="600" frameborder="0"></iframe>`;
        navigator.clipboard.writeText(embedCode).then(() => {
            showNotification('Embed code copied to clipboard!');
        }).catch(() => {
            prompt('Copy this embed code:', embedCode);
        });
    },

    setAlert() {
        showNotification('Price alerts feature coming soon!');
    },

    generateShareableURL() {
        const params = new URLSearchParams({
            method: AppState.currentMethod,
            period: AppState.currentPeriod,
            coins: AppState.currentCoins,
            category: AppState.currentCategory
        });
        
        if (AppState.currentMethod === 'custom' && AppState.customCoins.length > 0) {
            params.set('custom', AppState.customCoins.map(c => c.id).join(','));
        }
        
        return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    }
};

// ============================
// UTILITY FUNCTIONS
// ============================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        max-width: 300px;
    `;
    
    if (type === 'error') {
        notification.style.background = '#e74c3c';
    } else if (type === 'success') {
        notification.style.background = '#27ae60';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function showErrorMessage(message) {
    showNotification(message, 'error');
}

function showSuccessMessage(message) {
    showNotification(message, 'success');
}

function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

function formatPercentage(value) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

function generateDateLabels(days) {
    const labels = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        labels.push(formatDate(date.getTime()));
    }
    
    return labels;
}

function getPerformanceColor(index, total) {
    const colors = total <= 5 ? AppState.performanceColors : AppState.extendedColors;
    return colors[index] || colors[colors.length - 1];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================
// URL PARAMETER HANDLING
// ============================

function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('method')) {
        AppState.currentMethod = params.get('method');
    }
    
    if (params.has('period')) {
        AppState.currentPeriod = parseInt(params.get('period'));
    }
    
    if (params.has('coins')) {
        AppState.currentCoins = parseInt(params.get('coins'));
    }
    
    if (params.has('category')) {
        AppState.currentCategory = params.get('category');
    }
    
    if (params.has('custom')) {
        const customIds = params.get('custom').split(',');
        // This will be handled by the custom picker modal
    }
}

// Load URL parameters on initialization
document.addEventListener('DOMContentLoaded', loadFromURL);
