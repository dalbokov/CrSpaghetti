// ============================
// CHART MODULE - FIXED IMPLEMENTATION
// ============================

const Chart = {
    // ============================
    // INITIALIZATION
    // ============================
    
    init() {
        this.createChart();
        this.updateData();
    },
    
    createChart() {
        const canvas = document.getElementById('priceChart');
        if (!canvas) {
            console.error('Chart canvas not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (AppState.chartInstance) {
            AppState.chartInstance.destroy();
        }
        
        AppState.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false // We use custom legend
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#3498db',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const symbol = context.dataset.label;
                                return `${symbol}: ${this.formatPercentage(value)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Date',
                            color: '#666'
                        },
                        grid: {
                            color: '#f0f0f0'
                        },
                        ticks: {
                            color: '#666',
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Price Change (%)',
                            color: '#666'
                        },
                        grid: {
                            color: '#f0f0f0'
                        },
                        ticks: {
                            color: '#666',
                            callback: (value) => {
                                return this.formatPercentage(value);
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                elements: {
                    point: {
                        radius: 0,
                        hoverRadius: 5,
                        hoverBorderWidth: 2
                    },
                    line: {
                        tension: 0.2,
                        borderWidth: 2
                    }
                }
            }
        });
    },
    
    // ============================
    // DATA UPDATE
    // ============================
    
    async updateData() {
        const chart = AppState.chartInstance;
        if (!chart) return;
        
        try {
            this.showLoading(true);
            
            // Get coins based on current method
            const coins = await this.getCoinsForCurrentMethod();
            
            if (!coins || coins.length === 0) {
                throw new Error('No coins data available');
            }
            
            console.log(`📊 Updating chart with ${coins.length} coins for ${AppState.currentPeriod} days`);
            
            // Get historical data for all coins
            const coinIds = coins.map(coin => coin.id);
            const historicalData = await CoinGeckoAPI.getMultipleHistoricalPrices(coinIds, AppState.currentPeriod);
            
            // Calculate performance data
            const performanceData = this.calculatePerformanceData(coins, historicalData);
            
            // Create datasets with performance-based colors
            const datasets = this.createDatasets(performanceData);
            
            // Generate date labels
            const labels = this.generateDateLabels(AppState.currentPeriod);
            
            // Update chart
            chart.data.labels = labels;
            chart.data.datasets = datasets;
            chart.update();
            
            // Update legend
            this.updateLegend(performanceData);
            
            // Store data for other uses
            AppState.chartData = performanceData;
            
            this.showNotification('Chart updated successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Error updating chart:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    },
    
    // ============================
    // COIN SELECTION LOGIC
    // ============================
    
    async getCoinsForCurrentMethod() {
        const method = AppState.currentMethod;
        const limit = AppState.currentCoins;
        
        switch (method) {
            case 'market-cap':
                return await CoinGeckoAPI.getTopCoins(limit);
                
            case 'category':
                const category = document.getElementById('category').value;
                return await CoinGeckoAPI.getCoinsByCategory(category, limit);
                
            case 'custom':
                return AppState.customCoins.slice(0, limit);
                
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    },
    
    // ============================
    // PERFORMANCE CALCULATION
    // ============================
    
    calculatePerformanceData(coins, historicalData) {
        const performanceData = [];
        
        for (const coin of coins) {
            const prices = historicalData[coin.id];
            
            if (!prices || prices.length === 0) {
                console.warn(`⚠️ No price data for ${coin.id}`);
                continue;
            }
            
            // Calculate percentage changes from start (starting at 0%)
            const startPrice = prices[0].price;
            const endPrice = prices[prices.length - 1].price;
            const totalPerformance = ((endPrice - startPrice) / startPrice) * 100;
            
            // Calculate daily percentage changes from start
            const performancePoints = prices.map(price => {
                const percentChange = ((price.price - startPrice) / startPrice) * 100;
                return {
                    date: price.date,
                    value: percentChange
                };
            });
            
            performanceData.push({
                coin: coin,
                totalPerformance: totalPerformance,
                performancePoints: performancePoints
            });
        }
        
        // Sort by performance (best to worst)
        performanceData.sort((a, b) => b.totalPerformance - a.totalPerformance);
        
        return performanceData;
    },
    
    // ============================
    // DATASET CREATION
    // ============================
    
    createDatasets(performanceData) {
        return performanceData.map((item, index) => {
            const coin = item.coin;
            const color = this.getPerformanceColor(index, performanceData.length);
            
            return {
                label: coin.symbol.toUpperCase(),
                data: item.performancePoints.map(point => point.value),
                borderColor: color,
                backgroundColor: color + '20', // Add transparency
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 5,
                pointHoverBorderWidth: 2,
                pointHoverBorderColor: color,
                pointHoverBackgroundColor: '#fff'
            };
        });
    },
    
    // ============================
    // LEGEND UPDATE
    // ============================
    
    updateLegend(performanceData) {
        const legendContainer = document.getElementById('coin-legend');
        if (!legendContainer) return;
        
        legendContainer.innerHTML = '';
        
        if (!performanceData || performanceData.length === 0) {
            legendContainer.innerHTML = '<div style="color: #666;">No data available</div>';
            return;
        }
        
        performanceData.forEach((item, index) => {
            const coin = item.coin;
            const performance = item.totalPerformance;
            const color = this.getPerformanceColor(index, performanceData.length);
            const isPositive = performance >= 0;
            
            const legendItem = document.createElement('div');
            legendItem.className = 'coin-item';
            legendItem.innerHTML = `
                <div class="coin-color" style="background: ${color}; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px;"></div>
                <span class="coin-symbol" style="font-weight: bold;">${coin.symbol.toUpperCase()}</span>
                <span class="coin-name" style="color: #666; margin-left: 4px;">${coin.name}</span>
                <span class="coin-performance" style="margin-left: auto; color: ${isPositive ? '#27ae60' : '#e74c3c'};">
                    ${this.formatPercentage(performance)}
                </span>
            `;
            
            legendItem.style.cssText = `
                display: flex;
                align-items: center;
                padding: 8px;
                margin-bottom: 4px;
                background: #f8f9fa;
                border-radius: 4px;
            `;
            
            legendContainer.appendChild(legendItem);
        });
    },
    
    // ============================
    // UTILITY METHODS
    // ============================
    
    generateDateLabels(days) {
        const labels = [];
        const now = new Date();
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            }));
        }
        
        return labels;
    },
    
    getPerformanceColor(index, total) {
        const colors = total <= 5 ? AppState.performanceColors : AppState.extendedColors;
        return colors[index] || colors[colors.length - 1];
    },
    
    formatPercentage(value) {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
    },
    
    showLoading(show) {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.style.display = show ? 'flex' : 'none';
        }
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            font-size: 14px;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    },
    
    // ============================
    // REFRESH METHODS
    // ============================
    
    async refreshChart() {
        await this.updateData();
    },
    
    clearChart() {
        const chart = AppState.chartInstance;
        if (chart) {
            chart.data.labels = [];
            chart.data.datasets = [];
            chart.update();
        }
        
        const legendContainer = document.getElementById('coin-legend');
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
    }
};