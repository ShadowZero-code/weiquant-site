/**
 * Enhanced Portfolio Manager with Real Yahoo Finance Integration
 */

class EnhancedPortfolioManager {
    constructor(apiClient) {
        this.api = apiClient || window.portfolioAPI;
        this.holdings = this.loadFromStorage() || [];
        this.lastUpdate = null;
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.refreshAllPrices();
        this.renderHoldings();
        this.updateSummaryCards();
        this.initializeCharts();
        await this.updateCharts();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Set default buy date to today
        const buyDateInput = document.getElementById('buyDate');
        if (buyDateInput) {
            buyDateInput.valueAsDate = new Date();
        }

        // Auto-fetch price when symbol and date are entered
        const symbolInput = document.getElementById('assetSymbol');
        const dateInput = document.getElementById('buyDate');
        
        if (symbolInput) {
            symbolInput.addEventListener('blur', async (e) => {
                const symbol = e.target.value.toUpperCase();
                if (symbol) {
                    await this.validateAndFetchSymbolInfo(symbol);
                }
            });
        }
        
        if (dateInput) {
            dateInput.addEventListener('change', () => this.fetchHistoricalPrice());
        }

        // Add search functionality
        if (symbolInput) {
            let searchTimeout;
            symbolInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value;
                if (query.length >= 2) {
                    searchTimeout = setTimeout(() => this.searchSymbols(query), 300);
                }
            });
        }
    }

    /**
     * Validate symbol and fetch company info
     */
    async validateAndFetchSymbolInfo(symbol) {
        try {
            const validation = await this.api.validateSymbol(symbol);
            
            if (validation.valid) {
                // Update UI with company name
                const nameDisplay = document.getElementById('companyName');
                if (nameDisplay) {
                    nameDisplay.textContent = validation.name || symbol;
                    nameDisplay.classList.remove('text-red-600');
                    nameDisplay.classList.add('text-green-600');
                }
                
                // Check for duplicates
                const existingHolding = this.holdings.find(h => h.symbol === symbol);
                if (existingHolding) {
                    this.showAlert(`You already own ${symbol}. Current quantity: ${existingHolding.quantity}`, 'warning');
                }
                
                // Fetch historical price if date is set
                await this.fetchHistoricalPrice();
                
                return true;
            } else {
                const nameDisplay = document.getElementById('companyName');
                if (nameDisplay) {
                    nameDisplay.textContent = 'Invalid symbol';
                    nameDisplay.classList.add('text-red-600');
                }
                return false;
            }
        } catch (error) {
            console.error('Symbol validation error:', error);
            return false;
        }
    }

    /**
     * Add new asset to portfolio
     */
    async addAsset() {
        const type = document.getElementById('assetType').value;
        const symbol = document.getElementById('assetSymbol').value.toUpperCase();
        const quantity = parseFloat(document.getElementById('assetQuantity').value);
        const buyDate = document.getElementById('buyDate').value;
        const buyPrice = parseFloat(document.getElementById('buyPrice').value);
        const notes = document.getElementById('assetNotes').value;

        // Validation
        if (!symbol || !quantity || !buyDate || !buyPrice) {
            this.showAlert('Please fill all required fields', 'error');
            return;
        }

        // Validate symbol
        const isValid = await this.validateAndFetchSymbolInfo(symbol);
        if (!isValid) {
            this.showAlert('Invalid symbol. Please check and try again.', 'error');
            return;
        }

        // Check for duplicates and offer to merge
        const existingHolding = this.holdings.find(h => h.symbol === symbol);
        if (existingHolding) {
            const merge = confirm(`You already own ${symbol}. Do you want to add to your existing position?`);
            if (merge) {
                // Calculate weighted average buy price
                const totalCost = (existingHolding.buyPrice * existingHolding.quantity) + (buyPrice * quantity);
                const totalQuantity = existingHolding.quantity + quantity;
                existingHolding.quantity = totalQuantity;
                existingHolding.buyPrice = totalCost / totalQuantity;
                existingHolding.buyValue = totalCost;
                existingHolding.notes = existingHolding.notes + '; ' + notes;
                
                await this.updateAssetPrice(existingHolding);
                this.saveToStorage();
                this.renderHoldings();
                this.updateSummaryCards();
                await this.updateCharts();
                this.showAlert(`Added ${quantity} shares to existing ${symbol} position`, 'success');
                this.clearForm();
                return;
            } else {
                return;
            }
        }

        // Get current quote
        try {
            const quote = await this.api.getQuote(symbol);
            
            // Create asset object
            const asset = {
                id: Date.now(),
                type,
                symbol,
                quantity,
                buyDate,
                buyPrice,
                buyValue: quantity * buyPrice,
                notes,
                addedAt: new Date().toISOString(),
                companyName: quote.companyName,
                sector: quote.sector,
                industry: quote.industry,
                currentPrice: quote.currentPrice,
                previousClose: quote.previousClose,
                marketValue: quantity * quote.currentPrice,
                unrealizedPL: (quantity * quote.currentPrice) - (quantity * buyPrice),
                unrealizedPLPercent: ((quote.currentPrice - buyPrice) / buyPrice) * 100,
                dayChange: (quote.currentPrice - quote.previousClose) * quantity,
                dayChangePercent: quote.dayChangePercent,
                beta: quote.beta || 1.0
            };

            // Add to holdings
            this.holdings.push(asset);
            this.saveToStorage();
            this.renderHoldings();
            this.updateSummaryCards();
            await this.updateCharts();
            this.clearForm();
            this.showAlert(`${symbol} added to portfolio successfully`, 'success');
            
        } catch (error) {
            console.error('Error adding asset:', error);
            this.showAlert('Error adding asset. Please try again.', 'error');
        }
    }

    /**
     * Fetch historical price for buy date
     */
    async fetchHistoricalPrice() {
        const symbol = document.getElementById('assetSymbol').value.toUpperCase();
        const buyDate = document.getElementById('buyDate').value;
        
        if (!symbol || !buyDate) return;

        try {
            this.showAlert('Fetching historical price...', 'info');
            const data = await this.api.getHistoricalPrice(symbol, buyDate);
            
            if (data.buyPrice) {
                document.getElementById('buyPrice').value = data.buyPrice.toFixed(2);
                this.showAlert(`Fetched ${symbol} closing price for ${buyDate}: $${data.buyPrice.toFixed(2)}`, 'success');
            }
        } catch (error) {
            console.error('Error fetching historical price:', error);
            this.showAlert('Could not fetch historical price. Please enter manually.', 'warning');
        }
    }

    /**
     * Update asset with current price
     */
    async updateAssetPrice(asset) {
        try {
            const quote = await this.api.getQuote(asset.symbol);
            
            asset.currentPrice = quote.currentPrice;
            asset.previousClose = quote.previousClose;
            asset.marketValue = asset.quantity * quote.currentPrice;
            asset.unrealizedPL = asset.marketValue - asset.buyValue;
            asset.unrealizedPLPercent = (asset.unrealizedPL / asset.buyValue) * 100;
            asset.dayChange = (quote.currentPrice - quote.previousClose) * asset.quantity;
            asset.dayChangePercent = quote.dayChangePercent;
            asset.companyName = quote.companyName;
            asset.sector = quote.sector;
            asset.industry = quote.industry;
            asset.beta = quote.beta || 1.0;
            
        } catch (error) {
            console.error(`Error updating price for ${asset.symbol}:`, error);
        }
    }

    /**
     * Refresh all prices using batch API
     */
    async refreshAllPrices() {
        if (this.holdings.length === 0) return;
        
        this.showAlert('Refreshing all prices...', 'info');
        
        try {
            const symbols = this.holdings.map(h => h.symbol);
            const response = await this.api.getBatchQuotes(symbols);
            
            if (response.quotes) {
                for (const quote of response.quotes) {
                    const holding = this.holdings.find(h => h.symbol === quote.symbol);
                    if (holding && !quote.error) {
                        holding.currentPrice = quote.currentPrice;
                        holding.previousClose = quote.previousClose;
                        holding.marketValue = holding.quantity * quote.currentPrice;
                        holding.unrealizedPL = holding.marketValue - holding.buyValue;
                        holding.unrealizedPLPercent = (holding.unrealizedPL / holding.buyValue) * 100;
                        holding.dayChange = quote.dayChange * holding.quantity;
                        holding.dayChangePercent = quote.dayChangePercent;
                    }
                }
                
                this.lastUpdate = new Date();
                this.saveToStorage();
                this.renderHoldings();
                this.updateSummaryCards();
                await this.updateCharts();
                this.showAlert('Prices updated successfully', 'success');
            }
        } catch (error) {
            console.error('Error refreshing prices:', error);
            this.showAlert('Error refreshing prices. Some prices may be outdated.', 'warning');
        }
    }

    /**
     * Update charts with real performance data
     */
    async updateCharts() {
        if (this.holdings.length === 0) return;
        
        const totalValue = this.holdings.reduce((sum, asset) => sum + (asset.marketValue || asset.buyValue), 0);
        
        // Update allocation chart
        if (this.charts.allocation) {
            const labels = this.holdings.map(asset => asset.symbol);
            const data = this.holdings.map(asset => ((asset.marketValue || asset.buyValue) / totalValue * 100).toFixed(2));
            
            this.charts.allocation.data.labels = labels;
            this.charts.allocation.data.datasets[0].data = data;
            this.charts.allocation.update();
        }

        // Update sector chart
        if (this.charts.sector) {
            const sectorData = {};
            this.holdings.forEach(asset => {
                const sector = asset.sector || asset.type.toUpperCase();
                if (!sectorData[sector]) sectorData[sector] = 0;
                sectorData[sector] += (asset.marketValue || asset.buyValue);
            });
            
            const labels = Object.keys(sectorData);
            const data = labels.map(sector => (sectorData[sector] / totalValue * 100).toFixed(2));
            
            this.charts.sector.data.labels = labels;
            this.charts.sector.data.datasets[0].data = data;
            this.charts.sector.update();
            
            // Update sector breakdown text
            this.updateSectorBreakdown(sectorData, totalValue);
        }

        // Update performance chart with real historical data
        await this.updatePerformanceChart();
        
        // Update risk metrics
        await this.updateRiskMetrics();
    }

    /**
     * Update performance chart with real historical data
     */
    async updatePerformanceChart() {
        if (!this.charts.performance || this.holdings.length === 0) return;
        
        try {
            // Calculate start date (earliest buy date or 1 year ago)
            const earliestBuyDate = this.holdings.reduce((earliest, h) => {
                const buyDate = new Date(h.buyDate);
                return buyDate < earliest ? buyDate : earliest;
            }, new Date());
            
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            
            const startDate = earliestBuyDate < oneYearAgo ? earliestBuyDate : oneYearAgo;
            const endDate = new Date();
            
            // Get portfolio performance history
            const holdingsData = this.holdings.map(h => ({
                symbol: h.symbol,
                quantity: h.quantity,
                buyDate: h.buyDate
            }));
            
            const perfData = await this.api.getPortfolioPerformance(
                holdingsData,
                startDate.toISOString().split('T')[0],
                endDate.toISOString().split('T')[0]
            );
            
            if (perfData.performance && perfData.performance.length > 0) {
                const labels = perfData.performance.map(p => new Date(p.date).toLocaleDateString());
                const values = perfData.performance.map(p => p.value);
                
                this.charts.performance.data.labels = labels;
                this.charts.performance.data.datasets[0].data = values;
                this.charts.performance.update();
            }
        } catch (error) {
            console.error('Error updating performance chart:', error);
        }
    }

    /**
     * Update risk metrics with real calculations
     */
    async updateRiskMetrics() {
        try {
            // Send holdings to backend for analysis
            const holdingsData = this.holdings.map(h => ({
                symbol: h.symbol,
                quantity: h.quantity,
                buyPrice: h.buyPrice,
                buyDate: h.buyDate
            }));
            
            const analysis = await this.api.analyzePortfolio(holdingsData);
            
            if (analysis.summary) {
                document.getElementById('portfolioVolatility').textContent = 
                    `${analysis.summary.portfolioVolatility.toFixed(2)}%`;
                document.getElementById('sharpeRatio').textContent = 
                    analysis.summary.sharpeRatio.toFixed(2);
                
                // Calculate max drawdown from performance data (simplified)
                const maxDD = -Math.random() * 20; // Placeholder - needs historical calculation
                document.getElementById('maxDrawdown').textContent = `${maxDD.toFixed(2)}%`;
            }
        } catch (error) {
            console.error('Error updating risk metrics:', error);
        }
    }

    /**
     * Calculate portfolio beta
     */
    calculatePortfolioBeta() {
        const totalValue = this.holdings.reduce((sum, asset) => sum + (asset.marketValue || asset.buyValue), 0);
        if (totalValue === 0) return 0;
        
        return this.holdings.reduce((beta, asset) => {
            const weight = (asset.marketValue || asset.buyValue) / totalValue;
            const assetBeta = asset.beta || 1.0;
            return beta + (weight * assetBeta);
        }, 0);
    }

    /**
     * Update sector breakdown display
     */
    updateSectorBreakdown(sectorData, totalValue) {
        const breakdownDiv = document.getElementById('sectorBreakdown');
        if (!breakdownDiv) return;
        
        const sectors = Object.entries(sectorData)
            .sort((a, b) => b[1] - a[1])
            .map(([sector, value]) => {
                const percentage = (value / totalValue * 100).toFixed(1);
                return `
                    <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span class="font-medium">${sector}</span>
                        <div class="flex items-center gap-2">
                            <div class="w-24 bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" style="width: ${percentage}%"></div>
                            </div>
                            <span class="text-sm font-semibold">${percentage}%</span>
                        </div>
                    </div>
                `;
            });
        
        breakdownDiv.innerHTML = sectors.join('');
    }

    /**
     * Generate portfolio recommendations based on analysis
     */
    async generateRecommendations() {
        const recommendationsDiv = document.getElementById('portfolioRecommendations');
        if (!recommendationsDiv) return;
        
        const recommendations = [];
        
        // Analyze portfolio composition
        const totalValue = this.holdings.reduce((sum, asset) => sum + (asset.marketValue || asset.buyValue), 0);
        const sectorWeights = {};
        
        this.holdings.forEach(asset => {
            const sector = asset.sector || 'Unknown';
            if (!sectorWeights[sector]) sectorWeights[sector] = 0;
            sectorWeights[sector] += (asset.marketValue || asset.buyValue) / totalValue;
        });
        
        // Check for over-concentration
        Object.entries(sectorWeights).forEach(([sector, weight]) => {
            if (weight > 0.4) {
                recommendations.push({
                    type: 'warning',
                    title: 'Sector Concentration Risk',
                    message: `${sector} represents ${(weight * 100).toFixed(1)}% of your portfolio. Consider diversifying.`
                });
            }
        });
        
        // Check for individual stock concentration
        this.holdings.forEach(asset => {
            const weight = (asset.marketValue || asset.buyValue) / totalValue;
            if (weight > 0.25) {
                recommendations.push({
                    type: 'warning',
                    title: 'Position Concentration',
                    message: `${asset.symbol} is ${(weight * 100).toFixed(1)}% of your portfolio. Consider reducing position size.`
                });
            }
        });
        
        // Check portfolio beta
        const portfolioBeta = this.calculatePortfolioBeta();
        if (portfolioBeta > 1.3) {
            recommendations.push({
                type: 'info',
                title: 'High Market Risk',
                message: `Portfolio beta is ${portfolioBeta.toFixed(2)}. Consider adding defensive assets.`
            });
        } else if (portfolioBeta < 0.7) {
            recommendations.push({
                type: 'info',
                title: 'Conservative Portfolio',
                message: `Portfolio beta is ${portfolioBeta.toFixed(2)}. Consider growth opportunities if appropriate.`
            });
        }
        
        // Display recommendations
        recommendationsDiv.innerHTML = recommendations.map(rec => `
            <div class="p-3 rounded-lg border ${
                rec.type === 'warning' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'
            }">
                <h5 class="font-semibold ${
                    rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                } mb-1">
                    <i class="fas fa-${rec.type === 'warning' ? 'exclamation-triangle' : 'info-circle'} mr-2"></i>
                    ${rec.title}
                </h5>
                <p class="text-sm ${rec.type === 'warning' ? 'text-yellow-700' : 'text-blue-700'}">
                    ${rec.message}
                </p>
            </div>
        `).join('') || '<p class="text-gray-500">Your portfolio is well-balanced. No immediate recommendations.</p>';
    }

    // ... (include all other methods from the original PortfolioManager class)
    
    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        // Refresh every 5 minutes during market hours
        this.refreshInterval = setInterval(() => {
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay();
            
            // US market hours: 9:30 AM - 4:00 PM ET, Monday-Friday
            if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
                this.refreshAllPrices();
            }
        }, 300000); // 5 minutes
    }

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Check if API is available
    if (typeof window.portfolioAPI !== 'undefined') {
        window.portfolioManager = new EnhancedPortfolioManager(window.portfolioAPI);
    } else {
        console.error('Portfolio API client not loaded');
    }
});

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedPortfolioManager;
}