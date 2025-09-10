/**
 * Advanced Portfolio Analysis Module
 * Provides comprehensive risk metrics, portfolio evaluation, and fund recommendations
 */

class PortfolioAnalyzer {
    constructor() {
        this.riskFreeRate = 0.02; // 2% risk-free rate (adjustable)
        this.confidenceLevel = 0.95; // 95% confidence for VaR
        this.tradingDaysPerYear = 252;
    }

    /**
     * Perform comprehensive portfolio analysis
     * @param {Array} portfolio - Array of portfolio assets
     * @param {Object} marketData - Market data for context
     * @returns {Object} Complete analysis results
     */
    analyzePortfolio(portfolio, marketData = null) {
        if (!portfolio || portfolio.length === 0) {
            return this.getEmptyAnalysis();
        }

        // Calculate basic metrics
        const totalValue = this.calculateTotalValue(portfolio);
        const returns = this.calculateReturns(portfolio);
        const weights = this.calculateWeights(portfolio, totalValue);
        
        // Risk metrics
        const volatility = this.calculateVolatility(returns);
        const maxDrawdown = this.calculateMaxDrawdown(portfolio);
        const valueAtRisk = this.calculateVaR(totalValue, returns, this.confidenceLevel);
        const sharpeRatio = this.calculateSharpeRatio(returns, volatility);
        
        // Diversification analysis
        const diversification = this.analyzeDiversification(portfolio, weights);
        
        // Strengths and weaknesses
        const prosAndCons = this.evaluatePortfolio(portfolio, weights, diversification, {
            volatility,
            maxDrawdown,
            valueAtRisk,
            sharpeRatio
        });
        
        // Fund recommendations
        const recommendations = this.generateRecommendations(portfolio, diversification, prosAndCons);
        
        return {
            metrics: {
                totalValue,
                volatility,
                maxDrawdown,
                valueAtRisk,
                sharpeRatio,
                expectedReturn: this.calculateExpectedReturn(returns),
                beta: this.calculateBeta(returns, marketData),
                treynorRatio: this.calculateTreynorRatio(returns, this.calculateBeta(returns, marketData))
            },
            diversification,
            prosAndCons,
            recommendations,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Calculate portfolio volatility (standard deviation of returns)
     * Volatility measures how widely returns vary around their average
     */
    calculateVolatility(returns) {
        if (!returns || returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
        const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / (returns.length - 1);
        
        // Annualized volatility
        const dailyVol = Math.sqrt(variance);
        return dailyVol * Math.sqrt(this.tradingDaysPerYear);
    }

    /**
     * Calculate Maximum Drawdown
     * The largest peak-to-trough loss the portfolio has experienced
     */
    calculateMaxDrawdown(portfolio) {
        if (!portfolio || portfolio.length === 0) return 0;
        
        // Simulate historical values based on current holdings
        const values = this.simulateHistoricalValues(portfolio);
        
        let peak = values[0];
        let maxDD = 0;
        
        for (const value of values) {
            if (value > peak) {
                peak = value;
            }
            const drawdown = (peak - value) / peak;
            if (drawdown > maxDD) {
                maxDD = drawdown;
            }
        }
        
        return maxDD;
    }

    /**
     * Calculate Value at Risk (VaR)
     * Statistical estimate of potential loss at given confidence level
     */
    calculateVaR(totalValue, returns, confidenceLevel = 0.95) {
        if (!returns || returns.length < 10) {
            // Not enough data, use parametric VaR
            const meanReturn = returns.length > 0 ? 
                returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
            const volatility = this.calculateVolatility(returns);
            
            // Z-score for confidence level (1.645 for 95%)
            const zScore = this.getZScore(confidenceLevel);
            
            // Daily VaR
            const dailyVaR = totalValue * (meanReturn - zScore * volatility / Math.sqrt(this.tradingDaysPerYear));
            
            // 10-day VaR (regulatory standard)
            return Math.abs(dailyVaR * Math.sqrt(10));
        }
        
        // Historical VaR for sufficient data
        const sortedReturns = [...returns].sort((a, b) => a - b);
        const index = Math.floor((1 - confidenceLevel) * sortedReturns.length);
        const percentileLoss = sortedReturns[index];
        
        // 10-day VaR
        return Math.abs(totalValue * percentileLoss * Math.sqrt(10));
    }

    /**
     * Calculate Sharpe Ratio
     * Risk-adjusted return metric (return per unit of risk)
     */
    calculateSharpeRatio(returns, volatility = null) {
        if (!returns || returns.length === 0) return 0;
        
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const annualizedReturn = meanReturn * this.tradingDaysPerYear;
        
        if (volatility === null) {
            volatility = this.calculateVolatility(returns);
        }
        
        if (volatility === 0) return 0;
        
        // Sharpe = (Return - Risk-free rate) / Volatility
        return (annualizedReturn - this.riskFreeRate) / volatility;
    }

    /**
     * Analyze portfolio diversification
     */
    analyzeDiversification(portfolio, weights) {
        const assetTypes = {};
        const sectors = {};
        const regions = {};
        
        portfolio.forEach((asset, i) => {
            // Asset type concentration
            const type = asset.type || 'unknown';
            assetTypes[type] = (assetTypes[type] || 0) + weights[i];
            
            // Sector concentration (if available)
            const sector = asset.sector || 'unknown';
            sectors[sector] = (sectors[sector] || 0) + weights[i];
            
            // Regional concentration (if available)
            const region = asset.region || 'domestic';
            regions[region] = (regions[region] || 0) + weights[i];
        });
        
        // Calculate concentration metrics
        const herfindahlIndex = this.calculateHerfindahlIndex(weights);
        const effectiveN = 1 / herfindahlIndex; // Effective number of holdings
        
        return {
            assetTypes,
            sectors,
            regions,
            herfindahlIndex,
            effectiveN,
            diversificationRatio: effectiveN / portfolio.length,
            isWellDiversified: effectiveN > 10 && herfindahlIndex < 0.15
        };
    }

    /**
     * Evaluate portfolio strengths and weaknesses
     */
    evaluatePortfolio(portfolio, weights, diversification, metrics) {
        const pros = [];
        const cons = [];
        
        // Evaluate diversification
        if (diversification.isWellDiversified) {
            pros.push({
                category: 'Diversification',
                description: `Portfolio is well-diversified across ${Math.round(diversification.effectiveN)} effective holdings, reducing concentration risk and volatility. No single position dominates, protecting against individual asset downturns.`,
                impact: 'high'
            });
        } else {
            cons.push({
                category: 'Concentration Risk',
                description: `Portfolio is concentrated in ${Math.round(diversification.effectiveN)} effective positions. High concentration (HHI: ${diversification.herfindahlIndex.toFixed(3)}) means greater exposure to individual asset risks and higher volatility.`,
                impact: 'high'
            });
        }
        
        // Evaluate risk-adjusted returns
        if (metrics.sharpeRatio > 1) {
            pros.push({
                category: 'Risk-Adjusted Returns',
                description: `Strong Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} indicates excellent risk-adjusted performance. Portfolio is delivering substantial returns relative to the risk taken.`,
                impact: 'high'
            });
        } else if (metrics.sharpeRatio < 0.5) {
            cons.push({
                category: 'Poor Risk-Adjusted Returns',
                description: `Low Sharpe ratio of ${metrics.sharpeRatio.toFixed(2)} suggests returns don't adequately compensate for risk. Consider rebalancing to improve risk-reward profile.`,
                impact: 'medium'
            });
        }
        
        // Evaluate volatility
        if (metrics.volatility < 0.15) {
            pros.push({
                category: 'Low Volatility',
                description: `Portfolio volatility of ${(metrics.volatility * 100).toFixed(1)}% is relatively low, providing stable returns with limited fluctuations. Good for risk-averse investors.`,
                impact: 'medium'
            });
        } else if (metrics.volatility > 0.30) {
            cons.push({
                category: 'High Volatility',
                description: `Portfolio volatility of ${(metrics.volatility * 100).toFixed(1)}% is high, meaning returns fluctuate widely. This increases risk of large losses during market downturns.`,
                impact: 'high'
            });
        }
        
        // Evaluate drawdown risk
        if (metrics.maxDrawdown > 0.20) {
            cons.push({
                category: 'Large Drawdown Risk',
                description: `Maximum drawdown of ${(metrics.maxDrawdown * 100).toFixed(1)}% indicates significant downside risk. Portfolio has experienced or could face deep losses during market stress.`,
                impact: 'high'
            });
        }
        
        // Check asset allocation balance
        const stockWeight = this.getAssetTypeWeight(portfolio, weights, 'stock');
        const bondWeight = this.getAssetTypeWeight(portfolio, weights, 'bond');
        
        if (stockWeight > 0.8) {
            cons.push({
                category: 'Equity Concentration',
                description: `Portfolio is ${(stockWeight * 100).toFixed(0)}% stocks, lacking defensive assets. This aggressive allocation increases volatility and drawdown risk during market corrections.`,
                impact: 'medium'
            });
        } else if (bondWeight > 0.6) {
            cons.push({
                category: 'Conservative Bias',
                description: `Portfolio is ${(bondWeight * 100).toFixed(0)}% bonds, limiting growth potential. While stable, this allocation may not meet long-term return objectives.`,
                impact: 'medium'
            });
        } else if (stockWeight > 0.3 && bondWeight > 0.2) {
            pros.push({
                category: 'Balanced Allocation',
                description: `Portfolio has balanced mix of growth (${(stockWeight * 100).toFixed(0)}% stocks) and defensive assets (${(bondWeight * 100).toFixed(0)}% bonds), providing both upside potential and downside protection.`,
                impact: 'medium'
            });
        }
        
        // Check regional diversification
        const domesticWeight = this.getRegionalWeight(portfolio, weights, 'domestic');
        if (domesticWeight > 0.9) {
            cons.push({
                category: 'Home Bias',
                description: `Portfolio is ${(domesticWeight * 100).toFixed(0)}% concentrated in domestic markets, missing international diversification. This exposes portfolio to country-specific risks.`,
                impact: 'medium'
            });
        }
        
        // Check for missing asset classes
        const hasRealAssets = this.hasAssetType(portfolio, 'commodity') || this.hasAssetType(portfolio, 'reit');
        if (!hasRealAssets) {
            cons.push({
                category: 'Missing Real Assets',
                description: 'Portfolio lacks commodities or real estate exposure, missing inflation protection and additional diversification benefits these asset classes provide.',
                impact: 'low'
            });
        }
        
        return { pros, cons };
    }

    /**
     * Generate fund category recommendations based on portfolio gaps
     */
    generateRecommendations(portfolio, diversification, prosAndCons) {
        const recommendations = [];
        const weights = this.calculateWeights(portfolio, this.calculateTotalValue(portfolio));
        
        // Check for concentration issues
        if (diversification.herfindahlIndex > 0.15) {
            recommendations.push({
                category: 'Broad Market Index Funds',
                rationale: 'Your portfolio is highly concentrated. Adding broad market index funds (S&P 500, Total Market) would instantly improve diversification and reduce single-stock risk.',
                benefit: 'Reduces concentration risk, lowers volatility, provides market returns',
                priority: 'high',
                allocationSuggestion: '20-30% of portfolio'
            });
        }
        
        // Check for international exposure
        const internationalWeight = 1 - this.getRegionalWeight(portfolio, weights, 'domestic');
        if (internationalWeight < 0.2) {
            recommendations.push({
                category: 'Global Equity Funds',
                rationale: 'Portfolio lacks international diversification. Global or international equity funds provide exposure to overseas markets, reducing home country bias.',
                benefit: 'Geographic diversification, access to global growth, currency diversification',
                priority: 'high',
                allocationSuggestion: '15-25% of portfolio'
            });
        }
        
        // Check for inflation protection
        const hasInflationProtection = this.hasAssetType(portfolio, 'tips') || 
                                      this.hasAssetType(portfolio, 'commodity');
        if (!hasInflationProtection) {
            recommendations.push({
                category: 'Inflation-Protected Bond Funds (TIPS)',
                rationale: 'Portfolio lacks inflation protection. TIPS funds preserve purchasing power when inflation rises, providing a hedge against currency debasement.',
                benefit: 'Inflation protection, portfolio stability, real return preservation',
                priority: 'medium',
                allocationSuggestion: '5-10% of portfolio'
            });
            
            recommendations.push({
                category: 'Commodity Funds',
                rationale: 'Commodities provide inflation hedge and diversification. They often move independently of stocks/bonds, reducing overall portfolio volatility.',
                benefit: 'Inflation hedge, crisis protection, portfolio diversification',
                priority: 'medium',
                allocationSuggestion: '5-10% of portfolio'
            });
        }
        
        // Check for real estate exposure
        if (!this.hasAssetType(portfolio, 'reit')) {
            recommendations.push({
                category: 'Real Estate Funds (REITs)',
                rationale: 'REITs add real estate exposure, providing income through dividends and diversification through low correlation with traditional assets.',
                benefit: 'Income generation, inflation hedge, portfolio diversification',
                priority: 'medium',
                allocationSuggestion: '5-15% of portfolio'
            });
        }
        
        // Check for style balance
        const growthWeight = this.getStyleWeight(portfolio, weights, 'growth');
        const valueWeight = this.getStyleWeight(portfolio, weights, 'value');
        
        if (growthWeight > 0.7) {
            recommendations.push({
                category: 'Value Stock Funds',
                rationale: 'Portfolio is growth-heavy. Adding value funds provides balance, potentially reducing volatility and adding dividend income.',
                benefit: 'Style diversification, dividend income, reduced volatility',
                priority: 'low',
                allocationSuggestion: '10-20% of portfolio'
            });
        } else if (valueWeight > 0.7) {
            recommendations.push({
                category: 'Growth Stock Funds',
                rationale: 'Portfolio is value-heavy. Adding growth funds increases upside potential and exposure to innovation sectors.',
                benefit: 'Growth potential, technology exposure, long-term appreciation',
                priority: 'low',
                allocationSuggestion: '10-20% of portfolio'
            });
        }
        
        // Check for defensive assets
        const defensiveWeight = this.getAssetTypeWeight(portfolio, weights, 'bond') + 
                               this.getAssetTypeWeight(portfolio, weights, 'cash');
        if (defensiveWeight < 0.2) {
            recommendations.push({
                category: 'Investment Grade Bond Funds',
                rationale: 'Portfolio lacks defensive assets. Quality bonds provide stability, income, and protection during market downturns.',
                benefit: 'Reduces volatility, provides income, portfolio ballast',
                priority: 'high',
                allocationSuggestion: '15-25% of portfolio'
            });
        }
        
        return recommendations;
    }

    // Helper methods
    calculateTotalValue(portfolio) {
        return portfolio.reduce((sum, asset) => sum + (asset.totalValue || 0), 0);
    }

    calculateReturns(portfolio) {
        // Calculate historical returns based on buy price and current price
        return portfolio.map(asset => {
            const buyPrice = asset.buyPrice || asset.currentPrice;
            const currentPrice = asset.currentPrice || buyPrice;
            return (currentPrice - buyPrice) / buyPrice;
        });
    }

    calculateWeights(portfolio, totalValue) {
        if (totalValue === 0) return portfolio.map(() => 0);
        return portfolio.map(asset => (asset.totalValue || 0) / totalValue);
    }

    calculateExpectedReturn(returns) {
        if (!returns || returns.length === 0) return 0;
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        return meanReturn * this.tradingDaysPerYear; // Annualized
    }

    calculateBeta(returns, marketData) {
        // Simplified beta calculation
        // In production, would calculate against market returns
        if (!marketData || !returns || returns.length === 0) return 1;
        
        // For now, estimate based on volatility
        const vol = this.calculateVolatility(returns);
        return Math.min(2, Math.max(0.5, vol / 0.15)); // Normalize around market vol of 15%
    }

    calculateTreynorRatio(returns, beta) {
        if (!returns || returns.length === 0 || beta === 0) return 0;
        const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const annualizedReturn = meanReturn * this.tradingDaysPerYear;
        return (annualizedReturn - this.riskFreeRate) / beta;
    }

    calculateHerfindahlIndex(weights) {
        return weights.reduce((sum, w) => sum + w * w, 0);
    }

    simulateHistoricalValues(portfolio) {
        // Generate simulated historical values for drawdown calculation
        const days = 252; // One year of trading days
        const totalValue = this.calculateTotalValue(portfolio);
        const values = [totalValue];
        
        for (let i = 1; i < days; i++) {
            // Simulate daily returns with some volatility
            const dailyReturn = (Math.random() - 0.5) * 0.02; // ±1% daily
            const newValue = values[i - 1] * (1 + dailyReturn);
            values.push(newValue);
        }
        
        return values;
    }

    getZScore(confidenceLevel) {
        // Common z-scores for confidence levels
        const zScores = {
            0.90: 1.282,
            0.95: 1.645,
            0.99: 2.326
        };
        return zScores[confidenceLevel] || 1.645;
    }

    getAssetTypeWeight(portfolio, weights, type) {
        return portfolio.reduce((sum, asset, i) => {
            return asset.type === type ? sum + weights[i] : sum;
        }, 0);
    }

    getRegionalWeight(portfolio, weights, region) {
        return portfolio.reduce((sum, asset, i) => {
            const assetRegion = asset.region || 'domestic';
            return assetRegion === region ? sum + weights[i] : sum;
        }, 0);
    }

    getStyleWeight(portfolio, weights, style) {
        return portfolio.reduce((sum, asset, i) => {
            const assetStyle = asset.style || 'blend';
            return assetStyle === style ? sum + weights[i] : sum;
        }, 0);
    }

    hasAssetType(portfolio, type) {
        return portfolio.some(asset => asset.type === type);
    }

    getEmptyAnalysis() {
        return {
            metrics: {
                totalValue: 0,
                volatility: 0,
                maxDrawdown: 0,
                valueAtRisk: 0,
                sharpeRatio: 0,
                expectedReturn: 0,
                beta: 0,
                treynorRatio: 0
            },
            diversification: {
                assetTypes: {},
                sectors: {},
                regions: {},
                herfindahlIndex: 0,
                effectiveN: 0,
                diversificationRatio: 0,
                isWellDiversified: false
            },
            prosAndCons: {
                pros: [],
                cons: []
            },
            recommendations: [],
            timestamp: new Date().toISOString()
        };
    }
}

// Export for use in other modules
window.PortfolioAnalyzer = PortfolioAnalyzer;