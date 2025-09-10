/**
 * Backtest Module - Historical Strategy Testing
 * Provides basic backtesting functionality for portfolio strategies
 */

class BacktestEngine {
    constructor() {
        this.historicalData = [];
        this.strategies = {
            'buyAndHold': this.buyAndHoldStrategy,
            'momentum': this.momentumStrategy,
            'meanReversion': this.meanReversionStrategy,
            'macdCrossover': this.macdStrategy
        };
        this.results = null;
    }

    /**
     * Generate simulated historical data for backtesting
     * @param {number} days - Number of historical days
     * @param {number} startPrice - Initial price
     * @param {number} volatility - Daily volatility (0-1)
     * @returns {Array} Historical price data
     */
    generateHistoricalData(days = 252, startPrice = 100, volatility = 0.02) {
        const data = [];
        let currentPrice = startPrice;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        for (let i = 0; i < days; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            
            // Generate realistic price movement
            const dailyReturn = (Math.random() - 0.5) * 2 * volatility;
            const trendComponent = 0.0002; // Small upward bias
            currentPrice = currentPrice * (1 + dailyReturn + trendComponent);
            
            // Add volume (simulated)
            const volume = Math.floor(1000000 + Math.random() * 500000);
            
            data.push({
                date: date.toISOString().split('T')[0],
                open: currentPrice * (1 + (Math.random() - 0.5) * 0.01),
                high: currentPrice * (1 + Math.random() * 0.02),
                low: currentPrice * (1 - Math.random() * 0.02),
                close: currentPrice,
                volume: volume,
                returns: dailyReturn + trendComponent
            });
        }
        
        return data;
    }

    /**
     * Load real historical data from API or storage
     * @param {string} symbol - Stock symbol
     * @param {string} startDate - Start date
     * @param {string} endDate - End date
     */
    async loadHistoricalData(symbol, startDate, endDate) {
        // In a real implementation, this would fetch from a data provider
        // For now, generate simulated data
        const days = Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        this.historicalData = this.generateHistoricalData(days);
        return this.historicalData;
    }

    /**
     * Buy and Hold Strategy
     * @param {Array} data - Historical price data
     * @param {Object} params - Strategy parameters
     */
    buyAndHoldStrategy(data, params = {}) {
        const initialCapital = params.initialCapital || 10000;
        const trades = [];
        
        // Buy on first day
        const buyPrice = data[0].close;
        const shares = Math.floor(initialCapital / buyPrice);
        const buyValue = shares * buyPrice;
        
        trades.push({
            date: data[0].date,
            action: 'BUY',
            price: buyPrice,
            shares: shares,
            value: buyValue,
            cash: initialCapital - buyValue
        });
        
        // Track portfolio value
        const portfolioValues = data.map(day => ({
            date: day.date,
            value: shares * day.close + (initialCapital - buyValue),
            price: day.close
        }));
        
        return {
            trades: trades,
            portfolioValues: portfolioValues,
            finalValue: portfolioValues[portfolioValues.length - 1].value
        };
    }

    /**
     * Momentum Strategy - Buy when price rises above moving average
     * @param {Array} data - Historical price data
     * @param {Object} params - Strategy parameters
     */
    momentumStrategy(data, params = {}) {
        const initialCapital = params.initialCapital || 10000;
        const maPeriod = params.maPeriod || 20;
        const trades = [];
        let position = 0;
        let cash = initialCapital;
        const portfolioValues = [];
        
        for (let i = maPeriod; i < data.length; i++) {
            // Calculate moving average
            const ma = data.slice(i - maPeriod, i)
                .reduce((sum, d) => sum + d.close, 0) / maPeriod;
            
            const currentPrice = data[i].close;
            
            // Buy signal: price crosses above MA
            if (position === 0 && currentPrice > ma * 1.02) {
                const shares = Math.floor(cash / currentPrice);
                if (shares > 0) {
                    position = shares;
                    cash -= shares * currentPrice;
                    trades.push({
                        date: data[i].date,
                        action: 'BUY',
                        price: currentPrice,
                        shares: shares,
                        value: shares * currentPrice,
                        cash: cash
                    });
                }
            }
            // Sell signal: price falls below MA
            else if (position > 0 && currentPrice < ma * 0.98) {
                cash += position * currentPrice;
                trades.push({
                    date: data[i].date,
                    action: 'SELL',
                    price: currentPrice,
                    shares: position,
                    value: position * currentPrice,
                    cash: cash
                });
                position = 0;
            }
            
            portfolioValues.push({
                date: data[i].date,
                value: position * currentPrice + cash,
                price: currentPrice,
                ma: ma
            });
        }
        
        // Close any open position
        if (position > 0) {
            const lastPrice = data[data.length - 1].close;
            cash += position * lastPrice;
        }
        
        return {
            trades: trades,
            portfolioValues: portfolioValues,
            finalValue: cash
        };
    }

