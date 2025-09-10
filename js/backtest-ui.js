/**
 * Backtest UI Module
 * Handles user interface for backtesting functionality
 */

// Initialize backtest engine
let backtestEngine = null;

/**
 * Initialize backtest module
 */
function initBacktest() {
    backtestEngine = new BacktestEngine();
    setupBacktestEventListeners();
}

/**
 * Setup event listeners for backtest UI
 */
function setupBacktestEventListeners() {
    // Strategy selection change
    const strategySelect = document.getElementById('backtestStrategy');
    if (strategySelect) {
        strategySelect.addEventListener('change', updateStrategyParameters);
    }
    
    // Run backtest button
    const runButton = document.getElementById('runBacktestBtn');
    if (runButton) {
        runButton.addEventListener('click', runBacktest);
    }
    
    // Load data button
    const loadDataBtn = document.getElementById('loadHistoricalDataBtn');
    if (loadDataBtn) {
        loadDataBtn.addEventListener('click', loadHistoricalData);
    }
    
    // Symbol change - clear previous results
    const symbolInput = document.getElementById('backtestSymbol');
    if (symbolInput) {
        symbolInput.addEventListener('change', function() {
            // Clear previous results when symbol changes
            const resultsSection = document.getElementById('backtestResults');
            if (resultsSection) {
                resultsSection.classList.add('hidden');
            }
            // Clear data summary
            const summaryDiv = document.getElementById('dataSummary');
            if (summaryDiv) {
                summaryDiv.innerHTML = '';
            }
        });
    }
    
    // Date change - clear previous results
    const startDateInput = document.getElementById('backtestStartDate');
    const endDateInput = document.getElementById('backtestEndDate');
    if (startDateInput) {
        startDateInput.addEventListener('change', clearBacktestResults);
    }
    if (endDateInput) {
        endDateInput.addEventListener('change', clearBacktestResults);
    }
}

/**
 * Clear backtest results when inputs change
 */
function clearBacktestResults() {
    const resultsSection = document.getElementById('backtestResults');
    if (resultsSection) {
        resultsSection.classList.add('hidden');
    }
}

/**
 * Update strategy parameter inputs based on selected strategy
 */
function updateStrategyParameters() {
    const strategy = document.getElementById('backtestStrategy').value;
    const paramsContainer = document.getElementById('strategyParameters');
    
    if (!paramsContainer) return;
    
    let paramsHTML = '';
    
    switch(strategy) {
        case 'momentum':
            paramsHTML = `
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">MA Period</label>
                    <input type="number" id="maPeriod" value="20" min="5" max="200" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <span class="text-xs text-gray-500">Moving average period for momentum signals</span>
                </div>
            `;
            break;
            
        case 'meanReversion':
            paramsHTML = `
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Lookback Period</label>
                    <input type="number" id="lookback" value="20" min="10" max="100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Z-Score Threshold</label>
                    <input type="number" id="zScoreThreshold" value="2" min="1" max="3" step="0.1" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <span class="text-xs text-gray-500">Standard deviations for entry/exit signals</span>
                </div>
            `;
            break;
            
        case 'macdCrossover':
            paramsHTML = `
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Fast Period</label>
                    <input type="number" id="fastPeriod" value="12" min="5" max="50" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Slow Period</label>
                    <input type="number" id="slowPeriod" value="26" min="10" max="100" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="mb-3">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Signal Period</label>
                    <input type="number" id="signalPeriod" value="9" min="5" max="20" 
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>
            `;
            break;
            
        case 'buyAndHold':
        default:
            paramsHTML = `
                <div class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-1"></i>
                    Buy and hold strategy has no additional parameters
                </div>
            `;
            break;
    }
    
    paramsContainer.innerHTML = paramsHTML;
}

/**
 * Load historical data for backtesting
 */
async function loadHistoricalData() {
    const symbol = document.getElementById('backtestSymbol').value;
    const startDate = document.getElementById('backtestStartDate').value;
    const endDate = document.getElementById('backtestEndDate').value;
    
    if (!symbol || !startDate || !endDate) {
        showAlert('Please fill in all data parameters', 'warning');
        return;
    }
    
    const loadBtn = document.getElementById('loadHistoricalDataBtn');
    const originalText = loadBtn.innerHTML;
    loadBtn.disabled = true;
    loadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Loading...';
    
    try {
        await backtestEngine.loadHistoricalData(symbol, startDate, endDate);
        showAlert(`Historical data loaded for ${symbol}`, 'success');
        
        // Display data summary
        displayDataSummary();
    } catch (error) {
        showAlert('Failed to load historical data: ' + error.message, 'error');
    } finally {
        loadBtn.disabled = false;
        loadBtn.innerHTML = originalText;
    }
}

