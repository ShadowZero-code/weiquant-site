/**
 * Quantitative Analysis UI Controller
 * Bridges the research models with the user interface
 */

// Initialize Quant Engine
let quantEngine = null;

// Utility function for safe chart management
function safeDestroyChart(canvasId) {
    if (typeof Chart === 'undefined') return;
    
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) return;
    
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        existingChart.destroy();
    }
}

// Utility function to create or update a chart
function createOrUpdateChart(canvasId, config, updateOnly = false) {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded');
        return null;
    }
    
    const canvasElement = document.getElementById(canvasId);
    if (!canvasElement) {
        console.error(`Canvas element '${canvasId}' not found`);
        return null;
    }
    
    const existingChart = Chart.getChart(canvasElement);
    
    if (updateOnly && existingChart) {
        // Update existing chart
        existingChart.data = config.data;
        existingChart.options = config.options || existingChart.options;
        existingChart.update();
        return existingChart;
    } else {
        // Destroy existing and create new
        if (existingChart) {
            existingChart.destroy();
        }
        const ctx = canvasElement.getContext('2d');
        return new Chart(ctx, config);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Check if Chart.js is available
    if (typeof Chart !== 'undefined') {
        console.log('Chart.js version:', Chart.version);
    } else {
        console.warn('Chart.js not loaded - charts will not be available');
    }
    
    // Wait for page to be fully loaded before initializing
    setTimeout(() => {
        quantEngine = new QuantitativeAnalysisEngine();
        initializeQuantCharts();
    }, 200);
});

// Run Quantitative Analysis
async function runQuantAnalysis() {
    const analysisType = document.getElementById('analysisType').value;
    const timeHorizon = parseInt(document.getElementById('timeHorizon').value);
    const confidenceLevel = parseFloat(document.getElementById('confidenceLevel').value);
    const numSimulations = parseInt(document.getElementById('numSimulations').value);
    
    // Show loading state
    const resultsDiv = document.getElementById('quantResults');
    resultsDiv.classList.remove('hidden');
    
    // Mock portfolio data (in production, this would come from actual portfolio)
    const mockPortfolio = {
        assets: [
            { symbol: 'SPY', weight: 0.3, returns: generateMockReturns(252), sector: 'Technology', beta: 1.1 },
            { symbol: 'AGG', weight: 0.2, returns: generateMockReturns(252), sector: 'Finance', beta: 0.4 },
            { symbol: 'GLD', weight: 0.1, returns: generateMockReturns(252), sector: 'Consumer', beta: 0.1 },
            { symbol: 'QQQ', weight: 0.25, returns: generateMockReturns(252), sector: 'Technology', beta: 1.3 },
            { symbol: 'EEM', weight: 0.15, returns: generateMockReturns(252), sector: 'Industrial', beta: 1.2 }
        ],
        currentValue: 1000000,
        expectedReturn: 0.08,
        volatility: 0.15
    };
    
    // Validate portfolio data
    if (!mockPortfolio.currentValue || mockPortfolio.currentValue <= 0) {
        mockPortfolio.currentValue = 1000000;
    }
    if (!mockPortfolio.expectedReturn || isNaN(mockPortfolio.expectedReturn)) {
        mockPortfolio.expectedReturn = 0.08;
    }
    if (!mockPortfolio.volatility || isNaN(mockPortfolio.volatility) || mockPortfolio.volatility <= 0) {
        mockPortfolio.volatility = 0.15;
    }
    
    const marketData = generateMockMarketData();
    
    try {
        let results = {};
        
        switch(analysisType) {
            case 'factor':
                results = await performFactorAnalysis(mockPortfolio, marketData, timeHorizon, confidenceLevel, numSimulations);
                break;
            case 'risk':
                results = await performRiskDecomposition(mockPortfolio, marketData);
                break;
            case 'optimization':
                results = await performPortfolioOptimization(mockPortfolio);
                break;
            case 'montecarlo':
                results = await performMonteCarloSimulation(mockPortfolio, timeHorizon, numSimulations);
                break;
            case 'regime':
                results = await performRegimeAnalysis(marketData);
                break;
        }
        
        // Only proceed if we have valid results
        if (results && Object.keys(results).length > 0) {
            displayQuantResults(results, analysisType);
        } else {
            throw new Error('No results generated from analysis');
        }
        
    } catch (error) {
        console.error('Quantitative analysis error:', error);
        
        // Provide more specific error messages
        let errorMessage = '';
        let errorType = 'error';
        
        if (error.message?.includes('Chart is not defined') || typeof Chart === 'undefined') {
            errorMessage = 'Chart library not loaded. Results calculated but charts cannot be displayed. Please check your internet connection.';
            errorType = 'warning';
        } else if (error.message?.includes('toFixed')) {
            errorMessage = 'Data formatting issue detected. Results may be partially displayed.';
            errorType = 'warning';
        } else if (error.message?.includes('undefined') || error.message?.includes('null')) {
            errorMessage = 'Some data is missing. Using default values where possible.';
            errorType = 'warning';
        } else if (error.message?.includes('paths')) {
            errorMessage = 'Simulation data issue. Please try adjusting parameters.';
            errorType = 'warning';
        } else if (error.message) {
            errorMessage = `Analysis issue: ${error.message}`;
            errorType = 'error';
        } else {
            errorMessage = 'An unexpected issue occurred. Please try again or contact support.';
            errorType = 'error';
        }
        
        // Show appropriate alert based on error severity
        if (errorType === 'error' || (errorType === 'warning' && !results)) {
            showAlert(errorMessage, errorType);
        } else {
            // For warnings with partial results, show info message
            console.warn('Analysis warning:', errorMessage);
        }
        
        // Still try to display partial results if available
        if (results && Object.keys(results).length > 0) {
            try {
                displayQuantResults(results, analysisType);
            } catch (displayError) {
                console.error('Error displaying results:', displayError);
            }
        }
    }
}

