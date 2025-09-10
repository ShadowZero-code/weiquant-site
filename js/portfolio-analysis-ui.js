/**
 * Portfolio Analysis UI Module
 * Handles the display of comprehensive portfolio analysis results
 */

let portfolioAnalyzer = null;
// Chart instances are now managed via Chart.getChart() API

/**
 * Initialize portfolio analysis
 */
function initPortfolioAnalysis() {
    portfolioAnalyzer = new PortfolioAnalyzer();
    
    // Add analyze button listener
    const analyzeBtn = document.getElementById('analyzePortfolioBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', runPortfolioAnalysis);
    }
}

/**
 * Run comprehensive portfolio analysis
 */
async function runPortfolioAnalysis() {
    if (!portfolio || portfolio.length === 0) {
        showAlert('No portfolio to analyze. Please add assets first.', 'warning');
        return;
    }
    
    const analyzeBtn = document.getElementById('analyzePortfolioBtn');
    const originalText = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    
    try {
        // Get market data if available
        const marketData = await getMarketData();
        
        // Run analysis
        const analysis = portfolioAnalyzer.analyzePortfolio(portfolio, marketData);
        
        // Display results
        displayPortfolioAnalysis(analysis);
        
        // Show analysis section
        const analysisSection = document.getElementById('portfolioAnalysis');
        if (analysisSection) {
            analysisSection.classList.remove('hidden');
            analysisSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        showAlert('Portfolio analysis complete!', 'success');
    } catch (error) {
        console.error('Portfolio analysis error:', error);
        showAlert('Analysis failed. Please try again.', 'error');
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = originalText;
    }
}

/**
 * Display portfolio analysis results
 */
function displayPortfolioAnalysis(analysis) {
    // Display risk metrics
    displayRiskMetrics(analysis.metrics);
    
    // Display diversification analysis
    displayDiversification(analysis.diversification);
    
    // Display pros and cons
    displayProsAndCons(analysis.prosAndCons);
    
    // Display recommendations
    displayRecommendations(analysis.recommendations);
    
    // Create visualization charts
    createAnalysisCharts(analysis);
}

/**
 * Display risk metrics with explanations
 */
function displayRiskMetrics(metrics) {
    const metricsDiv = document.getElementById('portfolioMetrics');
    if (!metricsDiv) return;
    
    metricsDiv.innerHTML = `
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <!-- Volatility -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-start justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">Volatility</span>
                    <button onclick="showMetricExplanation('volatility')" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-info-circle text-xs"></i>
                    </button>
                </div>
                <div class="text-2xl font-bold ${getVolatilityColor(metrics.volatility)}">
                    ${(metrics.volatility * 100).toFixed(1)}%
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    ${getVolatilityLabel(metrics.volatility)}
                </div>
            </div>
            
            <!-- Max Drawdown -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-start justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">Max Drawdown</span>
                    <button onclick="showMetricExplanation('drawdown')" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-info-circle text-xs"></i>
                    </button>
                </div>
                <div class="text-2xl font-bold text-red-600">
                    -${(metrics.maxDrawdown * 100).toFixed(1)}%
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    Worst peak-to-trough loss
                </div>
            </div>
            
            <!-- Value at Risk -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-start justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">Value at Risk (95%)</span>
                    <button onclick="showMetricExplanation('var')" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-info-circle text-xs"></i>
                    </button>
                </div>
                <div class="text-2xl font-bold text-orange-600">
                    $${metrics.valueAtRisk.toLocaleString('en-US', {maximumFractionDigits: 0})}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    10-day potential loss
                </div>
            </div>
            
            <!-- Sharpe Ratio -->
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="flex items-start justify-between mb-2">
                    <span class="text-sm font-medium text-gray-600">Sharpe Ratio</span>
                    <button onclick="showMetricExplanation('sharpe')" class="text-blue-500 hover:text-blue-700">
                        <i class="fas fa-info-circle text-xs"></i>
                    </button>
                </div>
                <div class="text-2xl font-bold ${getSharpeColor(metrics.sharpeRatio)}">
                    ${metrics.sharpeRatio.toFixed(2)}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                    ${getSharpeLabel(metrics.sharpeRatio)}
                </div>
            </div>
        </div>
        
        <!-- Additional Metrics -->
        <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-gray-50 p-3 rounded-lg">
                <span class="text-sm text-gray-600">Expected Annual Return</span>
                <div class="text-lg font-semibold ${metrics.expectedReturn >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${(metrics.expectedReturn * 100).toFixed(1)}%
                </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <span class="text-sm text-gray-600">Portfolio Beta</span>
                <div class="text-lg font-semibold text-gray-800">
                    ${metrics.beta.toFixed(2)}
                </div>
            </div>
            <div class="bg-gray-50 p-3 rounded-lg">
                <span class="text-sm text-gray-600">Treynor Ratio</span>
                <div class="text-lg font-semibold text-gray-800">
                    ${metrics.treynorRatio.toFixed(2)}
                </div>
            </div>
        </div>
    `;
}

/**
 * Display diversification analysis
 */
function displayDiversification(diversification) {
    const divDiv = document.getElementById('portfolioDiversification');
    if (!divDiv) return;
    
    const diversificationStatus = diversification.isWellDiversified ? 
        '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>Well Diversified</span>' :
        '<span class="text-orange-600"><i class="fas fa-exclamation-triangle mr-1"></i>Concentration Risk</span>';
    
    divDiv.innerHTML = `
        <div class="bg-white p-4 rounded-lg border border-gray-200">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-800">Diversification Analysis</h4>
                ${diversificationStatus}
            </div>
            
            <div class="grid md:grid-cols-3 gap-4 mb-4">
                <div>
                    <span class="text-sm text-gray-600">Effective Holdings</span>
                    <div class="text-xl font-semibold">${diversification.effectiveN.toFixed(1)}</div>
                </div>
                <div>
                    <span class="text-sm text-gray-600">Concentration (HHI)</span>
                    <div class="text-xl font-semibold">${diversification.herfindahlIndex.toFixed(3)}</div>
                </div>
                <div>
                    <span class="text-sm text-gray-600">Diversification Ratio</span>
                    <div class="text-xl font-semibold">${(diversification.diversificationRatio * 100).toFixed(0)}%</div>
                </div>
            </div>
            
            <!-- Asset Type Breakdown -->
            <div class="mb-3">
                <h5 class="text-sm font-medium text-gray-700 mb-2">Asset Type Allocation</h5>
                <div class="space-y-2">
                    ${Object.entries(diversification.assetTypes).map(([type, weight]) => `
                        <div class="flex items-center justify-between">
                            <span class="text-sm capitalize">${type}</span>
                            <div class="flex items-center">
                                <div class="w-32 bg-gray-200 rounded-full h-2 mr-2">
                                    <div class="bg-blue-600 h-2 rounded-full" style="width: ${weight * 100}%"></div>
                                </div>
                                <span class="text-sm font-medium">${(weight * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

/**
 * Display portfolio pros and cons
 */
function displayProsAndCons(prosAndCons) {
    const prosConsDiv = document.getElementById('portfolioProsAndCons');
    if (!prosConsDiv) return;
    
    prosConsDiv.innerHTML = `
        <div class="grid md:grid-cols-2 gap-6">
            <!-- Strengths -->
            <div class="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 class="font-semibold text-green-900 mb-3">
                    <i class="fas fa-check-circle mr-2"></i>Portfolio Strengths
                </h4>
                ${prosAndCons.pros.length > 0 ? `
                    <div class="space-y-3">
                        ${prosAndCons.pros.map(pro => `
                            <div class="bg-white p-3 rounded-lg">
                                <div class="flex items-start">
                                    <i class="fas fa-plus-circle text-green-600 mt-1 mr-2"></i>
                                    <div>
                                        <h5 class="font-medium text-gray-800">${pro.category}</h5>
                                        <p class="text-sm text-gray-600 mt-1">${pro.description}</p>
                                        ${pro.impact === 'high' ? 
                                            '<span class="inline-block mt-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded">High Impact</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-600">No significant strengths identified</p>'}
            </div>
            
            <!-- Weaknesses -->
            <div class="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 class="font-semibold text-red-900 mb-3">
                    <i class="fas fa-exclamation-triangle mr-2"></i>Areas for Improvement
                </h4>
                ${prosAndCons.cons.length > 0 ? `
                    <div class="space-y-3">
                        ${prosAndCons.cons.map(con => `
                            <div class="bg-white p-3 rounded-lg">
                                <div class="flex items-start">
                                    <i class="fas fa-minus-circle text-red-600 mt-1 mr-2"></i>
                                    <div>
                                        <h5 class="font-medium text-gray-800">${con.category}</h5>
                                        <p class="text-sm text-gray-600 mt-1">${con.description}</p>
                                        ${con.impact === 'high' ? 
                                            '<span class="inline-block mt-1 text-xs px-2 py-1 bg-red-100 text-red-800 rounded">High Impact</span>' : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p class="text-gray-600">No significant weaknesses identified</p>'}
            </div>
        </div>
    `;
}

/**
 * Display fund recommendations
 */
function displayRecommendations(recommendations) {
    const recDiv = document.getElementById('portfolioRecommendations');
    if (!recDiv) return;
    
    if (recommendations.length === 0) {
        recDiv.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p class="text-blue-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    Your portfolio is well-balanced. No immediate changes recommended.
                </p>
            </div>
        `;
        return;
    }
    
    recDiv.innerHTML = `
        <div class="space-y-4">
            ${recommendations.map((rec, index) => `
                <div class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                    <div class="flex items-start justify-between mb-2">
                        <h4 class="font-semibold text-gray-800">
                            ${index + 1}. ${rec.category}
                        </h4>
                        <span class="text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}">
                            ${rec.priority.toUpperCase()} PRIORITY
                        </span>
                    </div>
                    
                    <div class="mb-3">
                        <p class="text-sm text-gray-700 mb-2">
                            <strong>Rationale:</strong> ${rec.rationale}
                        </p>
                        <p class="text-sm text-gray-700 mb-2">
                            <strong>Benefits:</strong> ${rec.benefit}
                        </p>
                        <p class="text-sm text-gray-700">
                            <strong>Suggested Allocation:</strong> 
                            <span class="font-medium text-blue-600">${rec.allocationSuggestion}</span>
                        </p>
                    </div>
                    
                    <button onclick="researchFundCategory('${rec.category}')" 
                            class="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition">
                        <i class="fas fa-search mr-1"></i>Research Options
                    </button>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Create analysis visualization charts
 */
function createAnalysisCharts(analysis) {
    // Create allocation pie chart
    createAllocationPieChart(analysis.diversification.assetTypes);
    
    // Create risk radar chart
    createRiskRadarChart(analysis.metrics);
}

/**
 * Create allocation pie chart
 */
function createAllocationPieChart(assetTypes) {
    const canvasElement = document.getElementById('portfolioAllocationChart');
    if (!canvasElement) return;
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Portfolio allocation chart will not be displayed.');
        return;
    }
    
    // Destroy existing chart using Chart.getChart()
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        existingChart.destroy();
    }
    
    const ctx = canvasElement.getContext('2d');
    
    const labels = Object.keys(assetTypes).map(type => type.charAt(0).toUpperCase() + type.slice(1));
    const data = Object.values(assetTypes).map(weight => (weight * 100).toFixed(1));
    
    // Create new chart (no need to store in global variable)
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(251, 146, 60, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(236, 72, 153, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

/**
 * Show metric explanation modal
 */
function showMetricExplanation(metric) {
    const explanations = {
        volatility: {
            title: 'Volatility',
            content: 'Volatility measures how widely your portfolio returns fluctuate around their average. It\'s calculated as the standard deviation of returns. Higher volatility (>20%) means your portfolio value swings more widely, indicating greater risk. Lower volatility (<15%) means more stable, predictable returns.'
        },
        drawdown: {
            title: 'Maximum Drawdown',
            content: 'Maximum Drawdown is the largest peak-to-trough loss your portfolio has experienced. It shows the worst decline from a high point to a subsequent low point. A 20% drawdown means your portfolio lost 20% from its peak value before recovering. This metric highlights downside risk and helps you understand potential losses during market stress.'
        },
        var: {
            title: 'Value at Risk (VaR)',
            content: 'Value at Risk estimates how much your portfolio could lose over a specific time period at a given confidence level. A 95% 10-day VaR of $10,000 means there\'s a 5% chance your portfolio will lose more than $10,000 over the next 10 trading days. VaR helps quantify potential extreme losses, though actual losses could exceed VaR in rare cases.'
        },
        sharpe: {
            title: 'Sharpe Ratio',
            content: 'The Sharpe Ratio measures risk-adjusted returns - how much return you earn per unit of risk taken. It\'s calculated as (Portfolio Return - Risk-Free Rate) / Volatility. A Sharpe >1 is good, >2 is excellent. Higher Sharpe means better risk-adjusted performance. A low or negative Sharpe suggests returns don\'t justify the risk.'
        }
    };
    
    const explanation = explanations[metric];
    if (!explanation) return;
    
    // Create and show modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 class="text-lg font-semibold text-gray-800 mb-3">${explanation.title}</h3>
            <p class="text-gray-600 mb-4">${explanation.content}</p>
            <button onclick="this.closest('.fixed').remove()" 
                    class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
                Got it
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

// Helper functions
function getVolatilityColor(volatility) {
    if (volatility < 0.15) return 'text-green-600';
    if (volatility < 0.25) return 'text-yellow-600';
    return 'text-red-600';
}

function getVolatilityLabel(volatility) {
    if (volatility < 0.15) return 'Low risk';
    if (volatility < 0.25) return 'Moderate risk';
    return 'High risk';
}

function getSharpeColor(sharpe) {
    if (sharpe > 1) return 'text-green-600';
    if (sharpe > 0.5) return 'text-yellow-600';
    return 'text-red-600';
}

function getSharpeLabel(sharpe) {
    if (sharpe > 1.5) return 'Excellent risk-adjusted returns';
    if (sharpe > 1) return 'Good risk-adjusted returns';
    if (sharpe > 0.5) return 'Acceptable returns';
    return 'Poor risk-adjusted returns';
}

function getPriorityColor(priority) {
    const colors = {
        high: 'bg-red-100 text-red-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-green-100 text-green-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
}

function researchFundCategory(category) {
    // Placeholder for fund research functionality
    showAlert(`Research ${category} - Feature coming soon!`, 'info');
}

async function getMarketData() {
    // Placeholder for market data retrieval
    // In production, would fetch real market data
    return {
        marketReturn: 0.10,
        marketVolatility: 0.15,
        riskFreeRate: 0.02
    };
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('portfolio')) {
        setTimeout(initPortfolioAnalysis, 100);
    }
});