/**
 * Display summary of loaded historical data
 */
function displayDataSummary() {
    const summaryDiv = document.getElementById('dataSummary');
    if (!summaryDiv || !backtestEngine.historicalData.length) return;
    
    const data = backtestEngine.historicalData;
    const startDate = data[0].date;
    const endDate = data[data.length - 1].date;
    const days = data.length;
    const startPrice = data[0].close.toFixed(2);
    const endPrice = data[data.length - 1].close.toFixed(2);
    const totalReturn = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
    
    summaryDiv.innerHTML = `
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 class="font-semibold text-blue-900 mb-2">Data Summary</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div><span class="text-gray-600">Period:</span> ${startDate} to ${endDate}</div>
                <div><span class="text-gray-600">Days:</span> ${days}</div>
                <div><span class="text-gray-600">Start Price:</span> $${startPrice}</div>
                <div><span class="text-gray-600">End Price:</span> $${endPrice}</div>
                <div class="col-span-2"><span class="text-gray-600">Total Return:</span> 
                    <span class="${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                        ${totalReturn}%
                    </span>
                </div>
            </div>
        </div>
    `;
}

/**
 * Run backtest with selected strategy and parameters
 */
async function runBacktest() {
    const strategy = document.getElementById('backtestStrategy').value;
    const initialCapital = parseFloat(document.getElementById('backtestCapital').value);
    const symbol = document.getElementById('backtestSymbol').value;
    const startDate = document.getElementById('backtestStartDate').value;
    const endDate = document.getElementById('backtestEndDate').value;
    
    if (!initialCapital || initialCapital <= 0) {
        showAlert('Please enter a valid initial capital amount', 'warning');
        return;
    }
    
    if (!symbol) {
        showAlert('Please enter a symbol', 'warning');
        return;
    }
    
    // Load historical data for the selected symbol
    try {
        await backtestEngine.loadHistoricalData(symbol, startDate, endDate);
        if (!backtestEngine.historicalData || backtestEngine.historicalData.length === 0) {
            showAlert('No historical data available for ' + symbol, 'error');
            return;
        }
    } catch (error) {
        showAlert('Failed to load data for ' + symbol + ': ' + error.message, 'error');
        return;
    }
    
    // Collect strategy-specific parameters
    const params = { initialCapital };
    
    switch(strategy) {
        case 'momentum':
            const maPeriod = document.getElementById('maPeriod');
            if (maPeriod) params.maPeriod = parseInt(maPeriod.value);
            break;
            
        case 'meanReversion':
            const lookback = document.getElementById('lookback');
            const zScore = document.getElementById('zScoreThreshold');
            if (lookback) params.lookback = parseInt(lookback.value);
            if (zScore) params.zScoreThreshold = parseFloat(zScore.value);
            break;
            
        case 'macdCrossover':
            const fast = document.getElementById('fastPeriod');
            const slow = document.getElementById('slowPeriod');
            const signal = document.getElementById('signalPeriod');
            if (fast) params.fastPeriod = parseInt(fast.value);
            if (slow) params.slowPeriod = parseInt(slow.value);
            if (signal) params.signalPeriod = parseInt(signal.value);
            break;
    }
    
    const runBtn = document.getElementById('runBacktestBtn');
    const originalText = runBtn.innerHTML;
    runBtn.disabled = true;
    runBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running Backtest...';
    
    try {
        const results = await backtestEngine.runBacktest(strategy, params);
        displayBacktestResults(results);
        showAlert('Backtest completed successfully', 'success');
    } catch (error) {
        showAlert('Backtest failed: ' + error.message, 'error');
        console.error('Backtest error:', error);
    } finally {
        runBtn.disabled = false;
        runBtn.innerHTML = originalText;
    }
}

/**
 * Display backtest results
 */
function displayBacktestResults(results) {
    // Display metrics
    displayBacktestMetrics(results.metrics);
    
    // Display trades
    displayBacktestTrades(results.trades);
    
    // Display chart
    displayBacktestChart(results);
    
    // Show results section
    const resultsSection = document.getElementById('backtestResults');
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
}

/**
 * Display performance metrics
 */