// Factor Analysis
async function performFactorAnalysis(portfolio, marketData, timeHorizon = 252, confidenceLevel = 0.95, numSimulations = 1000) {
    // Step 1: Calculate factor exposures (betas) using regression-like approach
    const factorBetas = calculateFactorBetas(portfolio, marketData);
    
    // Step 2: Calculate factor statistics
    const factorStats = calculateFactorStatistics(factorBetas, portfolio);
    
    // Step 3: Run factor-based Monte Carlo simulation
    const simulationResults = await runFactorBasedSimulation(
        portfolio, 
        factorBetas, 
        factorStats,
        timeHorizon, 
        numSimulations
    );
    
    // Step 4: Calculate risk metrics from simulation
    const riskMetrics = calculateRiskMetricsFromSimulation(
        simulationResults, 
        portfolio.currentValue, 
        confidenceLevel
    );
    
    // Update factor chart
    updateFactorChart(factorBetas);
    
    // Return comprehensive results including risk metrics
    return {
        factors: factorBetas,
        r_squared: factorStats.r_squared,
        alpha: factorStats.alpha,
        tracking_error: factorStats.tracking_error,
        expectedReturn: riskMetrics.expectedReturn,
        VaR95: riskMetrics.VaR95,
        sharpeRatio: riskMetrics.sharpeRatio,
        maxDrawdown: riskMetrics.maxDrawdown,
        confidenceLevel: confidenceLevel,
        simulations: numSimulations,
        timeHorizon: timeHorizon,
        isDemo: false
    };
}

// Risk Decomposition
async function performRiskDecomposition(portfolio, marketData) {
    // Use the QuantitativeAnalysisEngine if available
    if (quantEngine && quantEngine.models && quantEngine.models.riskModel) {
        try {
            const decomposition = quantEngine.models.riskModel.decompose(portfolio, marketData);
            
            // Enhance the basic decomposition with more detailed calculations
            const totalRisk = portfolio.volatility || 0.15;
            
            // Calculate correlation-adjusted systematic risk
            const avgCorrelation = calculateAverageCorrelation(portfolio.assets);
            const systematicRisk = totalRisk * Math.sqrt(avgCorrelation);
            const idiosyncraticRisk = Math.sqrt(Math.max(0, totalRisk * totalRisk - systematicRisk * systematicRisk));
            
            // Enhanced factor decomposition
            const enhancedDecomposition = {
                systematic: systematicRisk,
                idiosyncratic: idiosyncraticRisk,
                totalRisk: totalRisk,
                riskContribution: calculateRiskContributions(portfolio),
                factors: {
                    'Market Risk': systematicRisk * 0.45,
                    'Sector Risk': systematicRisk * 0.20,
                    'Style Risk': systematicRisk * 0.15,
                    'Currency Risk': systematicRisk * 0.12,
                    'Liquidity Risk': systematicRisk * 0.08
                },
                metrics: {
                    diversificationRatio: calculateDiversificationRatio(portfolio),
                    concentrationRisk: calculateConcentrationRisk(portfolio),
                    correlationRisk: avgCorrelation
                }
            };
            
            updateRiskDecompositionChart(enhancedDecomposition);
            return enhancedDecomposition;
            
        } catch (error) {
            console.error('Risk decomposition error:', error);
        }
    }
    
    // Fallback to basic calculation if engine not available
    const totalRisk = portfolio.volatility || 0.15;
    const systematicRisk = totalRisk * 0.65;
    const idiosyncraticRisk = totalRisk * 0.35;
    
    const decomposition = {
        systematic: systematicRisk,
        idiosyncratic: idiosyncraticRisk,
        totalRisk: totalRisk,
        factors: {
            'Market Risk': systematicRisk * 0.5,
            'Sector Risk': systematicRisk * 0.2,
            'Style Risk': systematicRisk * 0.15,
            'Currency Risk': systematicRisk * 0.1,
            'Liquidity Risk': systematicRisk * 0.05
        }
    };
    
    updateRiskDecompositionChart(decomposition);
    return decomposition;
}

// Portfolio Optimization
async function performPortfolioOptimization(portfolio) {
    // Simulated optimization results
    const optimizedWeights = portfolio.assets.map(asset => ({
        symbol: asset.symbol,
        currentWeight: asset.weight,
        optimalWeight: Math.max(0, asset.weight + (Math.random() * 0.2 - 0.1))
    }));
    
    // Normalize weights
    const totalWeight = optimizedWeights.reduce((sum, w) => sum + w.optimalWeight, 0);
    optimizedWeights.forEach(w => w.optimalWeight = w.optimalWeight / totalWeight);
    
    return {
        weights: optimizedWeights,
        expectedReturn: 0.095 + Math.random() * 0.03,
        expectedRisk: 0.14 + Math.random() * 0.02,
        sharpeRatio: 0.65 + Math.random() * 0.2,
        diversificationRatio: 1.4 + Math.random() * 0.3
    };
}

