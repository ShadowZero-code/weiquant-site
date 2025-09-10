// Market Data Module

// Mock market data
const mockStocks = [
    { code: 'AAPL', name: 'Apple Inc.', price: 195.50, change: 2.3, volume: '52.5M', volumeValue: 52.5, sector: 'Technology' },
    { code: 'MSFT', name: 'Microsoft Corp.', price: 425.20, change: 1.8, volume: '28.8M', volumeValue: 28.8, sector: 'Technology' },
    { code: 'JPM', name: 'JPMorgan Chase', price: 182.45, change: -1.2, volume: '12.2M', volumeValue: 12.2, sector: 'Financial' },
    { code: 'BAC', name: 'Bank of America', price: 35.28, change: 0.5, volume: '42.1M', volumeValue: 42.1, sector: 'Financial' },
    { code: 'NVDA', name: 'NVIDIA Corp.', price: 531.56, change: 3.1, volume: '35.5M', volumeValue: 35.5, sector: 'Technology' },
    { code: 'TSLA', name: 'Tesla Inc.', price: 248.30, change: -2.5, volume: '98.8M', volumeValue: 98.8, sector: 'EV/Clean Energy' },
    { code: 'AMZN', name: 'Amazon.com', price: 158.60, change: 1.2, volume: '45.5M', volumeValue: 45.5, sector: 'E-Commerce' },
    { code: 'GS', name: 'Goldman Sachs', price: 432.45, change: 0.8, volume: '2.9M', volumeValue: 2.9, sector: 'Financial' },
    { code: 'GOOGL', name: 'Alphabet Inc.', price: 143.85, change: -0.5, volume: '25.2M', volumeValue: 25.2, sector: 'Technology' },
    { code: 'XOM', name: 'Exxon Mobil', price: 104.15, change: 0.3, volume: '18.2M', volumeValue: 18.2, sector: 'Energy' }
];

// Load Market Data
function loadMarketData() {
    updateMarketIndices();
    updateStocksTable();
    startMarketDataRefresh();
}

// Update Market Indices
function updateMarketIndices() {
    // Simulate market indices updates with random fluctuations
    const indices = [
        { id: 'sh-index', base: 3245.67, name: 'Shanghai Index' },
        { id: 'sz-index', base: 10456.89, name: 'Shenzhen Index' },
        { id: 'nasdaq-index', base: 15234.56, name: 'NASDAQ' },
        { id: 'sp500-index', base: 4567.89, name: 'S&P 500' }
    ];
    
    indices.forEach(index => {
        const element = document.querySelector(`[data-index="${index.id}"]`);
        if (element) {
            const change = (Math.random() - 0.5) * 2; // Random change between -1% and 1%
            const newValue = index.base * (1 + change / 100);
            updateIndexDisplay(element, newValue, change);
        }
    });
}

