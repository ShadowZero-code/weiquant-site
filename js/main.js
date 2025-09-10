// Main JavaScript File for AI Financial Analyst
// Version 4.1 - Incremental Improvements

// Global Variables
const APP_VERSION = '4.4.0';
const RELEASE_DATE = '2025-01-07';
let currentAnalysis = null;
let analysisHistory = [];
let portfolio = [];

// Initialize on DOM Load
document.addEventListener('DOMContentLoaded', function() {
    // Completely disable Chart.js animations initially
    if (window.Chart) {
        Chart.defaults.animation = false;
        Chart.defaults.animations.resize = false;
        Chart.defaults.transitions.active.animation.duration = 0;
        Chart.defaults.transitions.resize.animation.duration = 0;
    }
    
    // Initialize app after a small delay to prevent initial jitter
    setTimeout(() => {
        initializeApp();
        loadFromLocalStorage();
        setupEventListeners();
        
        // Add loaded class to enable transitions after initialization
        document.body.classList.add('loaded');
        
        // Re-enable Chart.js animations after initial load
        if (window.Chart) {
            Chart.defaults.animation.duration = 300;
        }
    }, 100);
});

// Initialize Application
function initializeApp() {
    console.log('AI Financial Analyst initialized');
    updateDateTime();
    setInterval(updateDateTime, 60000); // Update every minute
    loadMarketData();
    renderPortfolio();
    renderHistory();
}

// Setup Event Listeners
function setupEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Add asset form submission
    const addAssetForm = document.getElementById('addAssetForm');
    if (addAssetForm) {
        addAssetForm.addEventListener('submit', function(e) {
            e.preventDefault();
            submitAsset();
        });
    }

    // Close mobile menu when clicking on links
    const mobileMenuLinks = document.querySelectorAll('#mobileMenu a');
    mobileMenuLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });
}

// Update Date and Time
function updateDateTime() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    const dateTimeString = now.toLocaleDateString('zh-CN', options);
    
    // Update any datetime displays if they exist
    const dateTimeElements = document.querySelectorAll('.datetime-display');
    dateTimeElements.forEach(element => {
        element.textContent = dateTimeString;
    });
}

// Smooth Scroll to Section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Insert Sample News
function insertSampleNews(type) {
    const newsInput = document.getElementById('newsInput');
    const samples = {
        tech: 'Apple reports quarterly earnings beating expectations by 20%. NVIDIA reaches all-time high on surging AI chip demand. Analysts predict continued tech sector outperformance with focus on artificial intelligence and cloud computing.',
        policy: 'Federal Reserve signals potential rate cuts in upcoming meetings. ECB maintains dovish stance amid slowing economic growth. Central bank policies diverge as inflation moderates globally.',
        market: 'Global markets volatile as geopolitical tensions rise. Oil prices surge above $90/barrel on supply concerns. Investors rotate into defensive assets with gold up 2% and bonds rallying.'
    };
    
    if (newsInput && samples[type]) {
        newsInput.value = samples[type];
        newsInput.focus();
    }
}

// Load and Save to Local Storage
function loadFromLocalStorage() {
    try {
        const savedPortfolio = localStorage.getItem('portfolio');
        const savedHistory = localStorage.getItem('analysisHistory');
        
        if (savedPortfolio) {
            portfolio = JSON.parse(savedPortfolio);
        }
        
        if (savedHistory) {
            analysisHistory = JSON.parse(savedHistory);
        }
    } catch (error) {
        console.error('Error loading from localStorage:', error);
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        localStorage.setItem('analysisHistory', JSON.stringify(analysisHistory));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

// Show Alert Message
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} fade-in fixed top-4 right-4 z-50 max-w-md`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    alertDiv.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Format Currency
function formatCurrency(amount, currency = 'CNY') {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

// Format Percentage
function formatPercentage(value) {
    const formatted = (value * 100).toFixed(2) + '%';
    if (value > 0) {
        return `+${formatted}`;
    }
    return formatted;
}

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Debounce Function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export Data
function exportData() {
    const data = {
        portfolio: portfolio,
        history: analysisHistory,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `financial-analysis-${Date.now()}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    showAlert('Data exported successfully', 'success');
}

// Import Data
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.portfolio) {
                portfolio = data.portfolio;
            }
            if (data.history) {
                analysisHistory = data.history;
            }
            saveToLocalStorage();
            renderPortfolio();
            renderHistory();
            showAlert('Data imported successfully', 'success');
        } catch (error) {
            showAlert('Import failed: Invalid file format', 'error');
        }
    };
    reader.readAsText(file);
}