    /**
     * Mean Reversion Strategy
     * @param {Array} data - Historical price data
     * @param {Object} params - Strategy parameters
     */
    meanReversionStrategy(data, params = {}) {
        const initialCapital = params.initialCapital || 10000;
        const lookback = params.lookback || 20;
        const zScoreThreshold = params.zScoreThreshold || 2;
        const trades = [];
        let position = 0;
        let cash = initialCapital;
        const portfolioValues = [];
        
        for (let i = lookback; i < data.length; i++) {
            const prices = data.slice(i - lookback, i).map(d => d.close);
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const std = Math.sqrt(prices.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / prices.length);
            const zScore = (data[i].close - mean) / std;
            
            // Buy when oversold (z-score < -threshold)
            if (position === 0 && zScore < -zScoreThreshold) {
                const shares = Math.floor(cash / data[i].close);
                if (shares > 0) {
                    position = shares;
                    cash -= shares * data[i].close;
                    trades.push({
                        date: data[i].date,
                        action: 'BUY',
                        price: data[i].close,
                        shares: shares,
                        zScore: zScore
                    });
                }
            }
            // Sell when overbought or back to mean
            else if (position > 0 && (zScore > 0 || zScore > zScoreThreshold)) {
                cash += position * data[i].close;
                trades.push({
                    date: data[i].date,
                    action: 'SELL',
                    price: data[i].close,
                    shares: position,
                    zScore: zScore
                });
                position = 0;
            }
            
            portfolioValues.push({
                date: data[i].date,
                value: position * data[i].close + cash,
                zScore: zScore
            });
        }
        
        return {
            trades: trades,
            portfolioValues: portfolioValues,
            finalValue: position * data[data.length - 1].close + cash
        };
    }

    /**
     * MACD Crossover Strategy
     * @param {Array} data - Historical price data
     * @param {Object} params - Strategy parameters
     */
    macdStrategy(data, params = {}) {
        const initialCapital = params.initialCapital || 10000;
        const fastPeriod = params.fastPeriod || 12;
        const slowPeriod = params.slowPeriod || 26;
        const signalPeriod = params.signalPeriod || 9;
        
        // Calculate MACD
        const macdData = this.calculateMACD(data, fastPeriod, slowPeriod, signalPeriod);
        
        const trades = [];
        let position = 0;
        let cash = initialCapital;
        const portfolioValues = [];
        
        for (let i = 0; i < macdData.length; i++) {
            const macd = macdData[i];
            if (!macd.signal) continue;
            
            // Buy signal: MACD crosses above signal
            if (position === 0 && macd.macd > macd.signal && i > 0 && macdData[i-1].macd <= macdData[i-1].signal) {
                const shares = Math.floor(cash / macd.price);
                if (shares > 0) {
                    position = shares;
                    cash -= shares * macd.price;
                    trades.push({
                        date: macd.date,
                        action: 'BUY',
                        price: macd.price,
                        shares: shares
                    });
                }
            }
            // Sell signal: MACD crosses below signal
            else if (position > 0 && macd.macd < macd.signal && i > 0 && macdData[i-1].macd >= macdData[i-1].signal) {
                cash += position * macd.price;
                trades.push({
                    date: macd.date,
                    action: 'SELL',
                    price: macd.price,
                    shares: position
                });
                position = 0;
            }
            
            portfolioValues.push({
                date: macd.date,
                value: position * macd.price + cash,
                macd: macd.macd,
                signal: macd.signal
            });
        }
        
        return {
            trades: trades,
            portfolioValues: portfolioValues,
            finalValue: position * macdData[macdData.length - 1].price + cash
        };
    }