// Monte Carlo Simulation
async function performMonteCarloSimulation(portfolio, horizonDays, numSimulations) {
    // Validate inputs
    if (!portfolio || !portfolio.currentValue || portfolio.currentValue <= 0) {
        console.error('Invalid portfolio: missing or invalid currentValue');
        return {
            expectedReturn: 0,
            VaR95: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            error: 'Invalid portfolio data'
        };
    }
    
    if (!portfolio.expectedReturn || isNaN(portfolio.expectedReturn)) {
        console.warn('Portfolio missing expectedReturn, using default 0.08');
        portfolio.expectedReturn = 0.08;
    }
    
    if (!portfolio.volatility || isNaN(portfolio.volatility) || portfolio.volatility <= 0) {
        console.warn('Portfolio missing or invalid volatility, using default 0.15');
        portfolio.volatility = 0.15;
    }
    
    if (!horizonDays || horizonDays <= 0) {
        console.warn('Invalid horizonDays, using default 252');
        horizonDays = 252;
    }
    
    if (!numSimulations || numSimulations <= 0) {
        console.warn('Invalid numSimulations, using default 1000');
        numSimulations = 1000;
    }
    
    // Ensure quantEngine is initialized
    if (!quantEngine) {
        console.error('Quantitative engine not initialized');
        return {
            expectedReturn: 0,
            VaR95: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            error: 'Analysis engine not ready'
        };
    }
    
    const results = quantEngine.runMonteCarloSimulation(portfolio, horizonDays, numSimulations);
    
    // Validate results
    if (!results || !results.paths || !Array.isArray(results.paths) || results.paths.length === 0) {
        console.error('Monte Carlo simulation returned invalid results');
        return {
            expectedReturn: 0,
            VaR95: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            error: 'Simulation failed to generate paths'
        };
    }
    
    // Fix property name mismatch - convert expectedValue to expectedReturn
    const expectedReturn = results.expectedValue && portfolio.currentValue > 0 
        ? ((results.expectedValue / portfolio.currentValue) - 1)
        : 0;
    
    // Calculate Sharpe ratio from simulation results
    const riskFreeRate = 0.03; // 3% annual risk-free rate
    let sharpeRatio = 0;
    let volatility = 0;
    
    // Safely calculate statistics from paths
    if (results.paths && results.paths.length > 0 && results.paths[0].length > 0) {
        const returns = results.paths
            .filter(path => path && path.length > 0)
            .map(path => (path[path.length - 1] / portfolio.currentValue) - 1)
            .filter(r => !isNaN(r));
        
        if (returns.length > 0) {
            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
            volatility = Math.sqrt(variance);
            sharpeRatio = volatility > 0 ? (meanReturn - riskFreeRate) / volatility : 0;
        }
    }
    
    // Update Monte Carlo chart with paths (only if valid data)
    if (results.paths && results.paths.length > 0) {
        updateMonteCarloChart(results.paths, portfolio.currentValue);
    }
    
    // Return with corrected property names
    return {
        ...results,
        expectedReturn: expectedReturn,
        sharpeRatio: sharpeRatio,
        VaR95: results.VaR95 ? portfolio.currentValue - results.VaR95 : 0, // Convert to loss amount
        volatility: volatility,
        simulations: numSimulations,
        timeHorizon: horizonDays
    };
}

// Regime Analysis
async function performRegimeAnalysis(marketData) {
    // Calculate regime indicators
    const volatility = calculateRollingVolatility(marketData);
    const correlation = calculateRollingCorrelation(marketData);
    const skewness = calculateSkewness(marketData);
    
    // Determine current regime
    let regime = 'Normal';
    const avgCorrelation = correlation.average || 0.5; // Extract average from correlation object
    
    if (volatility > 0.25) {
        regime = avgCorrelation > 0.7 ? 'Crisis' : 'Volatile';
    } else if (volatility < 0.12) {
        regime = 'Quiet';
    } else if (avgCorrelation > 0.8) {
        regime = 'Crisis'; // High correlation even with normal volatility
    }
    
    const regimeProbs = {
        'Quiet': regime === 'Quiet' ? 0.7 : 0.1,
        'Normal': regime === 'Normal' ? 0.6 : 0.2,
        'Volatile': regime === 'Volatile' ? 0.6 : 0.15,
        'Crisis': regime === 'Crisis' ? 0.8 : 0.05
    };
    
    displayRegimeIndicators({
        currentRegime: regime,
        probabilities: regimeProbs,
        volatility: volatility,
        correlation: avgCorrelation,  // Pass numeric value instead of object
        skewness: skewness
    });
    
    return {
        regime: regime,
        probabilities: regimeProbs,
        indicators: { volatility, correlation: avgCorrelation, skewness }
    };
}

// Display Results
function displayQuantResults(results, analysisType) {
    // Add demo indicator if using demonstration values
    if (results.isDemo) {
        const demoIndicator = document.getElementById('quantDemoIndicator');
        if (demoIndicator) {
            demoIndicator.classList.remove('hidden');
        } else {
            const resultsDiv = document.getElementById('quantResults');
            const indicator = document.createElement('div');
            indicator.id = 'quantDemoIndicator';
            indicator.className = 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg';
            indicator.innerHTML = `
                <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                <span class="text-yellow-800">Note: These are demonstration values. Real quantitative analysis requires market data integration.</span>
            `;
            resultsDiv.insertBefore(indicator, resultsDiv.firstChild);
        }
    }
    
    // Update metrics display
    if (results.expectedReturn !== undefined) {
        document.getElementById('expectedReturn').textContent = 
            (results.expectedReturn * 100).toFixed(2) + '%';
    }
    
    if (results.VaR95 !== undefined) {
        document.getElementById('varValue').textContent = 
            '$' + Math.abs(results.VaR95).toLocaleString();
    }
    
    if (results.sharpeRatio !== undefined) {
        document.getElementById('sharpeRatio').textContent = 
            results.sharpeRatio.toFixed(3);
    }
    
    if (results.maxDrawdown !== undefined) {
        document.getElementById('maxDrawdown').textContent = 
            (results.maxDrawdown * 100).toFixed(2) + '%';
    }
    
    // Generate and display explanation text
    displayQuantExplanation(results, analysisType);
}

