/**
 * Professional Risk Assessment Module
 * Implements quantitative risk metrics based on financial models
 */

class ProfessionalRiskAssessment {
    constructor() {
        this.riskFactors = {
            market: 0,
            credit: 0,
            liquidity: 0,
            operational: 0,
            systemic: 0
        };
        
        this.riskLevels = {
            MINIMAL: { range: [0, 20], color: 'green', label: 'Minimal Risk' },
            LOW: { range: [20, 40], color: 'lime', label: 'Low Risk' },
            MODERATE: { range: [40, 60], color: 'yellow', label: 'Moderate Risk' },
            ELEVATED: { range: [60, 75], color: 'orange', label: 'Elevated Risk' },
            HIGH: { range: [75, 90], color: 'red', label: 'High Risk' },
            EXTREME: { range: [90, 100], color: 'darkred', label: 'Extreme Risk' }
        };
    }

    /**
     * Calculate comprehensive risk score using multiple models
     */
    calculateRiskScore(marketData, portfolio, newsAnalysis) {
        // 1. Market Risk (Beta, VaR, CVaR)
        const marketRisk = this.calculateMarketRisk(marketData, portfolio);
        
        // 2. Credit Risk (Default probability, credit spreads)
        const creditRisk = this.calculateCreditRisk(portfolio);
        
        // 3. Liquidity Risk (Bid-ask spread, volume analysis)
        const liquidityRisk = this.calculateLiquidityRisk(marketData, portfolio);
        
        // 4. Sentiment Risk (News impact, social media)
        const sentimentRisk = this.calculateSentimentRisk(newsAnalysis);
        
        // 5. Systemic Risk (Correlation clustering, contagion)
        const systemicRisk = this.calculateSystemicRisk(marketData);
        
        // Weighted combination
        const weights = {
            market: 0.35,
            credit: 0.20,
            liquidity: 0.15,
            sentiment: 0.15,
            systemic: 0.15
        };
        
        const totalRisk = 
            marketRisk * weights.market +
            creditRisk * weights.credit +
            liquidityRisk * weights.liquidity +
            sentimentRisk * weights.sentiment +
            systemicRisk * weights.systemic;
        
        return {
            totalRisk: Math.round(totalRisk),
            components: {
                market: marketRisk,
                credit: creditRisk,
                liquidity: liquidityRisk,
                sentiment: sentimentRisk,
                systemic: systemicRisk
            },
            level: this.getRiskLevel(totalRisk),
            recommendations: this.generateRiskRecommendations(totalRisk, {
                market: marketRisk,
                credit: creditRisk,
                liquidity: liquidityRisk,
                sentiment: sentimentRisk,
                systemic: systemicRisk
            })
        };
    }

    /**
     * Calculate market risk using VaR and stress testing
     */
    calculateMarketRisk(marketData, portfolio) {
        // Historical VaR calculation
        const returns = this.calculateReturns(marketData);
        const volatility = this.calculateVolatility(returns);
        const beta = this.calculatePortfolioBeta(portfolio, marketData);
        
        // Stress test scenarios
        const stressScenarios = [
            { name: 'Market Crash', impact: -0.20 },
            { name: 'Interest Rate Shock', impact: -0.10 },
            { name: 'Currency Crisis', impact: -0.15 }
        ];
        
        const maxStressLoss = Math.max(...stressScenarios.map(s => Math.abs(s.impact)));
        
        // VaR at 95% confidence
        const var95 = volatility * 1.645 * Math.sqrt(252); // Annual VaR
        
        // Convert to risk score (0-100)
        let riskScore = 0;
        
        // Volatility component (0-40 points)
        if (volatility < 0.10) riskScore += 10;
        else if (volatility < 0.20) riskScore += 20;
        else if (volatility < 0.30) riskScore += 30;
        else riskScore += 40;
        
        // Beta component (0-30 points)
        if (Math.abs(beta - 1) < 0.3) riskScore += 10;
        else if (Math.abs(beta - 1) < 0.6) riskScore += 20;
        else riskScore += 30;
        
        // Stress test component (0-30 points)
        riskScore += maxStressLoss * 150;
        
        return Math.min(100, riskScore);
    }

