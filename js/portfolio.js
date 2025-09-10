/**
 * Portfolio Management Module
 * Handles asset management, validation, and portfolio operations
 * Includes XSS protection and duplicate detection
 */

// Add to Portfolio
function addToPortfolio() {
    const modal = document.getElementById('addAssetModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Close asset modal and reset form
 */
function closeAssetModal() {
    const modal = document.getElementById('addAssetModal');
    if (modal) {
        modal.classList.add('hidden');
        // Reset form
        document.getElementById('addAssetForm').reset();
        
        // Reset submit button to add mode
        const submitBtn = document.querySelector('#addAssetModal button[onclick*="submitAsset"]');
        if (submitBtn) {
            submitBtn.setAttribute('onclick', 'submitAsset()');
            submitBtn.innerHTML = '<i class="fas fa-plus mr-2"></i>Add Asset';
        }
    }
}

/**
 * Submit new asset to portfolio with validation and duplicate detection
 */
function submitAsset(editMode = false, assetId = null) {
    const assetType = document.getElementById('assetType').value;
    const assetNameRaw = document.getElementById('assetName').value.trim();
    
    // Sanitize asset name to prevent XSS
    const assetName = window.SecurityUtils ? 
        window.SecurityUtils.sanitizeInput(assetNameRaw, { maxLength: 50, stripHtml: true }) : 
        assetNameRaw;
    const assetAmount = parseFloat(document.getElementById('assetAmount').value);
    const assetPrice = parseFloat(document.getElementById('assetPrice').value);
    
    // Comprehensive input validation
    if (!assetName) {
        showAlert('Please enter asset name', 'warning');
        return;
    }
    
    if (assetName.length > 50) {
        showAlert('Asset name must be less than 50 characters', 'warning');
        return;
    }
    
    if (isNaN(assetAmount) || assetAmount <= 0) {
        showAlert('Please enter a valid positive amount', 'warning');
        return;
    }
    
    if (assetAmount > 1000000000) {
        showAlert('Amount exceeds maximum limit (1 billion)', 'warning');
        return;
    }
    
    if (isNaN(assetPrice) || assetPrice <= 0) {
        showAlert('Please enter a valid positive price', 'warning');
        return;
    }
    
    if (assetPrice > 1000000) {
        showAlert('Price exceeds maximum limit (1 million)', 'warning');
        return;
    }
    
    // Check for duplicate assets (same name and type)
    if (!editMode) {
        const duplicate = portfolio.find(a => 
            a.name.toLowerCase() === assetName.toLowerCase() && 
            a.type === assetType
        );
        
        if (duplicate) {
            if (!confirm(`Asset "${assetName}" already exists. Do you want to add it anyway?`)) {
                return;
            }
        }
    }
    
    if (editMode && assetId) {
        // Edit existing asset
        const assetIndex = portfolio.findIndex(a => a.id === assetId);
        if (assetIndex !== -1) {
            portfolio[assetIndex] = {
                ...portfolio[assetIndex],
                type: assetType,
                name: assetName,
                amount: assetAmount,
                buyPrice: assetPrice,
                currentPrice: portfolio[assetIndex].currentPrice || assetPrice,
                totalValue: assetAmount * (portfolio[assetIndex].currentPrice || assetPrice),
                gainLoss: assetAmount * ((portfolio[assetIndex].currentPrice || assetPrice) - assetPrice),
                gainLossPercent: ((portfolio[assetIndex].currentPrice || assetPrice) - assetPrice) / assetPrice * 100
            };
            showAlert('Asset updated successfully', 'success');
        }
    } else {
        // Add new asset
        const asset = {
            id: window.SecurityUtils ? window.SecurityUtils.generateSecureId() : generateId(),
            type: assetType,
            name: assetName,
            amount: assetAmount,
            buyPrice: assetPrice,
            currentPrice: assetPrice,
            totalValue: assetAmount * assetPrice,
            gainLoss: 0,
            gainLossPercent: 0,
            addedDate: new Date().toISOString()
        };
        portfolio.push(asset);
        showAlert(window.i18n ? window.i18n.t('alert.assetAdded') : 'Asset added successfully', 'success');
    }
    
    saveToLocalStorage();
    renderPortfolio();
    updatePerformanceChart();
    closeAssetModal();
}

// Render Portfolio
function renderPortfolio() {
    const portfolioList = document.getElementById('portfolioList');
    if (!portfolioList) return;
    
    if (portfolio.length === 0) {
        portfolioList.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-folder-open text-3xl mb-2"></i>
                <p>No portfolio assets</p>
            </div>
        `;
        return;
    }
    
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalGainLoss = portfolio.reduce((sum, asset) => sum + asset.gainLoss, 0);
    
    portfolioList.innerHTML = `
        <div class="mb-4 p-3 bg-blue-50 rounded-lg">
            <div class="flex justify-between items-center">
                <span class="text-sm text-gray-600">Total Value</span>
                <span class="font-bold text-lg">${formatCurrency(totalValue)}</span>
            </div>
            <div class="flex justify-between items-center mt-2">
                <span class="text-sm text-gray-600">Total P&L</span>
                <span class="font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ${formatCurrency(totalGainLoss)}
                    (${formatPercentage(totalGainLoss / (totalValue - totalGainLoss))})
                </span>
            </div>
        </div>
        ${portfolio.map(asset => createPortfolioItemHTML(asset)).join('')}
    `;
    
    // Add event listeners for actions
    portfolio.forEach(asset => {
        // Edit button
        const editBtn = document.getElementById(`edit-${asset.id}`);
        if (editBtn) {
            editBtn.addEventListener('click', () => editAsset(asset.id));
        }
        
        // Update price button
        const updateBtn = document.getElementById(`update-${asset.id}`);
        if (updateBtn) {
            updateBtn.addEventListener('click', () => updateAssetPrice(asset.id));
        }
        
        // Remove button
        const removeBtn = document.getElementById(`remove-${asset.id}`);
        if (removeBtn) {
            removeBtn.addEventListener('click', () => removeFromPortfolio(asset.id));
        }
    });
}

/**
 * Create HTML for portfolio item with XSS protection
 * @param {Object} asset - Asset object
 * @returns {string} Safe HTML string
 */
function createPortfolioItemHTML(asset) {
    const gainLossClass = asset.gainLoss >= 0 ? 'text-green-600' : 'text-red-600';
    const typeIcon = getAssetTypeIcon(asset.type);
    
    // Escape asset name to prevent XSS
    const safeName = window.SecurityUtils ? 
        window.SecurityUtils.escapeHtml(asset.name) : 
        asset.name.replace(/[<>"']/g, '');
    
    return `
        <div class="portfolio-item mb-3">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center space-x-2">
                    ${typeIcon}
                    <span class="font-semibold">${safeName}</span>
                </div>
                <div class="flex space-x-2">
                    <button id="edit-${asset.id}" class="text-green-600 hover:text-green-800" title="Edit Asset">
                        <i class="fas fa-edit text-sm"></i>
                    </button>
                    <button id="update-${asset.id}" class="text-blue-600 hover:text-blue-800" title="Update Price">
                        <i class="fas fa-sync text-sm"></i>
                    </button>
                    <button id="remove-${asset.id}" class="text-red-600 hover:text-red-800" title="Remove Asset">
                        <i class="fas fa-trash text-sm"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span class="text-gray-600">Quantity:</span>
                    <span class="ml-1">${asset.amount}</span>
                </div>
                <div>
                    <span class="text-gray-600">Buy Price:</span>
                    <span class="ml-1">${formatCurrency(asset.buyPrice)}</span>
                </div>
                <div>
                    <span class="text-gray-600">Current:</span>
                    <span class="ml-1">${formatCurrency(asset.currentPrice)}</span>
                </div>
                <div>
                    <span class="text-gray-600">Value:</span>
                    <span class="ml-1 font-semibold">${formatCurrency(asset.totalValue)}</span>
                </div>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-200">
                <span class="text-gray-600 text-sm">P&L:</span>
                <span class="${gainLossClass} font-semibold ml-1">
                    ${formatCurrency(asset.gainLoss)}
                    (${formatPercentage(asset.gainLossPercent / 100)})
                </span>
            </div>
        </div>
    `;
}

// Get Asset Type Icon
function getAssetTypeIcon(type) {
    const icons = {
        stock: '<i class="fas fa-chart-line text-blue-600"></i>',
        bond: '<i class="fas fa-file-invoice-dollar text-green-600"></i>',
        fund: '<i class="fas fa-wallet text-purple-600"></i>',
        crypto: '<i class="fas fa-bitcoin text-orange-600"></i>'
    };
    return icons[type] || '<i class="fas fa-coins text-gray-600"></i>';
}

/**
 * Edit existing asset
 * @param {string} assetId - Asset ID to edit
 */
function editAsset(assetId) {
    const asset = portfolio.find(a => a.id === assetId);
    if (!asset) return;
    
    // Populate modal with existing values
    document.getElementById('assetType').value = asset.type;
    document.getElementById('assetName').value = asset.name;
    document.getElementById('assetAmount').value = asset.amount;
    document.getElementById('assetPrice').value = asset.buyPrice;
    
    // Change submit button to update mode
    const submitBtn = document.querySelector('#addAssetModal button[onclick="submitAsset()"]');
    if (submitBtn) {
        submitBtn.setAttribute('onclick', `submitAsset(true, '${assetId}')`);
        submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>Update Asset';
    }
    
    // Open modal
    const modal = document.getElementById('addAssetModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

/**
 * Update asset price
 * @param {string} assetId - Asset ID to update
 */
function updateAssetPrice(assetId) {
    const asset = portfolio.find(a => a.id === assetId);
    if (!asset) return;
    
    const newPrice = prompt(`Enter new price for ${asset.name}:`, asset.currentPrice);
    
    if (newPrice === null) {
        // User cancelled
        return;
    }
    
    const price = parseFloat(newPrice);
    
    // Validate input
    if (isNaN(price)) {
        showAlert('Please enter a valid number', 'warning');
        return;
    }
    
    if (price <= 0) {
        showAlert('Price must be positive', 'warning');
        return;
    }
    
    if (price > 1000000) {
        showAlert('Price exceeds maximum limit (1 million)', 'warning');
        return;
    }
    
    // Update asset
    asset.currentPrice = price;
    asset.totalValue = asset.amount * asset.currentPrice;
    asset.gainLoss = asset.totalValue - (asset.amount * asset.buyPrice);
    asset.gainLossPercent = ((asset.currentPrice - asset.buyPrice) / asset.buyPrice) * 100;
    
    saveToLocalStorage();
    renderPortfolio();
    updatePerformanceChart();
    showAlert('Price updated successfully', 'success');
}

// Remove from Portfolio
function removeFromPortfolio(assetId) {
    if (confirm('Are you sure you want to remove this asset?')) {
        portfolio = portfolio.filter(a => a.id !== assetId);
        saveToLocalStorage();
        renderPortfolio();
        updatePerformanceChart();
        showAlert('Asset removed', 'info');
    }
}

// Update Performance Chart
function updatePerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    const chartCtx = ctx.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.performanceChartInstance) {
        window.performanceChartInstance.destroy();
    }
    
    if (portfolio.length === 0) {
        // Show empty state
        window.performanceChartInstance = new Chart(chartCtx, {
            type: 'line',
            data: {
                labels: ['No Data'],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [0],
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
        return;
    }
    
    // Generate mock historical data for demonstration
    const days = 30;
    const labels = [];
    const data = [];
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    
    for (let i = days; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        
        // Generate random fluctuation
        const fluctuation = (Math.random() - 0.5) * 0.02; // ±2% daily change
        const value = totalValue * (1 + fluctuation * (days - i) / days);
        data.push(value);
    }
    
    window.performanceChartInstance = new Chart(chartCtx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Portfolio Value',
                data: data,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return 'Value: ' + formatCurrency(context.parsed.y);
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    display: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
}

// Calculate Portfolio Statistics
function calculatePortfolioStats() {
    if (portfolio.length === 0) {
        return {
            totalValue: 0,
            totalCost: 0,
            totalGainLoss: 0,
            totalGainLossPercent: 0,
            bestPerformer: null,
            worstPerformer: null,
            diversification: 0
        };
    }
    
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    const totalCost = portfolio.reduce((sum, asset) => sum + (asset.amount * asset.buyPrice), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = (totalGainLoss / totalCost) * 100;
    
    // Find best and worst performers
    const sortedByPerformance = [...portfolio].sort((a, b) => b.gainLossPercent - a.gainLossPercent);
    const bestPerformer = sortedByPerformance[0];
    const worstPerformer = sortedByPerformance[sortedByPerformance.length - 1];
    
    // Calculate diversification (based on asset types)
    const typeCount = new Set(portfolio.map(a => a.type)).size;
    const diversification = (typeCount / 4) * 100; // 4 is max number of asset types
    
    return {
        totalValue,
        totalCost,
        totalGainLoss,
        totalGainLossPercent,
        bestPerformer,
        worstPerformer,
        diversification
    };
}

// Export Portfolio Data
function exportPortfolio() {
    const stats = calculatePortfolioStats();
    const exportData = {
        portfolio: portfolio,
        statistics: stats,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `portfolio-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Portfolio exported successfully', 'success');
}

// Import Portfolio Data
function importPortfolio(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.portfolio && Array.isArray(data.portfolio)) {
                portfolio = data.portfolio;
                saveToLocalStorage();
                renderPortfolio();
                updatePerformanceChart();
                showAlert('Portfolio imported successfully', 'success');
            } else {
                showAlert('Invalid portfolio file', 'error');
            }
        } catch (error) {
            showAlert('File parsing failed', 'error');
        }
    };
    reader.readAsText(file);
}