    /**
     * Calculate MACD indicator
     */
    calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
        const prices = data.map(d => d.close);
        const emaFast = this.calculateEMA(prices, fastPeriod);
        const emaSlow = this.calculateEMA(prices, slowPeriod);
        
        const macdLine = emaFast.map((fast, i) => ({
            date: data[i].date,
            price: data[i].close,
            macd: fast - emaSlow[i]
        }));
        
        const signalLine = this.calculateEMA(macdLine.map(m => m.macd), signalPeriod);
        
        return macdLine.map((m, i) => ({
            ...m,
            signal: signalLine[i]
        }));
    }

    /**
     * Calculate Exponential Moving Average
     */
    calculateEMA(data, period) {
        const k = 2 / (period + 1);
        const ema = [data[0]];
        
        for (let i = 1; i < data.length; i++) {
            ema.push(data[i] * k + ema[i - 1] * (1 - k));
        }
        
        return ema;
    }

    /**
     * Run backtest with specified strategy
     * @param {string} strategyName - Name of strategy to run
     * @param {Object} params - Strategy parameters
     */
    async runBacktest(strategyName, params = {}) {
        if (!this.strategies[strategyName]) {
            throw new Error(`Strategy ${strategyName} not found`);
        }
        
        if (this.historicalData.length === 0) {
            // Generate default data if none loaded
            this.historicalData = this.generateHistoricalData();
        }
        
        const strategy = this.strategies[strategyName].bind(this);
        const results = strategy(this.historicalData, params);
        
        // Calculate performance metrics
        const metrics = this.calculatePerformanceMetrics(results, params.initialCapital || 10000);
        
        this.results = {
            strategy: strategyName,
            ...results,
            metrics: metrics
        };
        
        return this.results;
    }

    /**
     * Calculate performance metrics
     */
    calculatePerformanceMetrics(results, initialCapital) {
        const returns = [];
        const values = results.portfolioValues;
        
        for (let i = 1; i < values.length; i++) {
            returns.push((values[i].value - values[i-1].value) / values[i-1].value);
        }
        
        const totalReturn = (results.finalValue - initialCapital) / initialCapital;
        const annualizedReturn = Math.pow(1 + totalReturn, 252 / values.length) - 1;
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const std = Math.sqrt(returns.reduce((sq, n) => sq + Math.pow(n - avgReturn, 2), 0) / returns.length);
        const sharpeRatio = (annualizedReturn - 0.02) / (std * Math.sqrt(252)); // Assuming 2% risk-free rate
        
        // Calculate max drawdown
        let maxDrawdown = 0;
        let peak = values[0].value;
        for (const v of values) {
            if (v.value > peak) peak = v.value;
            const drawdown = (peak - v.value) / peak;
            if (drawdown > maxDrawdown) maxDrawdown = drawdown;
        }
        
        // Win rate - match buy/sell pairs correctly
        let winningTrades = 0;
        let totalClosedTrades = 0;
        let buyPrice = null;
        
        for (const trade of results.trades) {
            if (trade.action === 'BUY') {
                buyPrice = trade.price;
            } else if (trade.action === 'SELL' && buyPrice !== null) {
                totalClosedTrades++;
                if (trade.price > buyPrice) {
                    winningTrades++;
                }
                buyPrice = null;
            }
        }
        
        const winRate = totalClosedTrades > 0 ? winningTrades / totalClosedTrades : 0;
        
        return {
            totalReturn: (totalReturn * 100).toFixed(2) + '%',
            annualizedReturn: (annualizedReturn * 100).toFixed(2) + '%',
            sharpeRatio: sharpeRatio.toFixed(2),
            maxDrawdown: (maxDrawdown * 100).toFixed(2) + '%',
            volatility: (std * Math.sqrt(252) * 100).toFixed(2) + '%',
            totalTrades: results.trades.length,
            winRate: (winRate * 100).toFixed(2) + '%',
            finalValue: results.finalValue.toFixed(2)
        };
    }
}

// Export for use in other modules
window.BacktestEngine = BacktestEngine;