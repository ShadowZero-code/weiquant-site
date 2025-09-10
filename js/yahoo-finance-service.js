/**
 * Yahoo Finance Service
 * Provides methods to fetch real-time and historical stock data
 * Note: In production, these calls should be made from a backend server to avoid CORS issues
 */

class YahooFinanceService {
    constructor() {
        this.baseUrl = 'https://query1.finance.yahoo.com';
        this.cache = new Map();
        this.cacheTimeout = 60000; // 1 minute cache
    }

    /**
     * Get real-time quote for a symbol
     */
    async getQuote(symbol) {
        const cacheKey = `quote_${symbol}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // For demonstration, using mock data
            // In production, use backend proxy to avoid CORS
            const mockData = this.generateMockQuote(symbol);
            this.setCache(cacheKey, mockData);
            return mockData;

            // Production code would be:
            // const response = await fetch(`/api/yahoo/quote/${symbol}`);
            // const data = await response.json();
            // this.setCache(cacheKey, data);
            // return data;
        } catch (error) {
            console.error(`Error fetching quote for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Get historical prices for a symbol
     */
    async getHistoricalPrices(symbol, startDate, endDate) {
        const cacheKey = `historical_${symbol}_${startDate}_${endDate}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // For demonstration, using mock data
            const mockData = this.generateMockHistoricalData(symbol, startDate, endDate);
            this.setCache(cacheKey, mockData);
            return mockData;

            // Production code:
            // const response = await fetch(`/api/yahoo/historical/${symbol}?start=${startDate}&end=${endDate}`);
            // const data = await response.json();
            // this.setCache(cacheKey, data);
            // return data;
        } catch (error) {
            console.error(`Error fetching historical data for ${symbol}:`, error);
            throw error;
        }
    }

    /**
     * Get multiple quotes at once
     */
    async getBatchQuotes(symbols) {
        const promises = symbols.map(symbol => this.getQuote(symbol));
        return Promise.all(promises);
    }

    /**
     * Get market summary
     */
    async getMarketSummary() {
        const indices = ['SPY', 'QQQ', 'DIA', 'IWM'];
        const quotes = await this.getBatchQuotes(indices);
        
        return {
            sp500: quotes[0],
            nasdaq: quotes[1],
            dow: quotes[2],
            russell: quotes[3],
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get company profile
     */
    async getCompanyProfile(symbol) {
        // Mock company data
        const profiles = {
            'AAPL': {
                name: 'Apple Inc.',
                sector: 'Technology',
                industry: 'Consumer Electronics',
                marketCap: 3000000000000,
                pe: 28.5,
                beta: 1.2,
                dividend: 0.96,
                description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.'
            },
            'NVDA': {
                name: 'NVIDIA Corporation',
                sector: 'Technology',
                industry: 'Semiconductors',
                marketCap: 1200000000000,
                pe: 65.3,
                beta: 1.5,
                dividend: 0.16,
                description: 'NVIDIA Corporation provides graphics, and computing and networking solutions worldwide.'
            },
            'MSFT': {
                name: 'Microsoft Corporation',
                sector: 'Technology',
                industry: 'Software',
                marketCap: 2800000000000,
                pe: 32.1,
                beta: 0.9,
                dividend: 2.72,
                description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.'
            },
            'GOOGL': {
                name: 'Alphabet Inc.',
                sector: 'Technology',
                industry: 'Internet Services',
                marketCap: 1700000000000,
                pe: 25.8,
                beta: 1.1,
                dividend: 0,
                description: 'Alphabet Inc. offers various products and platforms worldwide, including Google Search, YouTube, and Google Cloud.'
            },
            'AMZN': {
                name: 'Amazon.com Inc.',
                sector: 'Consumer Cyclical',
                industry: 'E-Commerce',
                marketCap: 1600000000000,
                pe: 48.2,
                beta: 1.3,
                dividend: 0,
                description: 'Amazon.com, Inc. engages in the retail sale of consumer products and subscriptions worldwide.'
            }
        };

        return profiles[symbol] || {
            name: symbol,
            sector: 'Unknown',
            industry: 'Unknown',
            marketCap: Math.random() * 100000000000,
            pe: 15 + Math.random() * 20,
            beta: 0.8 + Math.random() * 0.8,
            dividend: Math.random() * 3,
            description: `${symbol} is a publicly traded company.`
        };
    }

    /**
     * Calculate technical indicators
     */
    calculateTechnicalIndicators(prices, period = 20) {
        if (!prices || prices.length < period) return null;

        const recentPrices = prices.slice(-period);
        const sma = recentPrices.reduce((sum, p) => sum + p, 0) / period;
        
        // Calculate standard deviation
        const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period;
        const stdDev = Math.sqrt(variance);
        
        // Bollinger Bands
        const upperBand = sma + (2 * stdDev);
        const lowerBand = sma - (2 * stdDev);
        
        // RSI (simplified)
        const changes = [];
        for (let i = 1; i < recentPrices.length; i++) {
            changes.push(recentPrices[i] - recentPrices[i - 1]);
        }
        const gains = changes.filter(c => c > 0);
        const losses = changes.filter(c => c < 0).map(Math.abs);
        const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / changes.length : 0;
        const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / changes.length : 0.001;
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        
        return {
            sma,
            upperBand,
            lowerBand,
            rsi,
            currentPrice: prices[prices.length - 1],
            signal: rsi > 70 ? 'OVERBOUGHT' : rsi < 30 ? 'OVERSOLD' : 'NEUTRAL'
        };
    }

    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Mock data generators for demonstration
    generateMockQuote(symbol) {
        const basePrice = 100 + Math.random() * 400;
        const change = (Math.random() - 0.5) * 10;
        const changePercent = (change / basePrice) * 100;
        
        return {
            symbol,
            price: basePrice,
            previousClose: basePrice - change,
            open: basePrice - change + (Math.random() - 0.5) * 2,
            dayHigh: basePrice + Math.random() * 5,
            dayLow: basePrice - Math.random() * 5,
            volume: Math.floor(Math.random() * 100000000),
            avgVolume: Math.floor(Math.random() * 80000000),
            marketCap: Math.floor(basePrice * 1000000000 * (1 + Math.random() * 10)),
            pe: 15 + Math.random() * 25,
            eps: basePrice / (15 + Math.random() * 25),
            week52High: basePrice * 1.3,
            week52Low: basePrice * 0.7,
            change,
            changePercent,
            timestamp: new Date().toISOString()
        };
    }

    generateMockHistoricalData(symbol, startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        
        const prices = [];
        let currentPrice = 100 + Math.random() * 200;
        
        for (let i = 0; i <= days; i++) {
            const date = new Date(start);
            date.setDate(date.getDate() + i);
            
            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            const change = (Math.random() - 0.5) * 5;
            currentPrice = Math.max(10, currentPrice + change);
            
            prices.push({
                date: date.toISOString().split('T')[0],
                open: currentPrice - Math.random() * 2,
                high: currentPrice + Math.random() * 3,
                low: currentPrice - Math.random() * 3,
                close: currentPrice,
                volume: Math.floor(Math.random() * 100000000)
            });
        }
        
        return prices;
    }

    /**
     * Get sector performance
     */
    async getSectorPerformance() {
        const sectors = [
            { name: 'Technology', symbol: 'XLK', change: 2.3 },
            { name: 'Healthcare', symbol: 'XLV', change: 1.2 },
            { name: 'Financials', symbol: 'XLF', change: -0.5 },
            { name: 'Energy', symbol: 'XLE', change: 3.1 },
            { name: 'Consumer Discretionary', symbol: 'XLY', change: 0.8 },
            { name: 'Consumer Staples', symbol: 'XLP', change: -0.2 },
            { name: 'Industrials', symbol: 'XLI', change: 1.5 },
            { name: 'Materials', symbol: 'XLB', change: 2.0 },
            { name: 'Real Estate', symbol: 'XLRE', change: -1.1 },
            { name: 'Utilities', symbol: 'XLU', change: 0.3 },
            { name: 'Communication Services', symbol: 'XLC', change: 1.8 }
        ];

        return sectors.map(sector => ({
            ...sector,
            change: sector.change + (Math.random() - 0.5) * 2
        }));
    }
}

// Export for use in other modules
const yahooFinanceService = new YahooFinanceService();

// Make available globally if needed
if (typeof window !== 'undefined') {
    window.YahooFinanceService = YahooFinanceService;
    window.yahooFinanceService = yahooFinanceService;
}