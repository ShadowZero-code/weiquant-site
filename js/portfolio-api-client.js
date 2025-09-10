/**
 * Portfolio API Client
 * Handles communication with the Yahoo Finance backend API
 */

class PortfolioAPIClient {
    constructor(baseURL = 'http://localhost:5000') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.cacheTTL = 60000; // 1 minute cache
    }

    /**
     * Get real-time quote for a symbol
     */
    async getQuote(symbol) {
        try {
            const response = await fetch(`${this.baseURL}/api/quote/${symbol}`);
            if (!response.ok) throw new Error(`Failed to fetch quote for ${symbol}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching quote:', error);
            throw error;
        }
    }

    /**
     * Get historical price for a specific date
     */
    async getHistoricalPrice(symbol, date) {
        try {
            const response = await fetch(`${this.baseURL}/api/historical/${symbol}?date=${date}`);
            if (!response.ok) throw new Error(`Failed to fetch historical price for ${symbol}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching historical price:', error);
            throw error;
        }
    }

    /**
     * Get price history for charting
     */
    async getPriceHistory(symbol, period = '1mo', interval = '1d') {
        try {
            const response = await fetch(
                `${this.baseURL}/api/history/${symbol}?period=${period}&interval=${interval}`
            );
            if (!response.ok) throw new Error(`Failed to fetch price history for ${symbol}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching price history:', error);
            throw error;
        }
    }

    /**
     * Get quotes for multiple symbols
     */
    async getBatchQuotes(symbols) {
        try {
            const response = await fetch(`${this.baseURL}/api/batch-quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbols })
            });
            if (!response.ok) throw new Error('Failed to fetch batch quotes');
            return await response.json();
        } catch (error) {
            console.error('Error fetching batch quotes:', error);
            throw error;
        }
    }

    /**
     * Analyze portfolio
     */
    async analyzePortfolio(holdings) {
        try {
            const response = await fetch(`${this.baseURL}/api/portfolio/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ holdings })
            });
            if (!response.ok) throw new Error('Failed to analyze portfolio');
            return await response.json();
        } catch (error) {
            console.error('Error analyzing portfolio:', error);
            throw error;
        }
    }

    /**
     * Get portfolio performance history
     */
    async getPortfolioPerformance(holdings, startDate, endDate) {
        try {
            const response = await fetch(`${this.baseURL}/api/portfolio/performance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ holdings, startDate, endDate })
            });
            if (!response.ok) throw new Error('Failed to get portfolio performance');
            return await response.json();
        } catch (error) {
            console.error('Error fetching portfolio performance:', error);
            throw error;
        }
    }

    /**
     * Validate symbol
     */
    async validateSymbol(symbol) {
        try {
            const response = await fetch(`${this.baseURL}/api/validate/${symbol}`);
            if (!response.ok) throw new Error(`Failed to validate ${symbol}`);
            return await response.json();
        } catch (error) {
            console.error('Error validating symbol:', error);
            return { valid: false, symbol };
        }
    }

    /**
     * Search for symbols
     */
    async searchSymbols(query) {
        try {
            const response = await fetch(`${this.baseURL}/api/search/${query}`);
            if (!response.ok) throw new Error('Search failed');
            return await response.json();
        } catch (error) {
            console.error('Error searching symbols:', error);
            return { results: [] };
        }
    }
}

// Export for use
const portfolioAPI = new PortfolioAPIClient();

// Make available globally
if (typeof window !== 'undefined') {
    window.PortfolioAPIClient = PortfolioAPIClient;
    window.portfolioAPI = portfolioAPI;
}