function displayBacktestMetrics(metrics) {
    const metricsDiv = document.getElementById('backtestMetrics');
    if (!metricsDiv) return;
    
    metricsDiv.innerHTML = `
        <div class="grid md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg border ${parseFloat(metrics.totalReturn) >= 0 ? 'border-green-200' : 'border-red-200'}">
                <div class="text-sm text-gray-600">Total Return</div>
                <div class="text-2xl font-bold ${parseFloat(metrics.totalReturn) >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${metrics.totalReturn}
                </div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Annualized Return</div>
                <div class="text-2xl font-bold text-gray-800">${metrics.annualizedReturn}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Sharpe Ratio</div>
                <div class="text-2xl font-bold text-gray-800">${metrics.sharpeRatio}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Max Drawdown</div>
                <div class="text-2xl font-bold text-red-600">${metrics.maxDrawdown}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Volatility</div>
                <div class="text-xl font-semibold text-gray-800">${metrics.volatility}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Total Trades</div>
                <div class="text-xl font-semibold text-gray-800">${metrics.totalTrades}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Win Rate</div>
                <div class="text-xl font-semibold text-gray-800">${metrics.winRate}</div>
            </div>
            <div class="bg-white p-4 rounded-lg border border-gray-200">
                <div class="text-sm text-gray-600">Final Value</div>
                <div class="text-xl font-semibold text-gray-800">$${metrics.finalValue}</div>
            </div>
        </div>
    `;
}

/**
 * Display trade history
 */
function displayBacktestTrades(trades) {
    const tradesDiv = document.getElementById('backtestTrades');
    if (!tradesDiv) return;
    
    if (trades.length === 0) {
        tradesDiv.innerHTML = '<p class="text-gray-500">No trades executed</p>';
        return;
    }
    
    const tradesHTML = trades.slice(0, 20).map(trade => `
        <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-sm">${trade.date}</td>
            <td class="px-4 py-2">
                <span class="px-2 py-1 text-xs rounded ${trade.action === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${trade.action}
                </span>
            </td>
            <td class="px-4 py-2 text-sm text-right">$${trade.price.toFixed(2)}</td>
            <td class="px-4 py-2 text-sm text-right">${trade.shares}</td>
            <td class="px-4 py-2 text-sm text-right">$${(trade.price * trade.shares).toFixed(2)}</td>
        </tr>
    `).join('');
    
    tradesDiv.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                        <th class="px-4 py-2 text-left text-sm font-medium text-gray-700">Action</th>
                        <th class="px-4 py-2 text-right text-sm font-medium text-gray-700">Price</th>
                        <th class="px-4 py-2 text-right text-sm font-medium text-gray-700">Shares</th>
                        <th class="px-4 py-2 text-right text-sm font-medium text-gray-700">Value</th>
                    </tr>
                </thead>
                <tbody>
                    ${tradesHTML}
                </tbody>
            </table>
            ${trades.length > 20 ? `<p class="text-sm text-gray-500 mt-2">Showing first 20 of ${trades.length} trades</p>` : ''}
        </div>
    `;
}

/**
 * Display backtest chart
 */
function displayBacktestChart(results) {
    const canvasElement = document.getElementById('backtestChart');
    if (!canvasElement) return;
    
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.error('Chart.js is not loaded. Backtest chart will not be displayed.');
        return;
    }
    
    // Destroy existing chart using Chart.getChart()
    const existingChart = Chart.getChart(canvasElement);
    if (existingChart) {
        existingChart.destroy();
    }
    
    const ctx = canvasElement.getContext('2d');
    
    const chartData = {
        labels: results.portfolioValues.map(v => v.date),
        datasets: [{
            label: 'Portfolio Value',
            data: results.portfolioValues.map(v => v.value),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.1,
            fill: true
        }]
    };
    
    // Add strategy-specific indicators
    if (results.portfolioValues[0].ma) {
        chartData.datasets.push({
            label: 'Moving Average',
            data: results.portfolioValues.map(v => v.ma),
            borderColor: 'rgb(239, 68, 68)',
            borderDash: [5, 5],
            tension: 0.1,
            fill: false
        });
    }
    
    // Create new chart (no need to store in global variable)
    new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Backtest Performance'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false // Hide dates for cleaner look
                },
                y: {
                    title: {
                        display: true,
                        text: 'Portfolio Value ($)'
                    }
                }
            }
        }
    });
    
    // Add trade markers
    addTradeMarkers(results.trades);
}

/**
 * Add trade markers to the chart
 */
function addTradeMarkers(trades) {
    if (!backtestChart || trades.length === 0) return;
    
    // This would add visual markers for buy/sell points
    // Implementation depends on Chart.js plugins
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('backtest')) {
        initBacktest();
        updateStrategyParameters(); // Set default parameters
    }
});