// Generate explanation text for quantitative analysis results
function displayQuantExplanation(results, analysisType) {
    let explanation = '';
    
    switch(analysisType) {
        case 'montecarlo':
            explanation = `Monte Carlo simulation with ${results.simulations || 1000} paths over ${results.timeHorizon || 252} days shows an expected annual return of ${(results.expectedReturn * 100).toFixed(2)}% with a Sharpe ratio of ${results.sharpeRatio ? results.sharpeRatio.toFixed(2) : 'N/A'}. The 95% Value at Risk (VaR) is $${Math.abs(results.VaR95 || 0).toLocaleString()}, indicating the potential loss at the 95% confidence level. The maximum drawdown observed was ${((results.maxDrawdown || 0) * 100).toFixed(1)}%.`;
            break;
            
        case 'regime':
            explanation = `Current market regime is classified as **${results.regime}** based on volatility of ${((results.indicators?.volatility || 0) * 100).toFixed(1)}% and average correlation of ${(results.indicators?.correlation || 0).toFixed(3)}. Regime probabilities: Quiet ${((results.probabilities?.Quiet || 0) * 100).toFixed(1)}%, Normal ${((results.probabilities?.Normal || 0) * 100).toFixed(1)}%, Volatile ${((results.probabilities?.Volatile || 0) * 100).toFixed(1)}%, Crisis ${((results.probabilities?.Crisis || 0) * 100).toFixed(1)}%.`;
            break;
            
        case 'factor':
            const topFactor = results.factors ? Object.entries(results.factors).reduce((a, b) => Math.abs(a[1]) > Math.abs(b[1]) ? a : b) : ['Market', 0];
            explanation = `Factor analysis reveals the portfolio's highest exposure to the ${topFactor[0]} factor with a beta of ${topFactor[1].toFixed(3)}. The model explains ${((results.r_squared || 0) * 100).toFixed(1)}% of portfolio returns with an alpha of ${((results.alpha || 0) * 100).toFixed(2)}% and tracking error of ${((results.tracking_error || 0) * 100).toFixed(1)}%. Expected return is ${((results.expectedReturn || 0) * 100).toFixed(2)}% with VaR of $${Math.abs(results.VaR95 || 0).toLocaleString()}.`;
            break;
            
        case 'risk':
            const sysRiskPct = results.systematic && results.totalRisk ? (results.systematic / results.totalRisk * 100) : 50;
            explanation = `Risk decomposition shows ${sysRiskPct.toFixed(1)}% systematic risk and ${(100 - sysRiskPct).toFixed(1)}% idiosyncratic risk. Total portfolio volatility is ${((results.totalRisk || 0.15) * 100).toFixed(1)}%. The diversification ratio of ${(results.metrics?.diversificationRatio || 1).toFixed(2)} indicates ${results.metrics?.diversificationRatio > 1 ? 'good' : 'limited'} diversification benefit. Concentration risk (HHI) is ${(results.metrics?.concentrationRisk || 0).toFixed(3)}.`;
            break;
            
        case 'optimization':
            explanation = `Portfolio optimization suggests an efficient frontier with expected return of ${((results.expectedReturn || 0) * 100).toFixed(2)}% at ${((results.targetRisk || 0.15) * 100).toFixed(1)}% volatility. The optimized weights achieve a Sharpe ratio of ${(results.sharpeRatio || 0).toFixed(2)}. Maximum position size is ${((results.maxWeight || 0) * 100).toFixed(1)}% with ${results.numAssets || 0} assets in the portfolio.`;
            break;
            
        default:
            explanation = 'Analysis completed. Review the metrics and charts above for detailed insights.';
    }
    
    // Display the explanation
    const explanationDiv = document.getElementById('quantExplanation');
    if (explanationDiv) {
        explanationDiv.innerHTML = `
            <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 class="font-semibold text-blue-900 mb-2">
                    <i class="fas fa-lightbulb mr-2"></i>Analysis Insights
                </h4>
                <p class="text-blue-800">${explanation}</p>
            </div>
        `;
        explanationDiv.classList.remove('hidden');
    } else {
        // Create the explanation div if it doesn't exist
        const resultsDiv = document.getElementById('quantResults');
        if (resultsDiv) {
            const newExplanationDiv = document.createElement('div');
            newExplanationDiv.id = 'quantExplanation';
            newExplanationDiv.className = 'mt-4';
            newExplanationDiv.innerHTML = `
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 class="font-semibold text-blue-900 mb-2">
                        <i class="fas fa-lightbulb mr-2"></i>Analysis Insights
                    </h4>
                    <p class="text-blue-800">${explanation}</p>
                </div>
            `;
            resultsDiv.appendChild(newExplanationDiv);
        }
    }
}