    /**
     * Calculate credit risk based on portfolio composition
     */
    calculateCreditRisk(portfolio) {
        // Simplified credit risk based on asset quality
        let creditScore = 30; // Base score
        
        // Check for high-yield or speculative assets
        if (portfolio.hasHighYield) creditScore += 20;
        if (portfolio.hasEmergingMarkets) creditScore += 15;
        if (portfolio.hasCrypto) creditScore += 25;
        
        // Diversification benefit
        const diversificationScore = this.calculateDiversification(portfolio);
        creditScore -= diversificationScore * 10;
        
        return Math.max(0, Math.min(100, creditScore));
    }

    /**
     * Calculate liquidity risk
     */
    calculateLiquidityRisk(marketData, portfolio) {
        // Volume analysis
        const avgVolume = this.calculateAverageVolume(marketData);
        const volumeRatio = portfolio.size / avgVolume;
        
        let liquidityScore = 20; // Base score
        
        // Volume impact (0-40 points)
        if (volumeRatio > 0.1) liquidityScore += 40;
        else if (volumeRatio > 0.05) liquidityScore += 30;
        else if (volumeRatio > 0.01) liquidityScore += 20;
        else liquidityScore += 10;
        
        // Bid-ask spread component (0-40 points)
        const spread = marketData.bidAskSpread || 0.001;
        liquidityScore += Math.min(40, spread * 10000);
        
        return Math.min(100, liquidityScore);
    }

    /**
     * Calculate sentiment risk from news analysis
     */
    calculateSentimentRisk(newsAnalysis) {
        if (!newsAnalysis) return 50; // Neutral if no analysis
        
        const sentiment = newsAnalysis.sentiment || {};
        const bearishScore = sentiment.bearish || 0;
        const volatilityOfSentiment = this.calculateSentimentVolatility(newsAnalysis);
        
        let sentimentRisk = bearishScore; // Base: bearish percentage
        
        // Add volatility component
        sentimentRisk += volatilityOfSentiment * 20;
        
        // Extreme sentiment adjustment
        if (bearishScore > 70 || sentiment.bullish > 70) {
            sentimentRisk += 15; // Extreme sentiment adds risk
        }
        
        return Math.min(100, sentimentRisk);
    }

    /**
     * Calculate systemic risk using correlation and contagion models
     */
    calculateSystemicRisk(marketData) {
        // Correlation clustering
        const avgCorrelation = this.calculateAverageCorrelation(marketData);
        
        // Contagion indicator
        const contagionRisk = this.calculateContagionRisk(marketData);
        
        let systemicScore = 30; // Base score
        
        // High correlation increases systemic risk
        if (avgCorrelation > 0.7) systemicScore += 40;
        else if (avgCorrelation > 0.5) systemicScore += 25;
        else if (avgCorrelation > 0.3) systemicScore += 15;
        
        // Add contagion component
        systemicScore += contagionRisk * 30;
        
        return Math.min(100, systemicScore);
    }

    /**
     * Get risk level classification
     */
    getRiskLevel(riskScore) {
        for (const [key, level] of Object.entries(this.riskLevels)) {
            if (riskScore >= level.range[0] && riskScore < level.range[1]) {
                return {
                    key: key,
                    ...level,
                    score: riskScore
                };
            }
        }
        return this.riskLevels.EXTREME;
    }

