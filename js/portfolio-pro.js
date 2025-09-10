/**
 * Professional Portfolio Management System
 * Complete implementation with React-style components and advanced financial calculations
 * Version: 2.0.0
 * 
 * Features:
 * - Real-time price updates (simulated Yahoo Finance API)
 * - Comprehensive financial metrics (P&L, CAGR, Sharpe Ratio, Beta)
 * - Portfolio risk analytics (VaR, Volatility, Max Drawdown)
 * - Persistent storage using localStorage
 * - Chart.js visualizations
 * - Export functionality (CSV/JSON)
 */

class PortfolioManager {
    constructor() {
        this.positions = [];
        this.marketData = {};
        this.historicalData = {};
        this.sectorMap = {};
        this.riskFreeRate = 0.05; // 5% annual risk-free rate
        this.marketReturn = 0.10; // 10% expected market return
        this.charts = {};
        
        this.initialize();
    }

    initialize() {
        // Load saved positions from localStorage
        this.loadPositions();
        
        // Set default date to today
        document.getElementById('buyDateInput').valueAsDate = new Date();
        
        // Initialize charts
        this.initializeCharts();
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        // Initial data load
        this.refreshPrices();
    }

    // ========== Data Management ==========
    
    loadPositions() {
        const saved = localStorage.getItem('portfolioPositions');
        if (saved) {
            this.positions = JSON.parse(saved);
        }
    }

    savePositions() {
        localStorage.setItem('portfolioPositions', JSON.stringify(this.positions));
    }

    // ========== Position Management ==========
    