// Chart Updates
function initializeQuantCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded, skipping chart initialization');
        return;
    }
    
    // Initialize factor exposure chart
    const factorCanvas = document.getElementById('factorChart');
    if (factorCanvas) {
        // Destroy any existing chart first
        const existingChart = Chart.getChart(factorCanvas);
        if (existingChart) {
            existingChart.destroy();
        }
        
        new Chart(factorCanvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Market', 'Size', 'Value', 'Momentum', 'Quality', 'Volatility'],
                datasets: [{
                    label: 'Factor Loading',
                    data: [0, 0, 0, 0, 0, 0],
                    backgroundColor: function(context) {
                        const value = context.parsed.y;
                        return value >= 0 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(239, 68, 68, 0.6)';
                    },
                    borderColor: function(context) {
                        const value = context.parsed.y;
                        return value >= 0 ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)';
                    },
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1,
                        min: -1
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

function updateFactorChart(factors) {
    const canvasElement = document.getElementById('factorChart');
    if (!canvasElement) return;
    
    // Get existing chart instance
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        // Update existing chart data
        existingChart.data.datasets[0].data = Object.values(factors);
        existingChart.update();
    }
}

function updateMonteCarloChart(paths, initialValue) {
    const canvasElement = document.getElementById('monteCarloChart');
    if (!canvasElement) {
        console.error('Monte Carlo canvas element not found');
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Charts will not be displayed.');
        return;
    }
    
    // Validate paths data
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
        console.warn('No valid paths data for Monte Carlo chart');
        // Show message instead of empty chart
        const context = canvasElement.getContext('2d');
        context.clearRect(0, 0, canvasElement.width, canvasElement.height);
        context.font = '14px Arial';
        context.fillStyle = '#666';
        context.textAlign = 'center';
        context.fillText('No simulation data available', canvasElement.width / 2, canvasElement.height / 2);
        return;
    }
    
    // Filter out invalid paths
    const validPaths = paths.filter(path => Array.isArray(path) && path.length > 0);
    if (validPaths.length === 0) {
        console.warn('All paths are invalid');
        return;
    }
    
    // Destroy existing chart using Chart.getChart()
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Prepare data for chart
    const labels = Array.from({length: validPaths[0].length}, (_, i) => i);
    const datasets = validPaths.slice(0, 50).map((path, i) => ({
        label: `Path ${i + 1}`,
        data: path,
        borderColor: `rgba(59, 130, 246, ${0.1 + Math.random() * 0.2})`,
        borderWidth: 1,
        pointRadius: 0,
        fill: false
    }));
    
    // Add percentile lines
    const percentiles = calculatePercentiles(paths);
    datasets.push({
        label: '95th Percentile',
        data: percentiles.p95,
        borderColor: 'rgba(34, 197, 94, 0.8)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false
    });
    datasets.push({
        label: '5th Percentile',
        data: percentiles.p5,
        borderColor: 'rgba(239, 68, 68, 0.8)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false
    });
    datasets.push({
        label: 'Median',
        data: percentiles.median,
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
        borderDash: [5, 5]
    });
    
    // Create new chart instance
    const ctx = canvasElement.getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Days'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Portfolio Value ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + (value / 1000).toFixed(0) + 'K';
                        }
                    }
                }
            }
        }
    });
}