// Rebalance Portfolio
function rebalancePortfolio() {
    if (!currentAnalysis || portfolio.length === 0) {
        showAlert('Please perform market analysis first', 'warning');
        return;
    }
    
    const targetAllocation = currentAnalysis.allocation;
    const totalValue = portfolio.reduce((sum, asset) => sum + asset.totalValue, 0);
    
    // Calculate current allocation
    const currentAllocation = {
        stocks: 0,
        bonds: 0,
        commodities: 0,
        cash: 0
    };
    
    portfolio.forEach(asset => {
        const percentage = (asset.totalValue / totalValue) * 100;
        switch(asset.type) {
            case 'stock':
                currentAllocation.stocks += percentage;
                break;
            case 'bond':
                currentAllocation.bonds += percentage;
                break;
            case 'fund':
                currentAllocation.stocks += percentage * 0.7; // Assume funds are 70% stocks
                currentAllocation.bonds += percentage * 0.3;
                break;
            case 'crypto':
                currentAllocation.commodities += percentage;
                break;
        }
    });
    
    // Show rebalancing suggestions
    const suggestions = [];
    
    if (Math.abs(currentAllocation.stocks - targetAllocation.stocks) > 5) {
        if (currentAllocation.stocks < targetAllocation.stocks) {
            suggestions.push(`Increase equity allocation by ${(targetAllocation.stocks - currentAllocation.stocks).toFixed(1)}%`);
        } else {
            suggestions.push(`Reduce equity allocation by ${(currentAllocation.stocks - targetAllocation.stocks).toFixed(1)}%`);
        }
    }
    
    if (Math.abs(currentAllocation.bonds - targetAllocation.bonds) > 5) {
        if (currentAllocation.bonds < targetAllocation.bonds) {
            suggestions.push(`Increase bond allocation by ${(targetAllocation.bonds - currentAllocation.bonds).toFixed(1)}%`);
        } else {
            suggestions.push(`Reduce bond allocation by ${(currentAllocation.bonds - targetAllocation.bonds).toFixed(1)}%`);
        }
    }
    
    if (suggestions.length > 0) {
        alert('Rebalancing suggestions:\n\n' + suggestions.join('\n'));
    } else {
        showAlert('Current allocation is close to target', 'success');
    }
}

// Initialize performance chart on load
document.addEventListener('DOMContentLoaded', function() {
    // Wait for body to have loaded class before initializing charts
    const checkLoaded = setInterval(() => {
        if (document.body.classList.contains('loaded')) {
            clearInterval(checkLoaded);
            updatePerformanceChart();
        }
    }, 50);
});