    /**
     * Generate professional risk recommendations
     */
    generateRiskRecommendations(totalRisk, components) {
        const recommendations = [];
        const level = this.getRiskLevel(totalRisk);
        
        // Overall recommendation based on risk level
        if (level.key === 'MINIMAL' || level.key === 'LOW') {
            recommendations.push({
                type: 'opportunity',
                priority: 'medium',
                action: 'Consider increasing risk exposure',
                detail: 'Current risk levels suggest potential for higher returns through increased allocation to growth assets'
            });
        } else if (level.key === 'MODERATE') {
            recommendations.push({
                type: 'maintain',
                priority: 'low',
                action: 'Maintain current risk profile',
                detail: 'Risk levels are appropriate for balanced growth and capital preservation'
            });
        } else if (level.key === 'ELEVATED') {
            recommendations.push({
                type: 'caution',
                priority: 'high',
                action: 'Review and potentially reduce risk exposure',
                detail: 'Consider rebalancing toward defensive assets and implementing stop-loss orders'
            });
        } else {
            recommendations.push({
                type: 'urgent',
                priority: 'critical',
                action: 'Immediate risk reduction required',
                detail: 'Implement defensive positioning, increase cash allocation, and review all high-risk positions'
            });
        }
        
        // Component-specific recommendations
        if (components.market > 70) {
            recommendations.push({
                type: 'hedging',
                priority: 'high',
                action: 'Implement market hedging strategies',
                detail: 'Consider put options, VIX calls, or inverse ETFs to protect against market decline'
            });
        }
        
        if (components.liquidity > 60) {
            recommendations.push({
                type: 'liquidity',
                priority: 'high',
                action: 'Improve portfolio liquidity',
                detail: 'Reduce positions in illiquid assets, maintain higher cash reserves'
            });
        }
        
        if (components.credit > 65) {
            recommendations.push({
                type: 'quality',
                priority: 'medium',
                action: 'Upgrade credit quality',
                detail: 'Shift from high-yield to investment-grade bonds, reduce emerging market exposure'
            });
        }
        
        if (components.systemic > 70) {
            recommendations.push({
                type: 'diversification',
                priority: 'high',
                action: 'Increase portfolio diversification',
                detail: 'Reduce correlation risk through alternative assets and geographic diversification'
            });
        }
        
        return recommendations;
    }

    // Helper calculation methods
    calculateReturns(data) {
        const returns = [];
        for (let i = 1; i < data.length; i++) {
            returns.push((data[i] - data[i-1]) / data[i-1]);
        }
        return returns;
    }

    calculateVolatility(returns) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        return Math.sqrt(variance);
    }

    calculatePortfolioBeta(portfolio, marketData) {
        // Simplified beta calculation
        return portfolio.beta || 1.0;
    }

    calculateDiversification(portfolio) {
        // Herfindahl index for concentration
        const weights = portfolio.assets?.map(a => a.weight) || [1];
        const herfindahl = weights.reduce((sum, w) => sum + w * w, 0);
        return 1 - herfindahl; // Higher is more diversified
    }

    calculateAverageVolume(marketData) {
        return marketData.avgVolume || 1000000;
    }

    calculateSentimentVolatility(newsAnalysis) {
        // Measure how quickly sentiment is changing
        return newsAnalysis.sentimentVolatility || 0.3;
    }

    calculateAverageCorrelation(marketData) {
        return marketData.avgCorrelation || 0.4;
    }

    calculateContagionRisk(marketData) {
        // Simplified contagion risk
        return marketData.contagionIndicator || 0.3;
    }

    /**
     * Format risk display for UI
     */
    formatRiskDisplay(riskAssessment) {
        const level = riskAssessment.level;
        
        return {
            score: riskAssessment.totalRisk,
            label: level.label,
            color: level.color,
            icon: this.getRiskIcon(level.key),
            components: Object.entries(riskAssessment.components).map(([key, value]) => ({
                name: this.formatComponentName(key),
                value: Math.round(value),
                status: this.getComponentStatus(value)
            })),
            recommendations: riskAssessment.recommendations
        };
    }

    getRiskIcon(levelKey) {
        const icons = {
            MINIMAL: 'fa-shield-alt',
            LOW: 'fa-check-circle',
            MODERATE: 'fa-exclamation-circle',
            ELEVATED: 'fa-exclamation-triangle',
            HIGH: 'fa-times-circle',
            EXTREME: 'fa-skull-crossbones'
        };
        return icons[levelKey] || 'fa-question-circle';
    }

    formatComponentName(key) {
        const names = {
            market: 'Market Risk',
            credit: 'Credit Risk',
            liquidity: 'Liquidity Risk',
            sentiment: 'Sentiment Risk',
            systemic: 'Systemic Risk'
        };
        return names[key] || key;
    }

    getComponentStatus(value) {
        if (value < 30) return 'good';
        if (value < 60) return 'warning';
        return 'danger';
    }
}

// Export for use
window.ProfessionalRiskAssessment = ProfessionalRiskAssessment;