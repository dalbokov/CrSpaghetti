// Configuration file for the cryptocurrency chart application
const CONFIG = {
    // API endpoints
    API: {
        BASE_URL: 'https://api.coingecko.com/api/v3',
        ENDPOINTS: {
            COINS_LIST: '/coins/list',
            COINS_MARKETS: '/coins/markets',
            COIN_HISTORY: '/coins/{id}/market_chart',
            CATEGORIES: '/coins/categories',
            TRENDING: '/search/trending'
        },
        RATE_LIMIT: 50, // requests per minute for free tier
        REQUEST_DELAY: 1200 // milliseconds between requests
    },

    // Chart configuration
    CHART: {
        COLORS: {
            TOP_5: ['#00ff00', '#0066ff', '#ffff00', '#ff8800', '#ff0000'],
            TOP_10: ['#00ff00', '#33ff33', '#0066ff', '#3399ff', '#ffff00', '#ffcc00', '#ff8800', '#ffaa44', '#ff0000', '#ff4444']
        },
        GRID_COLOR: '#333333',
        AXIS_COLOR: '#666666',
        BACKGROUND_COLOR: '#1e1e1e',
        TEXT_COLOR: '#ffffff',
        FONT_SIZE: 12,
        LINE_WIDTH: 2
    },

    // Time periods in days
    TIME_PERIODS: {
        '30': 30,
        '90': 90,
        '180': 180,
        '365': 365
    },

    // Market cap tiers
    MARKET_CAP_TIERS: {
        'top-10': 10,
        'top-50': 50,
        'top-100': 100,
        'top-200': 200,
        'top-300': 300
    },

    // Cryptocurrency categories
    CATEGORIES: {
        'layer-1': {
            name: 'L1s',
            description: 'Layer 1 Blockchains',
            coins: ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano', 'avalanche-2', 'polkadot', 'chainlink', 'cosmos', 'algorand']
        },
        'layer-2': {
            name: 'L2s',
            description: 'Layer 2 Solutions',
            coins: ['polygon', 'arbitrum', 'optimism', 'loopring', 'immutable-x', 'starknet', 'metis-andromeda', 'boba-network']
        },
        'artificial-intelligence': {
            name: 'AI',
            description: 'Artificial Intelligence',
            coins: ['fetch-ai', 'singularitynet', 'ocean-protocol', 'numeraire', 'cortex', 'matrix-ai-network', 'deepbrain-chain']
        },
        'meme-token': {
            name: 'Memes',
            description: 'Meme Tokens',
            coins: ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'bonk', 'dogwifcoin', 'mog-coin', 'brett-based']
        },
        'gaming': {
            name: 'Gaming',
            description: 'Gaming Tokens',
            coins: ['axie-infinity', 'the-sandbox', 'decentraland', 'enjincoin', 'gala', 'immutable-x', 'stepn', 'beam-2']
        },
        'real-world-assets': {
            name: 'RWA',
            description: 'Real World Assets',
            coins: ['chainlink', 'maker', 'synthetix', 'compound-governance-token', 'aave', 'centrifuge', 'goldfinch']
        },
        'decentralized-finance-defi': {
            name: 'DeFi',
            description: 'Decentralized Finance',
            coins: ['uniswap', 'aave', 'compound-governance-token', 'maker', 'synthetix', 'curve-dao-token', 'pancakeswap-token', 'sushiswap']
        }
    },

    // Stablecoins to exclude from charts
    STABLECOINS: [
        'tether',
        'usd-coin',
        'binance-usd',
        'dai',
        'frax',
        'trueusd',
        'paxos-standard',
        'gemini-dollar',
        'stasis-eurs',
        'tether-eurt',
        'fei-usd',
        'terra-luna-classic',
        'first-digital-usd',
        'liquity-usd'
    ],

    // Display settings
    DISPLAY: {
        MAX_COINS_TOP_5: 5,
        MAX_COINS_TOP_10: 10,
        MAX_CUSTOM_COINS: 20,
        CHART_HEIGHT: 600,
        LEGEND_MAX_ITEMS: 15,
        SEARCH_DEBOUNCE: 300 // milliseconds
    },

    // Performance thresholds
    PERFORMANCE: {
        TOP_PERFORMER_THRESHOLD: 0.05, // 5% minimum gain
        WORST_PERFORMER_THRESHOLD: -0.05, // 5% minimum loss
        CACHE_DURATION: 300000, // 5 minutes in milliseconds
        MAX_CACHE_SIZE: 1000 // maximum cached items
    },

    // Error messages
    ERRORS: {
        API_ERROR: 'Failed to fetch cryptocurrency data. Please try again.',
        NETWORK_ERROR: 'Network error. Please check your connection.',
        RATE_LIMIT: 'Rate limit exceeded. Please wait before making another request.',
        NO_DATA: 'No data available for the selected criteria.',
        INVALID_SELECTION: 'Please select valid cryptocurrencies.',
        CHART_ERROR: 'Failed to render chart. Please try again.'
    },

    // Default values
    DEFAULTS: {
        SELECTION_METHOD: 'market-cap',
        MARKET_CAP_TIER: 'top-10',
        CATEGORY: 'layer-1',
        COIN_COUNT: 5,
        TIME_PERIOD: '30',
        CURRENCY: 'usd'
    }
};

// Utility functions for configuration
CONFIG.UTILS = {
    // Get color for coin based on performance rank
    getColorForRank: (rank, totalCoins) => {
        if (totalCoins <= 5) {
            return CONFIG.CHART.COLORS.TOP_5[rank - 1] || '#ffffff';
        } else {
            return CONFIG.CHART.COLORS.TOP_10[rank - 1] || '#ffffff';
        }
    },

    // Check if coin is a stablecoin
    isStablecoin: (coinId) => {
        return CONFIG.STABLECOINS.includes(coinId.toLowerCase());
    },

    // Get category coins
    getCategoryCoins: (category) => {
        return CONFIG.CATEGORIES[category]?.coins || [];
    },

    // Get API URL with endpoint
    getApiUrl: (endpoint, params = {}) => {
        let url = CONFIG.API.BASE_URL + endpoint;
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, params[key]);
        });
        return url;
    },

    // Format time period for display
    formatTimePeriod: (days) => {
        if (days <= 30) return `${days} Days`;
        if (days <= 90) return `${Math.round(days / 30)} Months`;
        return `${Math.round(days / 365)} Year${days > 365 ? 's' : ''}`;
    },

    // Calculate percentage change
    calculatePercentChange: (current, initial) => {
        if (initial === 0) return 0;
        return ((current - initial) / initial) * 100;
    },

    // Validate configuration
    validate: () => {
        const errors = [];
        
        if (!CONFIG.API.BASE_URL) {
            errors.push('API base URL is required');
        }
        
        if (!CONFIG.CHART.COLORS.TOP_5.length) {
            errors.push('Chart colors are required');
        }
        
        if (Object.keys(CONFIG.CATEGORIES).length === 0) {
            errors.push('At least one category must be defined');
        }
        
        return errors;
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
} else {
    window.CONFIG = CONFIG;
}