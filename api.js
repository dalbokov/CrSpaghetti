// ============================
// COINGECKO API INTEGRATION - FIXED
// ============================

const CoinGeckoAPI = {
    BASE_URL: 'https://api.coingecko.com/api/v3',
    
    // Rate limiting
    lastRequest: 0,
    requestDelay: 1200, // 1.2 seconds between requests (50 requests/minute limit)
    
    // Cache for API responses
    cache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    
    // ============================
    // RATE LIMITING & CACHING
    // ============================
    
    async makeRequest(url, cacheKey = null) {
        // Check cache first
        if (cacheKey && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📋 Using cached data for: ${cacheKey}`);
                return cached.data;
            } else {
                this.cache.delete(cacheKey);
            }
        }
        
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequest;
        
        if (timeSinceLastRequest < this.requestDelay) {
            const waitTime = this.requestDelay - timeSinceLastRequest;
            console.log(`⏱️ Rate limiting: waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.lastRequest = Date.now();
        
        try {
            console.log(`🌐 Fetching: ${url}`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Cache the response
            if (cacheKey) {
                this.cache.set(cacheKey, {
                    data: data,
                    timestamp: Date.now()
                });
            }
            
            return data;
            
        } catch (error) {
            console.error(`❌ API Error for ${url}:`, error);
            throw error;
        }
    },
    
    // ============================
    // STABLECOIN FILTERING
    // ============================
    
    isStablecoin(coin) {
        // Check if coin ID is in known stablecoins list
        const knownStablecoins = [
            'tether', 'usd-coin', 'binance-usd', 'dai', 'frax',
            'true-usd', 'pax-dollar', 'gemini-dollar', 'terrausd',
            'magic-internet-money', 'neutrino', 'fei-usd', 'liquity-usd',
            'usdd', 'first-digital-usd', 'paypal-usd'
        ];
        
        if (knownStablecoins.includes(coin.id)) {
            return true;
        }
        
        // Check if price change is minimal (likely stablecoin)
        const priceChange = Math.abs(coin.price_change_percentage_24h || 0);
        if (priceChange < 0.1) {
            return true;
        }
        
        // Check name/symbol for stablecoin indicators
        const name = coin.name.toLowerCase();
        const symbol = coin.symbol.toLowerCase();
        const stablecoinKeywords = ['usd', 'usdt', 'usdc', 'dai', 'busd', 'stable', 'peg'];
        
        return stablecoinKeywords.some(keyword => 
            name.includes(keyword) || symbol.includes(keyword)
        );
    },
    
    filterStablecoins(coins) {
        return coins.filter(coin => !this.isStablecoin(coin));
    },
    
    // ============================
    // MAIN API METHODS
    // ============================
    
    async getTopCoins(limit = 100) {
        try {
            const cacheKey = `top-coins-${limit}`;
            const url = `${this.BASE_URL}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit * 2}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;
            
            const data = await this.makeRequest(url, cacheKey);
            
            // Filter out stablecoins and take required amount
            const filtered = this.filterStablecoins(data);
            
            return filtered.slice(0, limit).map(coin => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                image: coin.image,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                price_change_percentage_7d: coin.price_change_percentage_7d
            }));
            
        } catch (error) {
            console.error('❌ Failed to fetch top coins:', error);
            throw new Error('Failed to fetch top cryptocurrencies');
        }
    },
    
    async getCoinsByCategory(category, limit = 50) {
        try {
            const cacheKey = `category-${category}-${limit}`;
            const url = `${this.BASE_URL}/coins/markets?vs_currency=usd&category=${category}&order=market_cap_desc&per_page=${limit * 2}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`;
            
            const data = await this.makeRequest(url, cacheKey);
            
            if (!data || data.length === 0) {
                throw new Error(`No coins found for category: ${category}`);
            }
            
            // Filter out stablecoins and take required amount
            const filtered = this.filterStablecoins(data);
            
            return filtered.slice(0, limit).map(coin => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                market_cap_rank: coin.market_cap_rank,
                image: coin.image,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                price_change_percentage_7d: coin.price_change_percentage_7d
            }));
            
        } catch (error) {
            console.error(`❌ Failed to fetch coins for category ${category}:`, error);
            throw new Error(`Failed to fetch coins for category: ${category}`);
        }
    },
    
    async getHistoricalPrices(coinId, days = 30) {
        try {
            const cacheKey = `history-${coinId}-${days}`;
            const url = `${this.BASE_URL}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
            
            const data = await this.makeRequest(url, cacheKey);
            
            if (!data || !data.prices) {
                throw new Error(`No price data found for ${coinId}`);
            }
            
            return data.prices.map(price => ({
                timestamp: price[0],
                price: price[1],
                date: new Date(price[0]).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                })
            }));
            
        } catch (error) {
            console.error(`❌ Failed to fetch historical prices for ${coinId}:`, error);
            throw new Error(`Failed to fetch price history for ${coinId}`);
        }
    },
    
    async getMultipleHistoricalPrices(coinIds, days = 30) {
        const results = {};
        const errors = [];
        
        console.log(`📊 Fetching historical data for ${coinIds.length} coins over ${days} days...`);
        
        for (const coinId of coinIds) {
            try {
                const prices = await this.getHistoricalPrices(coinId, days);
                results[coinId] = prices;
                
                // Small delay between requests to be respectful
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`❌ Failed to fetch data for ${coinId}:`, error);
                errors.push({ coinId, error: error.message });
            }
        }
        
        if (errors.length > 0) {
            console.warn(`⚠️ Failed to fetch data for ${errors.length} coins:`, errors);
        }
        
        return results;
    },
    
    async searchCoins(query, limit = 50) {
        try {
            const cacheKey = `search-${query}-${limit}`;
            const url = `${this.BASE_URL}/search?query=${encodeURIComponent(query)}`;
            
            const data = await this.makeRequest(url, cacheKey);
            
            if (!data || !data.coins) {
                return [];
            }
            
            return data.coins.slice(0, limit).map(coin => ({
                id: coin.id,
                symbol: coin.symbol,
                name: coin.name,
                large: coin.large,
                market_cap_rank: coin.market_cap_rank
            }));
            
        } catch (error) {
            console.error(`❌ Failed to search coins for query "${query}":`, error);
            return [];
        }
    },
    
    // ============================
    // UTILITY METHODS
    // ============================
    
    clearCache() {
        this.cache.clear();
        console.log('🧹 API cache cleared');
    },
    
    getCacheSize() {
        return this.cache.size;
    },
    
    getCacheKeys() {
        return Array.from(this.cache.keys());
    }
};

// ============================
// EXPORT FOR GLOBAL USE
// ============================

window.CoinGeckoAPI = CoinGeckoAPI;