    async addPosition() {
        const symbol = document.getElementById('symbolInput').value.toUpperCase();
        const quantity = parseFloat(document.getElementById('quantityInput').value);
        const buyDate = document.getElementById('buyDateInput').value;
        let buyPrice = parseFloat(document.getElementById('buyPriceInput').value);
        
        // Validation
        if (!symbol || !quantity || !buyDate) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Check for duplicate position
        const existing = this.positions.find(p => p.symbol === symbol);
        if (existing) {
            if (confirm(`You already have ${symbol} in your portfolio. Do you want to add to this position?`)) {
                // Average down/up calculation
                const totalCost = (existing.quantity * existing.buyPrice) + (quantity * (buyPrice || 100));
                const totalQuantity = existing.quantity + quantity;
                existing.quantity = totalQuantity;
                existing.buyPrice = totalCost / totalQuantity;
                existing.lastUpdated = new Date().toISOString();
            } else {
                return;
            }
        } else {
            // Fetch buy price if not provided
            if (!buyPrice) {
                buyPrice = await this.fetchHistoricalPrice(symbol, buyDate);
                if (!buyPrice) {
                    buyPrice = 100; // Default fallback
                }
                document.getElementById('buyPriceInput').value = buyPrice.toFixed(2);
            }
            
            // Add new position
            const position = {
                id: Date.now().toString(),
                symbol: symbol,
                name: this.getCompanyName(symbol),
                quantity: quantity,
                buyPrice: buyPrice,
                buyDate: buyDate,
                currentPrice: buyPrice,
                previousClose: buyPrice,
                sector: this.getSector(symbol),
                addedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            
            this.positions.push(position);
        }
        
        // Save and refresh
        this.savePositions();
        this.clearForm();
        await this.refreshPrices();
        this.updateUI();
        
        this.showNotification(`Successfully added ${symbol} to portfolio`, 'success');
    }

    removePosition(positionId) {
        if (confirm('Are you sure you want to remove this position?')) {
            this.positions = this.positions.filter(p => p.id !== positionId);
            this.savePositions();
            this.updateUI();
            this.showNotification('Position removed successfully', 'success');
        }
    }

    editPosition(positionId) {
        const position = this.positions.find(p => p.id === positionId);
        if (position) {
            document.getElementById('symbolInput').value = position.symbol;
            document.getElementById('quantityInput').value = position.quantity;
            document.getElementById('buyDateInput').value = position.buyDate;
            document.getElementById('buyPriceInput').value = position.buyPrice;
            
            // Remove the position for re-adding
            this.positions = this.positions.filter(p => p.id !== positionId);
            this.savePositions();
            this.updateUI();
        }
    }

    // ========== Market Data (Simulated) ==========
    
    async fetchHistoricalPrice(symbol, date) {
        // Simulate fetching historical price
        // In production, this would call your backend API
        const basePrice = this.getBasePrice(symbol);
        const randomVariation = 0.9 + Math.random() * 0.2; // ±10% variation
        return basePrice * randomVariation;
    }

    async refreshPrices() {
        this.showLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update prices for all positions
        for (let position of this.positions) {
            // Simulate price movement
            const previousPrice = position.currentPrice || position.buyPrice;
            const dailyChange = (Math.random() - 0.5) * 0.04; // ±2% daily change
            const newPrice = previousPrice * (1 + dailyChange);
            
            position.previousClose = position.currentPrice || position.buyPrice;
            position.currentPrice = newPrice;
            position.lastUpdated = new Date().toISOString();
            
            // Update market data cache
            this.marketData[position.symbol] = {
                price: newPrice,
                previousClose: position.previousClose,
                change: newPrice - position.previousClose,
                changePercent: ((newPrice - position.previousClose) / position.previousClose) * 100
            };
        }
        
        this.savePositions();
        this.updateUI();
        this.showLoading(false);
        
        // Update last refresh time
        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = 
            `Updated: ${now.toLocaleTimeString()}`;
    }

    // ========== Financial Calculations ==========
    
    calculatePortfolioMetrics() {
        let totalValue = 0;
        let totalCost = 0;
        let todayChange = 0;
        let weights = [];
        let returns = [];
        
        for (let position of this.positions) {
            const marketValue = position.quantity * position.currentPrice;
            const cost = position.quantity * position.buyPrice;
            const dailyChange = position.quantity * (position.currentPrice - position.previousClose);
            
            totalValue += marketValue;
            totalCost += cost;
            todayChange += dailyChange;
            
            // Calculate individual returns for risk metrics
            const positionReturn = (position.currentPrice - position.buyPrice) / position.buyPrice;
            returns.push(positionReturn);
            weights.push(marketValue);
        }
        
        // Normalize weights
        if (totalValue > 0) {
            weights = weights.map(w => w / totalValue);
        }
        
        // Calculate portfolio metrics
        const totalPnL = totalValue - totalCost;
        const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;
        const todayChangePercent = totalValue > 0 ? (todayChange / (totalValue - todayChange)) * 100 : 0;
        
        // Calculate risk metrics
        const portfolioReturn = this.calculateWeightedReturn(returns, weights);
        const portfolioVolatility = this.calculateVolatility(returns, weights);
        const sharpeRatio = this.calculateSharpeRatio(portfolioReturn, portfolioVolatility);
        const portfolioBeta = this.calculatePortfolioBeta(returns, weights);
        const maxDrawdown = this.calculateMaxDrawdown();
        const valueAtRisk = this.calculateVaR(totalValue, portfolioVolatility);
        
        return {
            totalValue,
            totalCost,
            totalPnL,
            totalPnLPercent,
            todayChange,
            todayChangePercent,
            portfolioReturn: portfolioReturn * 100,
            portfolioVolatility: portfolioVolatility * 100,
            sharpeRatio,
            portfolioBeta,
            maxDrawdown: maxDrawdown * 100,
            valueAtRisk
        };
    }

    calculateCAGR(position) {
        const buyDate = new Date(position.buyDate);
        const currentDate = new Date();
        const daysHeld = (currentDate - buyDate) / (1000 * 60 * 60 * 24);
        const yearsHeld = daysHeld / 365.25;
        
        if (yearsHeld <= 0 || position.buyPrice <= 0) return 0;
        
        const cagr = (Math.pow(position.currentPrice / position.buyPrice, 1 / yearsHeld) - 1) * 100;
        return cagr;
    }

    calculateWeightedReturn(returns, weights) {
        let weightedReturn = 0;
        for (let i = 0; i < returns.length; i++) {
            weightedReturn += returns[i] * weights[i];
        }
        return weightedReturn;
    }

    calculateVolatility(returns, weights) {
        // Simplified volatility calculation
        // In production, use covariance matrix for accurate portfolio volatility
        const weightedReturns = returns.map((r, i) => r * weights[i]);
        const mean = weightedReturns.reduce((a, b) => a + b, 0) / weightedReturns.length;
        const squaredDiffs = weightedReturns.map(r => Math.pow(r - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        return Math.sqrt(variance * 252); // Annualized
    }

    calculateSharpeRatio(portfolioReturn, portfolioVolatility) {
        if (portfolioVolatility === 0) return 0;
        return (portfolioReturn - this.riskFreeRate) / portfolioVolatility;
    }

    calculatePortfolioBeta(returns, weights) {
        // Simplified beta calculation
        // Beta = Covariance(Portfolio, Market) / Variance(Market)
        // Using approximation: weighted average of individual betas
        const betas = {
            'AAPL': 1.2, 'MSFT': 0.9, 'GOOGL': 1.1, 'AMZN': 1.3,
            'NVDA': 1.6, 'TSLA': 2.0, 'META': 1.4, 'BRK.B': 0.8
        };
        
        let portfolioBeta = 0;
        for (let i = 0; i < this.positions.length; i++) {
            const symbol = this.positions[i].symbol;
            const beta = betas[symbol] || 1.0;
            portfolioBeta += beta * weights[i];
        }
        return portfolioBeta;
    }

    calculateMaxDrawdown() {
        // Simplified max drawdown calculation
        if (this.positions.length === 0) return 0;
        
        let maxDrawdown = 0;
        for (let position of this.positions) {
            const drawdown = (position.buyPrice - position.currentPrice) / position.buyPrice;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
        return maxDrawdown;
    }

    calculateVaR(portfolioValue, volatility, confidenceLevel = 0.95) {
        // Value at Risk calculation
        // VaR = Portfolio Value * Z-score * Volatility * sqrt(Time)
        const zScore = 1.645; // 95% confidence level
        const dailyVaR = portfolioValue * zScore * (volatility / Math.sqrt(252));
        return dailyVaR;
    }

    // ========== UI Updates ==========
    
    updateUI() {
        this.updateMetricsCards();
        this.updateHoldingsTable();
        this.updateCharts();
    }

    updateMetricsCards() {
        const metrics = this.calculatePortfolioMetrics();
        
        // Update metric cards
        document.getElementById('totalValue').textContent = this.formatCurrency(metrics.totalValue);
        document.getElementById('totalValueChange').textContent = 
            `${metrics.todayChange >= 0 ? '+' : ''}${this.formatCurrency(metrics.todayChange)} (${metrics.todayChangePercent.toFixed(2)}%)`;
        document.getElementById('totalValueChange').className = 
            metrics.todayChange >= 0 ? 'positive' : 'negative';
        
        document.getElementById('totalPnL').textContent = this.formatCurrency(metrics.totalPnL);
        document.getElementById('totalPnLPercent').textContent = `${metrics.totalPnLPercent.toFixed(2)}%`;
        
        document.getElementById('todayChange').textContent = this.formatCurrency(metrics.todayChange);
        document.getElementById('todayChangePercent').textContent = `${metrics.todayChangePercent.toFixed(2)}%`;
        
        document.getElementById('sharpeRatio').textContent = metrics.sharpeRatio.toFixed(2);
        document.getElementById('portfolioBeta').textContent = metrics.portfolioBeta.toFixed(2);
        
        // Update risk metrics
        document.getElementById('annualVolatility').textContent = `${metrics.portfolioVolatility.toFixed(2)}%`;
        document.getElementById('maxDrawdown').textContent = `${metrics.maxDrawdown.toFixed(2)}%`;
        document.getElementById('valueAtRisk').textContent = this.formatCurrency(metrics.valueAtRisk);
        document.getElementById('expectedReturn').textContent = `${metrics.portfolioReturn.toFixed(2)}%`;
    }

    updateHoldingsTable() {
        const tbody = document.getElementById('holdingsTableBody');
        const metrics = this.calculatePortfolioMetrics();
        
        if (this.positions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="12" class="text-center py-8 text-gray-500">
                        No positions in portfolio. Add your first position above.
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = this.positions.map(position => {
            const marketValue = position.quantity * position.currentPrice;
            const pnl = (position.currentPrice - position.buyPrice) * position.quantity;
            const pnlPercent = ((position.currentPrice - position.buyPrice) / position.buyPrice) * 100;
            const dailyChange = (position.currentPrice - position.previousClose) * position.quantity;
            const dailyChangePercent = ((position.currentPrice - position.previousClose) / position.previousClose) * 100;
            const weight = (marketValue / metrics.totalValue) * 100;
            const cagr = this.calculateCAGR(position);
            
            return `
                <tr>
                    <td class="px-4 py-3 font-medium">${position.symbol}</td>
                    <td class="px-4 py-3 text-gray-600">${position.name}</td>
                    <td class="px-4 py-3 text-right">${position.quantity.toFixed(3)}</td>
                    <td class="px-4 py-3 text-right">${this.formatCurrency(position.buyPrice)}</td>
                    <td class="px-4 py-3 text-right">${this.formatCurrency(position.currentPrice)}</td>
                    <td class="px-4 py-3 text-right font-medium">${this.formatCurrency(marketValue)}</td>
                    <td class="px-4 py-3 text-right ${pnl >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(pnl)}
                    </td>
                    <td class="px-4 py-3 text-right ${pnlPercent >= 0 ? 'positive' : 'negative'}">
                        ${pnlPercent.toFixed(2)}%
                    </td>
                    <td class="px-4 py-3 text-right ${dailyChange >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(dailyChange)}
                        <br>
                        <span class="text-xs">${dailyChangePercent.toFixed(2)}%</span>
                    </td>
                    <td class="px-4 py-3 text-right">${cagr.toFixed(2)}%</td>
                    <td class="px-4 py-3 text-right">${weight.toFixed(2)}%</td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="portfolioApp.editPosition('${position.id}')" 
                                class="text-blue-600 hover:text-blue-800 mr-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="portfolioApp.removePosition('${position.id}')" 
                                class="text-red-600 hover:text-red-800">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ========== Charts ==========
    
    initializeCharts() {
        // Performance Chart
        const performanceCtx = document.getElementById('performanceChart').getContext('2d');
        this.charts.performance = new Chart(performanceCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });

        // Allocation Chart
        const allocationCtx = document.getElementById('allocationChart').getContext('2d');
        this.charts.allocation = new Chart(allocationCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(139, 92, 246)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                        'rgb(107, 114, 128)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Sector Chart
        const sectorCtx = document.getElementById('sectorChart').getContext('2d');
        this.charts.sector = new Chart(sectorCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sector Allocation',
                    data: [],
                    backgroundColor: 'rgba(59, 130, 246, 0.6)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        const metrics = this.calculatePortfolioMetrics();
        
        // Update allocation chart
        const allocationData = this.positions.map(p => ({
            label: p.symbol,
            value: p.quantity * p.currentPrice
        }));
        
        this.charts.allocation.data.labels = allocationData.map(d => d.label);
        this.charts.allocation.data.datasets[0].data = allocationData.map(d => d.value);
        this.charts.allocation.update();
        
        // Update performance chart (simulate historical data)
        const days = 30;
        const dates = [];
        const values = [];
        const today = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString());
            
            // Simulate historical portfolio value
            const randomFactor = 0.95 + Math.random() * 0.1;
            values.push(metrics.totalValue * randomFactor);
        }
        
        this.charts.performance.data.labels = dates;
        this.charts.performance.data.datasets[0].data = values;
        this.charts.performance.update();
        
        // Update sector chart
        const sectorData = this.calculateSectorBreakdown();
        this.charts.sector.data.labels = Object.keys(sectorData);
        this.charts.sector.data.datasets[0].data = Object.values(sectorData);
        this.charts.sector.update();
    }

    calculateSectorBreakdown() {
        const sectors = {};
        const metrics = this.calculatePortfolioMetrics();
        
        for (let position of this.positions) {
            const sector = position.sector || 'Other';
            const value = position.quantity * position.currentPrice;
            const weight = (value / metrics.totalValue) * 100;
            
            if (sectors[sector]) {
                sectors[sector] += weight;
            } else {
                sectors[sector] = weight;
            }
        }
        
        return sectors;
    }

    // ========== Utility Functions ==========
    
    getCompanyName(symbol) {
        const names = {
            'AAPL': 'Apple Inc.',
            'MSFT': 'Microsoft Corporation',
            'GOOGL': 'Alphabet Inc.',
            'AMZN': 'Amazon.com Inc.',
            'NVDA': 'NVIDIA Corporation',
            'TSLA': 'Tesla Inc.',
            'META': 'Meta Platforms Inc.',
            'BRK.B': 'Berkshire Hathaway Inc.',
            'V': 'Visa Inc.',
            'JNJ': 'Johnson & Johnson',
            'WMT': 'Walmart Inc.',
            'JPM': 'JPMorgan Chase & Co.',
            'PG': 'Procter & Gamble Co.',
            'UNH': 'UnitedHealth Group Inc.',
            'DIS': 'Walt Disney Co.',
            'HD': 'Home Depot Inc.',
            'MA': 'Mastercard Inc.',
            'BAC': 'Bank of America Corp.',
            'NFLX': 'Netflix Inc.',
            'ADBE': 'Adobe Inc.'
        };
        return names[symbol] || symbol;
    }

    getSector(symbol) {
        const sectors = {
            'AAPL': 'Technology',
            'MSFT': 'Technology',
            'GOOGL': 'Technology',
            'AMZN': 'Consumer Discretionary',
            'NVDA': 'Technology',
            'TSLA': 'Consumer Discretionary',
            'META': 'Technology',
            'BRK.B': 'Financials',
            'V': 'Financials',
            'JNJ': 'Healthcare',
            'WMT': 'Consumer Staples',
            'JPM': 'Financials',
            'PG': 'Consumer Staples',
            'UNH': 'Healthcare',
            'DIS': 'Communication Services',
            'HD': 'Consumer Discretionary',
            'MA': 'Financials',
            'BAC': 'Financials',
            'NFLX': 'Communication Services',
            'ADBE': 'Technology'
        };
        return sectors[symbol] || 'Other';
    }

    getBasePrice(symbol) {
        const prices = {
            'AAPL': 185.50,
            'MSFT': 420.30,
            'GOOGL': 155.75,
            'AMZN': 178.20,
            'NVDA': 882.40,
            'TSLA': 245.60,
            'META': 505.80,
            'BRK.B': 425.30,
            'V': 275.40,
            'JNJ': 155.20,
            'WMT': 195.60,
            'JPM': 205.80,
            'PG': 165.30,
            'UNH': 525.40,
            'DIS': 110.50,
            'HD': 385.20,
            'MA': 485.60,
            'BAC': 35.80,
            'NFLX': 625.30,
            'ADBE': 635.20
        };
        return prices[symbol] || 100;
    }

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    }

    clearForm() {
        document.getElementById('symbolInput').value = '';
        document.getElementById('quantityInput').value = '';
        document.getElementById('buyDateInput').valueAsDate = new Date();
        document.getElementById('buyPriceInput').value = '';
    }

    filterHoldings(searchTerm) {
        const rows = document.querySelectorAll('#holdingsTableBody tr');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    showNotification(message, type = 'info') {
        // Simple notification (can be enhanced with a toast library)
        const colors = {
            'success': 'bg-green-500',
            'error': 'bg-red-500',
            'info': 'bg-blue-500',
            'warning': 'bg-yellow-500'
        };
        
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.toggle('hidden', !show);
    }

    startAutoRefresh() {
        // Auto-refresh every 5 minutes during market hours
        setInterval(() => {
            const now = new Date();
            const hours = now.getHours();
            const day = now.getDay();
            
            // Check if market is open (9:30 AM - 4:00 PM EST, Mon-Fri)
            const isMarketOpen = day >= 1 && day <= 5 && hours >= 9 && hours < 16;
            
            if (isMarketOpen) {
                this.refreshPrices();
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // ========== Export Functions ==========
    
    exportData() {
        const metrics = this.calculatePortfolioMetrics();
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                portfolioValue: metrics.totalValue,
                totalPnL: metrics.totalPnL,
                totalPnLPercent: metrics.totalPnLPercent
            },
            positions: this.positions.map(p => ({
                symbol: p.symbol,
                name: p.name,
                quantity: p.quantity,
                buyPrice: p.buyPrice,
                buyDate: p.buyDate,
                currentPrice: p.currentPrice,
                marketValue: p.quantity * p.currentPrice,
                pnl: (p.currentPrice - p.buyPrice) * p.quantity,
                pnlPercent: ((p.currentPrice - p.buyPrice) / p.buyPrice) * 100,
                cagr: this.calculateCAGR(p)
            }))
        };
        
        // Export as JSON
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Portfolio exported successfully', 'success');
    }

    exportCSV() {
        const headers = ['Symbol', 'Name', 'Quantity', 'Buy Price', 'Buy Date', 'Current Price', 'Market Value', 'P&L', 'P&L %', 'CAGR'];
        const rows = this.positions.map(p => [
            p.symbol,
            p.name,
            p.quantity,
            p.buyPrice,
            p.buyDate,
            p.currentPrice,
            p.quantity * p.currentPrice,
            (p.currentPrice - p.buyPrice) * p.quantity,
            ((p.currentPrice - p.buyPrice) / p.buyPrice) * 100,
            this.calculateCAGR(p)
        ]);
        
        const csv = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the portfolio manager when the page loads
let portfolioApp;
document.addEventListener('DOMContentLoaded', () => {
    portfolioApp = new PortfolioManager();
});