// Update Index Display
function updateIndexDisplay(element, value, changePercent) {
    if (!element) return;
    
    const valueElement = element.querySelector('.index-value');
    const changeElement = element.querySelector('.index-change');
    
    if (valueElement) {
        valueElement.textContent = value.toFixed(2);
    }
    
    if (changeElement) {
        const changeText = changePercent >= 0 ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`;
        changeElement.textContent = changeText;
        // Preserve the base classes and only update color classes
        changeElement.className = changePercent >= 0 ? 'index-change text-sm text-green-600' : 'index-change text-sm text-red-600';
    }
}

// Update Stocks Table
function updateStocksTable() {
    const stocksTable = document.getElementById('stocksTable');
    if (!stocksTable) return;
    
    // Add some randomization to stock prices and volumes
    const updatedStocks = mockStocks.map(stock => {
        const priceChange = (Math.random() - 0.5) * 0.02; // ±1% random change
        const newPrice = stock.price * (1 + priceChange);
        const newChange = stock.change + (Math.random() - 0.5) * 0.5; // ±0.25% change adjustment
        const volumeChange = (Math.random() - 0.5) * 0.2; // ±10% volume change
        const newVolumeValue = Math.max(0.1, stock.volumeValue * (1 + volumeChange));
        
        return {
            ...stock,
            price: newPrice,
            change: newChange,
            volumeValue: newVolumeValue,
            volume: formatVolume(newVolumeValue)
        };
    });
    
    stocksTable.innerHTML = updatedStocks.map(stock => `
        <tr class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 font-medium">${stock.code}</td>
            <td class="px-4 py-3">
                <div>
                    <div class="font-medium">${stock.name}</div>
                    <div class="text-xs text-gray-500">${stock.sector}</div>
                </div>
            </td>
            <td class="px-4 py-3 text-right font-semibold">${stock.price.toFixed(2)}</td>
            <td class="px-4 py-3 text-right">
                <span class="${stock.change >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                    <i class="fas fa-arrow-${stock.change >= 0 ? 'up' : 'down'} ml-1 text-xs"></i>
                </span>
            </td>
            <td class="px-4 py-3 text-right text-gray-600">${stock.volume}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="analyzeStock('${stock.code}', '${stock.name}')" 
                    class="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition text-sm">
                    <i class="fas fa-chart-line mr-1"></i>Analyze
                </button>
                <button onclick="addStockToPortfolio('${stock.code}', '${stock.name}', ${stock.price})" 
                    class="bg-green-100 text-green-700 px-3 py-1 rounded hover:bg-green-200 transition text-sm ml-2">
                    <i class="fas fa-plus mr-1"></i>Add
                </button>
            </td>
        </tr>
    `).join('');
}

// Analyze Stock
function analyzeStock(code, name) {
    // Generate a quick analysis for the stock
    const newsInput = document.getElementById('newsInput');
    if (newsInput) {
        newsInput.value = `${name} (${code}) Latest Market Update: This stock has shown strong performance with increased volume, breaking key resistance levels. Fundamentals remain solid with steady earnings growth and strong industry position. Monitor for continued momentum.`;
        scrollToSection('analysis');
        setTimeout(() => performAnalysis(), 500);
    }
}

// Add Stock to Portfolio
function addStockToPortfolio(code, name, currentPrice) {
    // Pre-fill the add asset form
    document.getElementById('assetType').value = 'stock';
    document.getElementById('assetName').value = `${name}(${code})`;
    document.getElementById('assetPrice').value = currentPrice.toFixed(2);
    
    // Open the modal
    addToPortfolio();
}

// Start Market Data Refresh
function startMarketDataRefresh() {
    // Refresh market data every 30 seconds
    setInterval(() => {
        updateMarketIndices();
        updateStocksTable();
        updateMarketSentiment();
    }, 30000);
}

// Format volume with consistent units (millions)
function formatVolume(value) {
    if (value >= 1000) {
        return (value / 1000).toFixed(1) + 'B';
    } else if (value >= 1) {
        return value.toFixed(1) + 'M';
    } else {
        return (value * 1000).toFixed(0) + 'K';
    }
}

// Update Market Sentiment
function updateMarketSentiment() {
    // Calculate overall market sentiment based on current stock performance
    // Use the actual current state of stocks, not the base mockStocks
    const stocksTable = document.getElementById('stocksTable');
    if (!stocksTable) return;
    
    const rows = stocksTable.querySelectorAll('tr');
    let upStocks = 0;
    let downStocks = 0;
    let neutralStocks = 0;
    
    rows.forEach(row => {
        const changeCell = row.cells[3];
        if (changeCell) {
            const changeText = changeCell.textContent;
            if (changeText.includes('+')) {
                upStocks++;
            } else if (changeText.includes('-') && !changeText.includes('-0.00')) {
                downStocks++;
            } else {
                neutralStocks++;
            }
        }
    });
    
    const totalStocks = upStocks + downStocks + neutralStocks;
    if (totalStocks === 0) return;
    
    const sentiment = {
        bullish: (upStocks / totalStocks) * 100,
        bearish: (downStocks / totalStocks) * 100,
        neutral: (neutralStocks / totalStocks) * 100
    };
    
    // Update sentiment display if exists
    updateSentimentDisplay(sentiment);
}

// Update Sentiment Display
function updateSentimentDisplay(sentiment) {
    const sentimentElement = document.getElementById('marketSentiment');
    if (!sentimentElement) return;
    
    let sentimentText = 'Neutral';
    let sentimentColor = 'text-gray-600';
    let sentimentIcon = 'fa-minus';
    
    if (sentiment.bullish > 60) {
        sentimentText = 'Bullish';
        sentimentColor = 'text-green-600';
        sentimentIcon = 'fa-smile';
    } else if (sentiment.bearish > 60) {
        sentimentText = 'Bearish';
        sentimentColor = 'text-red-600';
        sentimentIcon = 'fa-frown';
    }
    
    sentimentElement.innerHTML = `
        <i class="fas ${sentimentIcon} ${sentimentColor}"></i>
        <span class="${sentimentColor} font-semibold ml-2">${sentimentText}</span>
    `;
}

// Search Stocks
function searchStocks(query) {
    if (!query) {
        updateStocksTable();
        return;
    }
    
    const filtered = mockStocks.filter(stock => 
        stock.code.includes(query) || 
        stock.name.toLowerCase().includes(query.toLowerCase()) ||
        stock.sector.includes(query)
    );
    
    const stocksTable = document.getElementById('stocksTable');
    if (!stocksTable) return;
    
    if (filtered.length === 0) {
        stocksTable.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-search text-3xl mb-2"></i>
                    <p>No matching stocks found</p>
                </td>
            </tr>
        `;
        return;
    }
    
    stocksTable.innerHTML = filtered.map(stock => `
        <tr class="border-b hover:bg-gray-50 transition">
            <td class="px-4 py-3 font-medium">${stock.code}</td>
            <td class="px-4 py-3">
                <div>
                    <div class="font-medium">${stock.name}</div>
                    <div class="text-xs text-gray-500">${stock.sector}</div>
                </div>
            </td>
            <td class="px-4 py-3 text-right font-semibold">${stock.price.toFixed(2)}</td>
            <td class="px-4 py-3 text-right">
                <span class="${stock.change >= 0 ? 'text-green-600' : 'text-red-600'} font-semibold">
                    ${stock.change >= 0 ? '+' : ''}${stock.change.toFixed(2)}%
                </span>
            </td>
            <td class="px-4 py-3 text-right text-gray-600">${stock.volume}</td>
            <td class="px-4 py-3 text-center">
                <button onclick="analyzeStock('${stock.code}', '${stock.name}')" 
                    class="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition text-sm">
                    Analyze
                </button>
            </td>
        </tr>
    `).join('');
}

