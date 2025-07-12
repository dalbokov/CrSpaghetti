// Data processor for cryptocurrency chart application
const DataProcessor = {
    // Process market data for chart display
    processMarketData: (rawData, timePeriod) => {
        if (!rawData || !Array.isArray(rawData)) {
            throw new Error('Invalid market data format');
        }

        // Filter out stablecoins
        const filteredData = Utils.filterStablecoins(rawData);
        
        // Sort by market cap descending
        const sortedData = filteredData.sort((a, b) => 
            (b.market_cap || 0) - (a.market_cap || 0)
        );

        return sortedData.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            current_price: coin.current_price,
            market_cap: coin.market_cap,
            market_cap_rank: coin.market_cap_rank,
            price_change_percentage_24h: coin.price_change_percentage_24h,
            price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
            price_change_percentage_30d: coin.price_change_percentage_30d_in_currency,
            price_change_percentage_1y: coin.price_change_percentage_1y_in_currency,
            image: coin.image,
            last_updated: coin.last_updated
        }));
    },

    // Process historical price data for chart
    processHistoricalData: (coinId, rawData, timePeriod) => {
        if (!rawData || !rawData.prices || !Array.isArray(rawData.prices)) {
            throw new Error(`Invalid historical data for ${coinId}`);
        }

        const prices = rawData.prices;
        if (prices.length === 0) {
            throw new Error(`No price data available for ${coinId}`);
        }

        // Get baseline (first price)
        const baselinePrice = prices[0][1];
        
        // Process price data with percentage changes
        const processedData = prices.map(([timestamp, price]) => ({
            timestamp: timestamp,
            value: price,
            percentChange: Utils.calculatePercentChange(price, baselinePrice)
        }));

        // Resample data based on time period for performance
        const sampledData = DataProcessor.resampleData(processedData, timePeriod);

        return {
            coinId: coinId,
            baselinePrice: baselinePrice,
            data: sampledData,
            performance: sampledData.length > 0 ? 
                sampledData[sampledData.length - 1].percentChange : 0
        };
    },

    // Resample data to reduce points for better performance
    resampleData: (data, timePeriod) => {
        if (!data || data.length === 0) return [];

        let sampleInterval;
        
        // Determine sampling interval based on time period
        switch(timePeriod) {
            case 30:
                sampleInterval = Math.max(1, Math.floor(data.length / 200)); // Max 200 points
                break;
            case 90:
                sampleInterval = Math.max(1, Math.floor(data.length / 250)); // Max 250 points
                break;
            case 180:
                sampleInterval = Math.max(1, Math.floor(data.length / 300)); // Max 300 points
                break;
            case 365:
                sampleInterval = Math.max(1, Math.floor(data.length / 365)); // Max 365 points
                break;
            default:
                sampleInterval = Math.max(1, Math.floor(data.length / 200));
        }

        const sampledData = [];
        for (let i = 0; i < data.length; i += sampleInterval) {
            sampledData.push(data[i]);
        }

        // Always include the last data point
        if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
            sampledData.push(data[data.length - 1]);
        }

        return sampledData;
    },

    // Get coins by market cap tier
    getCoinsByMarketCap: (allCoins, tier, count) => {
        const maxCoins = CONFIG.MARKET_CAP_TIERS[tier] || 10;
        const filteredCoins = Utils.filterStablecoins(allCoins);
        
        // Sort by market cap rank
        const sortedCoins = filteredCoins.sort((a, b) => 
            (a.market_cap_rank || 999999) - (b.market_cap_rank || 999999)
        );

        return sortedCoins.slice(0, Math.min(count, maxCoins));
    },

    // Get coins by category
    getCoinsByCategory: (allCoins, category, count) => {
        const categoryCoins = CONFIG.UTILS.getCategoryCoins(category);
        if (!categoryCoins || categoryCoins.length === 0) {
            return [];
        }

        // Filter coins that match the category
        const matchingCoins = allCoins.filter(coin => 
            categoryCoins.includes(coin.id) && !CONFIG.UTILS.isStablecoin(coin.id)
        );

        // Sort by market cap
        const sortedCoins = matchingCoins.sort((a, b) => 
            (b.market_cap || 0) - (a.market_cap || 0)
        );

        return sortedCoins.slice(0, count);
    },

    // Get top performers
    getTopPerformers: (allCoins, timePeriod, count) => {
        const filteredCoins = Utils.filterStablecoins(allCoins);
        
        // Determine which price change percentage to use
        let performanceKey;
        switch(timePeriod) {
            case 30:
                performanceKey = 'price_change_percentage_30d';
                break;
            case 90:
                performanceKey = 'price_change_percentage_30d'; // Use 30d as proxy
                break;
            case 180:
                performanceKey = 'price_change_percentage_30d'; // Use 30d as proxy
                break;
            case 365:
                performanceKey = 'price_change_percentage_1y';
                break;
            default:
                performanceKey = 'price_change_percentage_7d';
        }

        // Sort by performance descending
        const sortedCoins = filteredCoins
            .filter(coin => coin[performanceKey] !== null && coin[performanceKey] !== undefined)
            .sort((a, b) => (b[performanceKey] || 0) - (a[performanceKey] || 0));

        return sortedCoins.slice(0, count);
    },

    // Get worst performers
    getWorstPerformers: (allCoins, timePeriod, count) => {
        const filteredCoins = Utils.filterStablecoins(allCoins);
        
        // Determine which price change percentage to use
        let performanceKey;
        switch(timePeriod) {
            case 30:
                performanceKey = 'price_change_percentage_30d';
                break;
            case 90:
                performanceKey = 'price_change_percentage_30d'; // Use 30d as proxy
                break;
            case 180:
                performanceKey = 'price_change_percentage_30d'; // Use 30d as proxy
                break;
            case 365:
                performanceKey = 'price_change_percentage_1y';
                break;
            default:
                performanceKey = 'price_change_percentage_7d';
        }

        // Sort by performance ascending (worst first)
        const sortedCoins = filteredCoins
            .filter(coin => coin[performanceKey] !== null && coin[performanceKey] !== undefined)
            .sort((a, b) => (a[performanceKey] || 0) - (b[performanceKey] || 0));

        return sortedCoins.slice(0, count);
    },

    // Combine multiple coin datasets for chart
    combineChartData: (coinDatasets) => {
        if (!coinDatasets || coinDatasets.length === 0) {
            return { series: [], yAxisBounds: { min: 0, max: 0 } };
        }

        // Calculate Y-axis bounds
        let minPercent = 0;
        let maxPercent = 0;

        const series = coinDatasets.map((dataset, index) => {
            const { coinId, data, performance } = dataset;
            
            // Update bounds
            data.forEach(point => {
                minPercent = Math.min(minPercent, point.percentChange);
                maxPercent = Math.max(maxPercent, point.percentChange);
            });

            return {
                id: coinId,
                data: data,
                performance: performance,
                color: CONFIG.UTILS.getColorForRank(index + 1, coinDatasets.length)
            };
        });

        // Add padding to bounds
        const padding = Math.max(Math.abs(maxPercent), Math.abs(minPercent)) * 0.1;
        minPercent -= padding;
        maxPercent += padding;

        return {
            series: series,
            yAxisBounds: {
                min: minPercent,
                max: maxPercent
            }
        };
    },

    // Calculate performance statistics
    calculatePerformanceStats: (coinDatasets) => {
        if (!coinDatasets || coinDatasets.length === 0) {
            return {
                bestPerformer: null,
                worstPerformer: null,
                averagePerformance: 0,
                volatility: 0
            };
        }

        const performances = coinDatasets.map(dataset => dataset.performance);
        const bestPerformance = Math.max(...performances);
        const worstPerformance = Math.min(...performances);
        const averagePerformance = performances.reduce((sum, perf) => sum + perf, 0) / performances.length;
        
        // Calculate volatility (standard deviation)
        const variance = performances.reduce((sum, perf) => 
            sum + Math.pow(perf - averagePerformance, 2), 0) / performances.length;
        const volatility = Math.sqrt(variance);

        return {
            bestPerformer: {
                coinId: coinDatasets.find(d => d.performance === bestPerformance)?.coinId,
                performance: bestPerformance
            },
            worstPerformer: {
                coinId: coinDatasets.find(d => d.performance === worstPerformance)?.coinId,
                performance: worstPerformance
            },
            averagePerformance: averagePerformance,
            volatility: volatility
        };
    },

    // Generate chart configuration
    generateChartConfig: (combinedData, stats) => {
        const { series, yAxisBounds } = combinedData;
        
        return {
            type: 'line',
            data: {
                datasets: series.map(s => ({
                    label: s.id,
                    data: s.data.map(point => ({
                        x: point.timestamp,
                        y: point.percentChange
                    })),
                    borderColor: s.color,
                    backgroundColor: s.color + '20', // 20% opacity
                    borderWidth: CONFIG.CHART.LINE_WIDTH,
                    fill: false,
                    tension: 0.1
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                day: 'MMM DD',
                                week: 'MMM DD',
                                month: 'MMM YYYY'
                            }
                        },
                        grid: {
                            color: CONFIG.CHART.GRID_COLOR
                        },
                        ticks: {
                            color: CONFIG.CHART.TEXT_COLOR
                        }
                    },
                    y: {
                        min: yAxisBounds.min,
                        max: yAxisBounds.max,
                        grid: {
                            color: CONFIG.CHART.GRID_COLOR
                        },
                        ticks: {
                            color: CONFIG.CHART.TEXT_COLOR,
                            callback: function(value) {
                                return Utils.formatPercent(value);
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: CONFIG.CHART.TEXT_COLOR,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${Utils.formatPercent(context.parsed.y)}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        };
    },

    // Validate processed data
    validateProcessedData: (data) => {
        if (!data) return false;
        
        if (data.series && Array.isArray(data.series)) {
            return data.series.every(series => 
                series.id && 
                Array.isArray(series.data) && 
                series.data.length > 0
            );
        }
        
        return false;
    }
};

// Export data processor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataProcessor;
} else {
    window.DataProcessor = DataProcessor;
}