// Calculate Risk Score
function calculateRiskScore(sentiment, volatility, marketCondition) {
    // Simple risk calculation algorithm
    let riskScore = 50; // Base score
    
    // Adjust based on sentiment
    if (sentiment === 'bearish') riskScore += 20;
    if (sentiment === 'bullish') riskScore -= 10;
    
    // Adjust based on volatility
    riskScore += volatility * 10;
    
    // Adjust based on market condition
    if (marketCondition === 'unstable') riskScore += 15;
    if (marketCondition === 'stable') riskScore -= 10;
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, riskScore));
}

// Render History
function renderHistory() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    if (analysisHistory.length === 0) {
        historyList.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-inbox text-4xl mb-4"></i>
                <p>No analysis history</p>
            </div>
        `;
        return;
    }
    
    historyList.innerHTML = analysisHistory.slice(-10).reverse().map(item => `
        <div class="history-item bg-white p-4 rounded-lg shadow">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-gray-800">${item.title || 'Market Analysis'}</h4>
                <span class="text-sm text-gray-500">${new Date(item.timestamp).toLocaleString('zh-CN')}</span>
            </div>
            <p class="text-gray-600 text-sm mb-2">${item.newsSnippet}</p>
            <div class="flex items-center space-x-4">
                <span class="text-sm ${item.sentiment === 'bullish' ? 'text-green-600' : item.sentiment === 'bearish' ? 'text-red-600' : 'text-gray-600'}">
                    <i class="fas ${item.sentiment === 'bullish' ? 'fa-arrow-up' : item.sentiment === 'bearish' ? 'fa-arrow-down' : 'fa-minus'}"></i>
                    ${item.sentiment === 'bullish' ? '看涨' : item.sentiment === 'bearish' ? '看跌' : '中性'}
                </span>
                <span class="text-sm text-gray-600">
                    <i class="fas fa-shield-alt"></i> 风险: ${item.riskLevel || '中等'}
                </span>
            </div>
        </div>
    `).join('');
}

// Clear All Data
function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
        // Preserve API settings before clearing
        const apiSettings = localStorage.getItem('apiSettings');
        const apiCallCount = localStorage.getItem('apiCallCount');
        const lastApiCall = localStorage.getItem('lastApiCall');
        
        // Clear portfolio and history
        portfolio = [];
        analysisHistory = [];
        
        // Clear localStorage
        localStorage.clear();
        
        // Restore API settings
        if (apiSettings) {
            localStorage.setItem('apiSettings', apiSettings);
        }
        if (apiCallCount) {
            localStorage.setItem('apiCallCount', apiCallCount);
        }
        if (lastApiCall) {
            localStorage.setItem('lastApiCall', lastApiCall);
        }
        
        // Update UI
        renderPortfolio();
        renderHistory();
        showAlert('All data has been cleared (API settings preserved)', 'warning');
    }
}

// Check API Availability
async function checkAPIAvailability() {
    try {
        // Check if DeepSeek API is configured and enabled
        const deepseekSettings = window.apiConfig ? window.apiConfig.getDeepSeekSettings() : null;
        
        if (deepseekSettings && deepseekSettings.enabled && deepseekSettings.apiKey) {
            // Try to test the connection
            try {
                const client = new window.DeepSeekClient(deepseekSettings);
                await client.testConnection();
                return {
                    available: true,
                    message: 'DeepSeek API is connected and ready'
                };
            } catch (error) {
                return {
                    available: false,
                    message: `API configured but connection failed: ${error.message}`
                };
            }
        } else {
            return {
                available: false,
                message: 'Currently using mock data mode (API not configured)'
            };
        }
    } catch (error) {
        return {
            available: false,
            message: 'Error checking API availability'
        };
    }
}

// Initialize tooltips if needed
function initTooltips() {
    // Placeholder for tooltip initialization
    // Can integrate with libraries like Tippy.js if needed
}

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showAlert('An error occurred, please refresh and try again', 'error');
});

// Handle visibility change (pause/resume animations when tab is hidden/visible)
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause any running animations or data fetching
        console.log('Page hidden - pausing updates');
    } else {
        // Resume animations and data fetching
        console.log('Page visible - resuming updates');
        loadMarketData();
    }
});