// Get Market Summary
function getMarketSummary() {
    const upStocks = mockStocks.filter(s => s.change > 0).length;
    const downStocks = mockStocks.filter(s => s.change < 0).length;
    const totalVolume = mockStocks.reduce((sum, stock) => {
        const volume = parseFloat(stock.volume.replace('亿', ''));
        return sum + volume;
    }, 0);
    
    return {
        upStocks,
        downStocks,
        totalVolume: totalVolume.toFixed(1) + '亿',
        topGainer: mockStocks.reduce((max, stock) => stock.change > max.change ? stock : max),
        topLoser: mockStocks.reduce((min, stock) => stock.change < min.change ? stock : min)
    };
}

// Create Market Heat Map
function createMarketHeatMap() {
    const sectors = {};
    
    // Group stocks by sector
    mockStocks.forEach(stock => {
        if (!sectors[stock.sector]) {
            sectors[stock.sector] = {
                stocks: [],
                avgChange: 0
            };
        }
        sectors[stock.sector].stocks.push(stock);
    });
    
    // Calculate average change for each sector
    Object.keys(sectors).forEach(sector => {
        const totalChange = sectors[sector].stocks.reduce((sum, stock) => sum + stock.change, 0);
        sectors[sector].avgChange = totalChange / sectors[sector].stocks.length;
    });
    
    return sectors;
}

// Display Sector Performance
function displaySectorPerformance() {
    const sectors = createMarketHeatMap();
    const container = document.getElementById('sectorPerformance');
    if (!container) return;
    
    container.innerHTML = Object.entries(sectors).map(([sector, data]) => {
        const colorClass = data.avgChange > 0 ? 'bg-green-100 text-green-800' : 
                          data.avgChange < 0 ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800';
        
        return `
            <div class="${colorClass} p-4 rounded-lg">
                <div class="font-semibold">${sector}</div>
                <div class="text-2xl font-bold mt-2">
                    ${data.avgChange >= 0 ? '+' : ''}${data.avgChange.toFixed(2)}%
                </div>
                <div class="text-sm mt-1">${data.stocks.length} stocks</div>
            </div>
        `;
    }).join('');
}

// Export Market Data
function exportMarketData() {
    const marketData = {
        stocks: mockStocks,
        summary: getMarketSummary(),
        sectors: createMarketHeatMap(),
        exportTime: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(marketData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `market-data-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Market data exported successfully', 'success');
}

// Subscribe to Market Alerts
function subscribeToAlerts(email) {
    // In a real application, this would send the email to a backend service
    if (!email || !email.includes('@')) {
        showAlert('Please enter a valid email address', 'warning');
        return;
    }
    
    // Mock subscription
    localStorage.setItem('alertEmail', email);
    showAlert('Subscription successful! You will receive market alerts via email', 'success');
}

// Check for Market Alerts
function checkMarketAlerts() {
    const alerts = [];
    
    // Check for significant market movements
    mockStocks.forEach(stock => {
        if (Math.abs(stock.change) > 5) {
            alerts.push({
                type: stock.change > 0 ? 'surge' : 'plunge',
                stock: stock,
                message: `${stock.name} ${stock.change > 0 ? 'surged' : 'plunged'} ${Math.abs(stock.change).toFixed(2)}%`
            });
        }
    });
    
    // Check for high volume (above 80M)
    mockStocks.forEach(stock => {
        if (stock.volumeValue > 80) {
            alerts.push({
                type: 'volume',
                stock: stock,
                message: `${stock.name} unusual high volume: ${stock.volume}`
            });
        }
    });
    
    return alerts;
}

// Display Market Alerts
function displayMarketAlerts() {
    const alerts = checkMarketAlerts();
    if (alerts.length === 0) return;
    
    alerts.forEach(alert => {
        const alertType = alert.type === 'surge' ? 'success' : 
                         alert.type === 'plunge' ? 'error' : 'info';
        showAlert(alert.message, alertType);
    });
}