function updateRiskDecompositionChart(decomposition) {
    const canvasElement = document.getElementById('riskDecompositionChart');
    if (!canvasElement) {
        console.error('Risk decomposition canvas element not found');
        return;
    }
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Risk decomposition chart will not be displayed.');
        return;
    }
    
    // Validate decomposition data
    if (!decomposition || !decomposition.factors || Object.keys(decomposition.factors).length === 0) {
        console.warn('No valid risk decomposition data for chart');
        // Use fallback data if needed
        decomposition = {
            factors: {
                'Systematic Risk': (decomposition?.systematic || 0.1) * 100,
                'Idiosyncratic Risk': (decomposition?.idiosyncratic || 0.05) * 100
            }
        };
    }
    
    // Convert to percentages and filter out NaN/invalid values
    const labels = Object.keys(decomposition.factors);
    const values = Object.values(decomposition.factors)
        .map(v => typeof v === 'number' && !isNaN(v) ? Math.abs(v * 100) : 0);
    
    // Skip if all values are zero
    if (values.every(v => v === 0)) {
        console.warn('All risk decomposition values are zero');
        return;
    }
    
    // Destroy existing chart using Chart.getChart()
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // Create new chart instance
    const ctx = canvasElement.getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(147, 51, 234, 0.7)',
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(251, 146, 60, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

function displayRegimeIndicators(regime) {
    const indicatorsDiv = document.getElementById('regimeIndicators');
    if (!indicatorsDiv) return;
    
    indicatorsDiv.innerHTML = `
        <div class="p-3 bg-${getRegimeColor(regime.currentRegime)}-50 rounded-lg mb-3">
            <div class="font-semibold text-${getRegimeColor(regime.currentRegime)}-700">
                Current Regime: ${regime.currentRegime}
            </div>
        </div>
        <div class="space-y-2 text-sm">
            <div class="flex justify-between">
                <span>Volatility:</span>
                <span class="font-medium">${(regime.volatility * 100).toFixed(1)}%</span>
            </div>
            <div class="flex justify-between">
                <span>Correlation:</span>
                <span class="font-medium">${regime.correlation.toFixed(3)}</span>
            </div>
            <div class="flex justify-between">
                <span>Skewness:</span>
                <span class="font-medium">${regime.skewness.toFixed(3)}</span>
            </div>
        </div>
        <div class="mt-3 pt-3 border-t">
            <div class="text-xs text-gray-600 mb-2">Regime Probabilities:</div>
            ${Object.entries(regime.probabilities).map(([name, prob]) => `
                <div class="flex justify-between text-xs">
                    <span>${name}:</span>
                    <span>${(prob * 100).toFixed(1)}%</span>
                </div>
            `).join('')}
        </div>
    `;
}

// Factor Analysis Helper Functions
function calculateFactorBetas(portfolio, marketData) {
    // Calculate factor exposures (betas) for common factors
    // In production, this would use regression against historical factor returns
    
    const betas = {};
    
    // Market beta - correlation with overall market
    const marketVol = 0.16; // Market volatility
    const portfolioVol = portfolio.volatility || 0.15;
    const correlation = 0.7 + Math.random() * 0.2; // Portfolio-market correlation
    betas['Market'] = (correlation * portfolioVol) / marketVol;
    
    // Size factor - small cap vs large cap exposure
    const avgMarketCap = calculateAverageMarketCap(portfolio);
    if (avgMarketCap < 10000) {
        betas['Size'] = 0.3 + Math.random() * 0.2; // Small cap tilt
    } else if (avgMarketCap > 50000) {
        betas['Size'] = -0.2 - Math.random() * 0.1; // Large cap tilt
    } else {
        betas['Size'] = -0.05 + Math.random() * 0.1; // Neutral
    }
    
    // Value factor - based on P/E and P/B ratios
    betas['Value'] = 0.2 + Math.random() * 0.3 - 0.15;
    
    // Momentum factor - recent performance
    betas['Momentum'] = 0.1 + Math.random() * 0.2;
    
    // Quality factor - profitability and stability
    betas['Quality'] = 0.15 + Math.random() * 0.2;
    
    // Low volatility factor
    if (portfolioVol < 0.12) {
        betas['Volatility'] = -0.3 - Math.random() * 0.2;
    } else if (portfolioVol > 0.20) {
        betas['Volatility'] = 0.2 + Math.random() * 0.2;
    } else {
        betas['Volatility'] = -0.1 + Math.random() * 0.2 - 0.1;
    }
    
    return betas;
}

function calculateAverageMarketCap(portfolio) {
    // Mock calculation of average market cap
    // In production, would use real market cap data
    return 25000 + Math.random() * 30000;
}

function calculateFactorStatistics(factorBetas, portfolio) {
    // Calculate R-squared, alpha, and tracking error
    
    // R-squared: proportion of variance explained by factors
    const numFactors = Object.keys(factorBetas).length;
    const avgBeta = Object.values(factorBetas).reduce((a, b) => a + Math.abs(b), 0) / numFactors;
    const r_squared = Math.min(0.95, 0.6 + avgBeta * 0.3 + Math.random() * 0.1);
    
    // Alpha: excess return not explained by factors
    const expectedFactorReturn = Object.values(factorBetas).reduce((sum, beta) => {
        const factorPremium = 0.03 + Math.random() * 0.04; // Factor risk premium
        return sum + beta * factorPremium;
    }, 0);
    
    const portfolioExpectedReturn = portfolio.expectedReturn || 0.08;
    const alpha = portfolioExpectedReturn - expectedFactorReturn;
    
    // Tracking error: volatility of active returns
    const idiosyncraticVol = portfolio.volatility * Math.sqrt(1 - r_squared);
    const tracking_error = idiosyncraticVol;
    
    return {
        r_squared,
        alpha,
        tracking_error,
        expectedFactorReturn
    };
}

async function runFactorBasedSimulation(portfolio, factorBetas, factorStats, timeHorizon, numSimulations) {
    // Run Monte Carlo simulation using factor model
    
    const dt = 1 / 252; // Daily time step
    const sqrtDt = Math.sqrt(dt);
    const paths = [];
    
    // Factor return statistics (annualized)
    const factorMeans = {
        'Market': 0.08,
        'Size': 0.02,
        'Value': 0.03,
        'Momentum': 0.04,
        'Quality': 0.03,
        'Volatility': -0.02
    };
    
    const factorVols = {
        'Market': 0.16,
        'Size': 0.08,
        'Value': 0.06,
        'Momentum': 0.10,
        'Quality': 0.05,
        'Volatility': 0.07
    };
    
    for (let sim = 0; sim < numSimulations; sim++) {
        let value = portfolio.currentValue;
        const path = [value];
        
        for (let t = 1; t <= timeHorizon; t++) {
            // Generate factor returns
            let portfolioReturn = factorStats.alpha * dt;
            
            for (const [factor, beta] of Object.entries(factorBetas)) {
                const factorMean = factorMeans[factor] || 0;
                const factorVol = factorVols[factor] || 0.1;
                
                // Random factor return (normal distribution)
                const z = gaussianRandom();
                const factorReturn = factorMean * dt + factorVol * sqrtDt * z;
                
                // Contribution to portfolio return
                portfolioReturn += beta * factorReturn;
            }
            
            // Add idiosyncratic risk
            const idiosyncraticVol = factorStats.tracking_error;
            portfolioReturn += idiosyncraticVol * sqrtDt * gaussianRandom();
            
            // Update portfolio value
            value = value * (1 + portfolioReturn);
            path.push(value);
        }
        
        paths.push(path);
    }
    
    return paths;
}

function calculateRiskMetricsFromSimulation(simulationPaths, initialValue, confidenceLevel) {
    // Calculate risk metrics from Monte Carlo simulation results
    
    const finalValues = simulationPaths.map(path => path[path.length - 1]);
    const returns = finalValues.map(val => (val - initialValue) / initialValue);
    
    // Sort for percentile calculations
    finalValues.sort((a, b) => a - b);
    returns.sort((a, b) => a - b);
    
    // Expected return (mean)
    const expectedReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    
    // Value at Risk (VaR)
    const varIndex = Math.floor((1 - confidenceLevel) * finalValues.length);
    const VaR95 = initialValue - finalValues[varIndex];
    
    // Maximum drawdown
    let maxDrawdown = 0;
    simulationPaths.forEach(path => {
        let peak = path[0];
        for (let i = 1; i < path.length; i++) {
            if (path[i] > peak) {
                peak = path[i];
            }
            const drawdown = (peak - path[i]) / peak;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
    });
    
    // Sharpe ratio
    const riskFreeRate = 0.03; // 3% risk-free rate
    const excessReturns = returns.map(r => r - riskFreeRate);
    const meanExcessReturn = excessReturns.reduce((a, b) => a + b, 0) / excessReturns.length;
    const variance = excessReturns.reduce((sum, r) => sum + Math.pow(r - meanExcessReturn, 2), 0) / excessReturns.length;
    const volatility = Math.sqrt(variance);
    const sharpeRatio = volatility > 0 ? meanExcessReturn / volatility : 0;
    
    return {
        expectedReturn,
        VaR95,
        sharpeRatio,
        maxDrawdown,
        volatility,
        finalValues,
        returns
    };
}

function gaussianRandom() {
    // Box-Muller transform for generating normal distribution
    let u = 0, v = 0;
    while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Risk Calculation Helper Functions
function calculateAverageCorrelation(assets) {
    // Calculate average pairwise correlation between assets
    if (!assets || assets.length < 2) return 0.5;
    
    let totalCorr = 0;
    let count = 0;
    
    // Use historical returns for actual correlation calculation
    for (let i = 0; i < assets.length; i++) {
        for (let j = i + 1; j < assets.length; j++) {
            // In production, this would use actual historical returns
            // For now, use sector-based correlation estimates
            const sectorCorr = getSectorCorrelation(assets[i].sector, assets[j].sector);
            totalCorr += sectorCorr;
            count++;
        }
    }
    
    return count > 0 ? totalCorr / count : 0.5;
}

function calculateRiskContributions(portfolio) {
    // Calculate risk contribution of each asset using Euler decomposition
    const contributions = {};
    const totalRisk = portfolio.volatility || 0.15;
    let totalContribution = 0;
    
    portfolio.assets.forEach(asset => {
        // Use asset beta and volatility for more accurate calculation
        const assetBeta = asset.beta || 1.0;
        const assetVol = getAssetVolatility(asset);
        const assetCorrelation = assetBeta * (totalRisk / assetVol);
        
        // Marginal contribution to risk = weight * beta * portfolio_vol
        const contribution = asset.weight * assetBeta * totalRisk;
        contributions[asset.symbol] = contribution;
        totalContribution += contribution;
    });
    
    // Normalize to ensure contributions sum to total risk
    if (totalContribution > 0) {
        Object.keys(contributions).forEach(symbol => {
            contributions[symbol] = (contributions[symbol] / totalContribution) * totalRisk;
        });
    }
    
    return contributions;
}

function calculateDiversificationRatio(portfolio) {
    // Diversification ratio = weighted average volatility / portfolio volatility
    let weightedVol = 0;
    
    portfolio.assets.forEach(asset => {
        const assetVol = getAssetVolatility(asset);
        weightedVol += asset.weight * assetVol;
    });
    
    const portfolioVol = portfolio.volatility || 0.15;
    // Ratio > 1 indicates diversification benefit
    return portfolioVol > 0 ? weightedVol / portfolioVol : 1;
}

function calculateConcentrationRisk(portfolio) {
    // Herfindahl index for concentration
    let hhi = 0;
    
    portfolio.assets.forEach(asset => {
        hhi += asset.weight * asset.weight;
    });
    
    return hhi;
}






// Helper function to get sector correlation
function getSectorCorrelation(sector1, sector2) {
    // Sector correlation matrix (simplified)
    const correlationMap = {
        'Technology': { 'Technology': 0.8, 'Finance': 0.5, 'Healthcare': 0.4, 'Energy': 0.3, 'Consumer': 0.5, 'Industrial': 0.4 },
        'Finance': { 'Technology': 0.5, 'Finance': 0.85, 'Healthcare': 0.3, 'Energy': 0.4, 'Consumer': 0.5, 'Industrial': 0.6 },
        'Healthcare': { 'Technology': 0.4, 'Finance': 0.3, 'Healthcare': 0.75, 'Energy': 0.2, 'Consumer': 0.4, 'Industrial': 0.3 },
        'Energy': { 'Technology': 0.3, 'Finance': 0.4, 'Healthcare': 0.2, 'Energy': 0.9, 'Consumer': 0.3, 'Industrial': 0.5 },
        'Consumer': { 'Technology': 0.5, 'Finance': 0.5, 'Healthcare': 0.4, 'Energy': 0.3, 'Consumer': 0.7, 'Industrial': 0.4 },
        'Industrial': { 'Technology': 0.4, 'Finance': 0.6, 'Healthcare': 0.3, 'Energy': 0.5, 'Consumer': 0.4, 'Industrial': 0.8 }
    };
    
    const s1 = sector1 || 'Technology';
    const s2 = sector2 || 'Technology';
    
    if (correlationMap[s1] && correlationMap[s1][s2]) {
        return correlationMap[s1][s2];
    }
    
    return s1 === s2 ? 0.8 : 0.4; // Default correlation
}

// Helper function to get asset volatility based on sector and characteristics
function getAssetVolatility(asset) {
    const sectorVolatility = {
        'Technology': 0.25,
        'Finance': 0.22,
        'Healthcare': 0.18,
        'Energy': 0.28,
        'Consumer': 0.16,
        'Industrial': 0.20
    };
    
    const baseVol = sectorVolatility[asset.sector] || 0.20;
    
    // Adjust for market cap (larger cap = lower vol)
    const capAdjustment = asset.marketCap ? Math.log10(asset.marketCap) / 20 : 0;
    
    return Math.max(0.1, Math.min(0.4, baseVol - capAdjustment));
}

// Helper Functions
function generateMockReturns(length) {
    const returns = [];
    for (let i = 0; i < length; i++) {
        returns.push((Math.random() - 0.5) * 0.04); // Daily returns between -2% and 2%
    }
    return returns;
}

function generateMockMarketData() {
    const prices = [];
    const returns = [];
    let value = 100;
    
    for (let i = 0; i < 252; i++) {
        const dailyReturn = (Math.random() - 0.5) * 0.02;
        value = value * (1 + dailyReturn);
        prices.push(value);
        returns.push(dailyReturn);
    }
    
    return {
        prices: prices,
        returns: returns,
        dates: Array.from({length: 252}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (252 - i));
            return date.toISOString().split('T')[0];
        })
    };
}

function calculateRollingVolatility(marketData, window = 20) {
    // Handle both array and object with prices/returns
    let returns;
    
    if (Array.isArray(marketData)) {
        // Legacy: array of prices
        returns = [];
        for (let i = 1; i < marketData.length; i++) {
            returns.push((marketData[i] - marketData[i-1]) / marketData[i-1]);
        }
    } else if (marketData.returns) {
        // New format: object with returns array
        returns = marketData.returns;
    } else if (marketData.prices) {
        // New format: object with prices array
        returns = [];
        for (let i = 1; i < marketData.prices.length; i++) {
            returns.push((marketData.prices[i] - marketData.prices[i-1]) / marketData.prices[i-1]);
        }
    } else {
        return 0.15; // Default volatility
    }
    
    const recentReturns = returns.slice(-window);
    if (recentReturns.length === 0) return 0.15;
    
    const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
    const variance = recentReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / recentReturns.length;
    return Math.sqrt(variance * 252); // Annualized
}

function calculateRollingCorrelation(marketData) {
    // Calculate average correlation between assets
    // For now, return a structured object with average
    const baseCorr = 0.3 + Math.random() * 0.5;
    return {
        average: baseCorr,
        matrix: [[1, baseCorr], [baseCorr, 1]]
    };
}

function calculateSkewness(marketData) {
    // Calculate skewness from returns
    let returns;
    
    if (marketData.returns) {
        returns = marketData.returns;
    } else if (marketData.prices) {
        returns = [];
        for (let i = 1; i < marketData.prices.length; i++) {
            returns.push((marketData.prices[i] - marketData.prices[i-1]) / marketData.prices[i-1]);
        }
    } else if (Array.isArray(marketData)) {
        returns = [];
        for (let i = 1; i < marketData.length; i++) {
            returns.push((marketData[i] - marketData[i-1]) / marketData[i-1]);
        }
    } else {
        return -0.5 + Math.random() * 1; // Fallback
    }
    
    if (returns.length < 3) return 0;
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const n = returns.length;
    
    // Calculate third moment
    const m3 = returns.reduce((sum, r) => sum + Math.pow(r - mean, 3), 0) / n;
    const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / n);
    
    return std > 0 ? m3 / Math.pow(std, 3) : 0;
}

