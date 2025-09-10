/**
 * Enhanced Error Handler Module
 * Provides comprehensive error handling and user feedback
 * Version 4.1
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.alertQueue = [];
        this.isProcessingAlerts = false;
        
        // Error types and their user-friendly messages
        this.errorMessages = {
            'API_KEY_MISSING': 'API key is required. Please configure it in Settings.',
            'API_CONNECTION_FAILED': 'Cannot connect to API service. Please check your connection.',
            'API_RATE_LIMIT': 'API rate limit exceeded. Please wait a moment and try again.',
            'API_INVALID_RESPONSE': 'Received invalid response from API. Using fallback mode.',
            'PORTFOLIO_EMPTY': 'No assets in portfolio. Please add assets first.',
            'INVALID_INPUT': 'Invalid input provided. Please check your data.',
            'CALCULATION_ERROR': 'Error in calculation. Please verify your inputs.',
            'DATA_LOAD_ERROR': 'Failed to load data. Please refresh the page.',
            'DATA_SAVE_ERROR': 'Failed to save data. Please try again.',
            'NETWORK_ERROR': 'Network connection issue. Please check your internet.',
            'PERMISSION_DENIED': 'Permission denied. Please check your settings.',
            'FEATURE_UNAVAILABLE': 'This feature is temporarily unavailable.',
            'SESSION_EXPIRED': 'Your session has expired. Please refresh the page.',
            'VALIDATION_ERROR': 'Validation failed. Please check all required fields.',
            'BACKTEST_ERROR': 'Backtest failed. Please check your parameters.',
            'QUANT_MODEL_ERROR': 'Quantitative model error. Please verify inputs.',
            'MARKET_DATA_ERROR': 'Cannot fetch market data. Using cached data.',
            'ANALYSIS_ERROR': 'Analysis failed. Switching to simplified mode.'
        };
        
        // Initialize error listeners
        this.initializeErrorListeners();
    }
    
    /**
     * Initialize global error listeners
     */
    initializeErrorListeners() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'UNCAUGHT_ERROR',
                message: event.message,
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            });
        });
        
        // Handle promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'UNHANDLED_REJECTION',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                promise: event.promise
            });
            event.preventDefault();
        });
    }
    
    /**
     * Main error handler
     */
    handleError(error, context = {}) {
        // Log error
        this.logError(error, context);
        
        // Determine error type and severity
        const errorType = this.determineErrorType(error);
        const severity = this.determineSeverity(errorType);
        
        // Get user-friendly message
        const userMessage = this.getUserMessage(errorType, error);
        
        // Show appropriate alert to user
        this.showUserAlert(userMessage, severity);
        
        // Send telemetry if enabled
        this.sendTelemetry(error, context);
        
        // Return for chaining
        return { errorType, severity, userMessage };
    }
    
    /**
     * Determine error type from error object
     */
    determineErrorType(error) {
        if (error.type) return error.type;
        
        const message = (error.message || '').toLowerCase();
        const code = error.code;
        
        // API related errors
        if (message.includes('api') || message.includes('deepseek')) {
            if (message.includes('key')) return 'API_KEY_MISSING';
            if (message.includes('rate') || code === 429) return 'API_RATE_LIMIT';
            if (message.includes('connection') || message.includes('network')) return 'API_CONNECTION_FAILED';
            return 'API_INVALID_RESPONSE';
        }
        
        // Portfolio errors
        if (message.includes('portfolio')) {
            if (message.includes('empty') || message.includes('no assets')) return 'PORTFOLIO_EMPTY';
            return 'PORTFOLIO_ERROR';
        }
        
        // Data errors
        if (message.includes('load') || message.includes('fetch')) return 'DATA_LOAD_ERROR';
        if (message.includes('save') || message.includes('store')) return 'DATA_SAVE_ERROR';
        
        // Network errors
        if (message.includes('network') || message.includes('fetch')) return 'NETWORK_ERROR';
        
        // Validation errors
        if (message.includes('invalid') || message.includes('validation')) return 'VALIDATION_ERROR';
        
        // Model errors
        if (message.includes('backtest')) return 'BACKTEST_ERROR';
        if (message.includes('quant')) return 'QUANT_MODEL_ERROR';
        if (message.includes('market')) return 'MARKET_DATA_ERROR';
        if (message.includes('analysis')) return 'ANALYSIS_ERROR';
        
        return 'GENERAL_ERROR';
    }
    
    /**
     * Determine severity level
     */
    determineSeverity(errorType) {
        const criticalErrors = ['API_KEY_MISSING', 'PERMISSION_DENIED', 'SESSION_EXPIRED'];
        const warningErrors = ['API_RATE_LIMIT', 'PORTFOLIO_EMPTY', 'VALIDATION_ERROR', 'FEATURE_UNAVAILABLE'];
        const infoErrors = ['API_INVALID_RESPONSE', 'MARKET_DATA_ERROR', 'ANALYSIS_ERROR'];
        
        if (criticalErrors.includes(errorType)) return 'error';
        if (warningErrors.includes(errorType)) return 'warning';
        if (infoErrors.includes(errorType)) return 'info';
        
        return 'error';
    }
    
    /**
     * Get user-friendly message
     */
    getUserMessage(errorType, error) {
        let message = this.errorMessages[errorType] || 'An unexpected error occurred. Please try again.';
        
        // Add context-specific details
        if (error.details) {
            message += ` Details: ${error.details}`;
        }
        
        // Add recovery suggestions
        const suggestion = this.getRecoverySuggestion(errorType);
        if (suggestion) {
            message += ` ${suggestion}`;
        }
        
        return message;
    }
    
    /**
     * Get recovery suggestion
     */
    getRecoverySuggestion(errorType) {
        const suggestions = {
            'API_KEY_MISSING': 'Go to Settings → API Configuration to add your key.',
            'API_RATE_LIMIT': 'Wait 60 seconds before trying again.',
            'PORTFOLIO_EMPTY': 'Click "Add Asset" to start building your portfolio.',
            'NETWORK_ERROR': 'Check your internet connection and refresh the page.',
            'SESSION_EXPIRED': 'Click here to refresh: window.location.reload()',
            'DATA_LOAD_ERROR': 'Try refreshing the page or clearing browser cache.',
            'BACKTEST_ERROR': 'Verify date range and initial capital are valid.',
            'VALIDATION_ERROR': 'Ensure all required fields are filled correctly.'
        };
        
        return suggestions[errorType] || '';
    }
    
    /**
     * Show alert to user with queue management
     */
    showUserAlert(message, severity = 'info') {
        // Add to queue
        this.alertQueue.push({ message, severity, timestamp: Date.now() });
        
        // Process queue if not already processing
        if (!this.isProcessingAlerts) {
            this.processAlertQueue();
        }
    }
    
    /**
     * Process alert queue to prevent overwhelming user
     */
    async processAlertQueue() {
        this.isProcessingAlerts = true;
        
        while (this.alertQueue.length > 0) {
            const alert = this.alertQueue.shift();
            
            // Skip duplicate alerts within 2 seconds
            const recentAlerts = this.alertQueue.filter(
                a => a.message === alert.message && 
                     Math.abs(a.timestamp - alert.timestamp) < 2000
            );
            
            if (recentAlerts.length === 0) {
                this.displayAlert(alert.message, alert.severity);
                await this.delay(500); // Delay between alerts
            }
        }
        
        this.isProcessingAlerts = false;
    }
    
    /**
     * Display alert with enhanced styling
     */
    displayAlert(message, type = 'info') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `enhanced-alert alert-${type} fade-in`;
        
        const colors = {
            success: 'bg-green-100 border-green-400 text-green-700',
            error: 'bg-red-100 border-red-400 text-red-700',
            warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            info: 'bg-blue-100 border-blue-400 text-blue-700'
        };
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        alertDiv.innerHTML = `
            <div class="fixed top-20 right-4 z-50 max-w-md p-4 border-l-4 ${colors[type]} rounded shadow-lg">
                <div class="flex items-start">
                    <i class="fas ${icons[type]} text-xl mr-3 mt-0.5"></i>
                    <div class="flex-1">
                        <p class="font-medium">${this.escapeHtml(message)}</p>
                    </div>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            class="ml-3 text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Auto-remove after duration based on severity
        const duration = type === 'error' ? 8000 : type === 'warning' ? 6000 : 4000;
        setTimeout(() => {
            alertDiv.classList.add('fade-out');
            setTimeout(() => alertDiv.remove(), 300);
        }, duration);
    }
    
    /**
     * Log error for debugging
     */
    logError(error, context) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            error: {
                message: error.message,
                type: error.type,
                stack: error.stack,
                code: error.code
            },
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Add to log
        this.errorLog.push(errorEntry);
        
        // Maintain log size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
        
        // Console output for debugging
        console.group(`🔴 Error: ${error.type || 'UNKNOWN'}`);
        console.error('Message:', error.message);
        console.error('Context:', context);
        if (error.stack) console.error('Stack:', error.stack);
        console.groupEnd();
        
        // Save to localStorage for debugging
        try {
            localStorage.setItem('errorLog', JSON.stringify(this.errorLog.slice(-10)));
        } catch (e) {
            // Ignore localStorage errors
        }
    }
    
    /**
     * Send telemetry (placeholder for future implementation)
     */
    sendTelemetry(error, context) {
        // Could send to analytics service in production
        // For now, just log locally
        if (window.DEBUG_MODE) {
            console.log('Telemetry:', { error, context });
        }
    }
    
    /**
     * Utility: Escape HTML
     */
    escapeHtml(unsafe) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return unsafe.replace(/[&<>"']/g, char => map[char]);
    }
    
    /**
     * Utility: Delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get error log for debugging
     */
    getErrorLog() {
        return this.errorLog;
    }
    
    /**
     * Clear error log
     */
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('errorLog');
    }
    
    /**
     * Export error log
     */
    exportErrorLog() {
        const dataStr = JSON.stringify(this.errorLog, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `error-log-${Date.now()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }
}

// Initialize global error handler
const errorHandler = new ErrorHandler();

// Enhanced showAlert function that uses the error handler
function showAlert(message, type = 'info', details = null) {
    if (type === 'error' || type === 'warning') {
        // Use error handler for better error messages
        errorHandler.handleError({
            message,
            type: 'USER_ALERT',
            details
        });
    } else {
        // Use simple alert for success/info
        errorHandler.displayAlert(message, type);
    }
}

// Export for use in other modules
window.ErrorHandler = ErrorHandler;
window.errorHandler = errorHandler;