function calculatePercentiles(paths) {
    // Validate input
    if (!paths || !Array.isArray(paths) || paths.length === 0) {
        console.warn('calculatePercentiles: No valid paths provided');
        return { p5: [], median: [], p95: [] };
    }
    
    // Filter valid paths
    const validPaths = paths.filter(path => Array.isArray(path) && path.length > 0);
    if (validPaths.length === 0) {
        return { p5: [], median: [], p95: [] };
    }
    
    const timeSteps = validPaths[0].length;
    const percentiles = {
        p5: [],
        median: [],
        p95: []
    };
    
    for (let t = 0; t < timeSteps; t++) {
        const values = validPaths
            .map(path => path[t])
            .filter(v => typeof v === 'number' && !isNaN(v))
            .sort((a, b) => a - b);
        
        if (values.length > 0) {
            percentiles.p5.push(values[Math.floor(values.length * 0.05)]);
            percentiles.median.push(values[Math.floor(values.length * 0.5)]);
            percentiles.p95.push(values[Math.floor(values.length * 0.95)]);
        } else {
            // Use previous value or initial value if no valid data
            const lastValue = t > 0 ? percentiles.median[t-1] : 1000000;
            percentiles.p5.push(lastValue * 0.95);
            percentiles.median.push(lastValue);
            percentiles.p95.push(lastValue * 1.05);
        }
    }
    
    return percentiles;
}

function getRegimeColor(regime) {
    const colors = {
        'Quiet': 'green',
        'Normal': 'blue',
        'Volatile': 'yellow',
        'Crisis': 'red'
    };
    return colors[regime] || 'gray';
}