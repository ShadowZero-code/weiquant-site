/**
 * Security Utilities Module
 * Provides functions for input sanitization and XSS prevention
 */

const SecurityUtils = {
    /**
     * Escape HTML special characters to prevent XSS attacks
     * @param {string} unsafe - Untrusted input string
     * @returns {string} Safe HTML-escaped string
     */
    escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') {
            return String(unsafe);
        }
        
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;',
            '`': '&#x60;',
            '=': '&#x3D;'
        };
        
        return unsafe.replace(/[&<>"'`=\/]/g, char => map[char]);
    },
    
    /**
     * Sanitize input for safe display in HTML context
     * @param {string} input - User input
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized string
     */
    sanitizeInput(input, options = {}) {
        if (!input) return '';
        
        // Convert to string
        let sanitized = String(input);
        
        // Remove null bytes
        sanitized = sanitized.replace(/\0/g, '');
        
        // Trim whitespace
        if (options.trim !== false) {
            sanitized = sanitized.trim();
        }
        
        // Limit length
        if (options.maxLength && sanitized.length > options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }
        
        // Remove or escape HTML tags
        if (options.stripHtml) {
            sanitized = sanitized.replace(/<[^>]*>/g, '');
        } else {
            sanitized = this.escapeHtml(sanitized);
        }
        
        // Remove script tags specifically (extra protection)
        sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        
        // Remove event handlers
        sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');
        
        return sanitized;
    },
    
    /**
     * Validate and sanitize numeric input
     * @param {any} input - Input value
     * @param {Object} options - Validation options
     * @returns {number|null} Validated number or null if invalid
     */
    sanitizeNumber(input, options = {}) {
        const num = parseFloat(input);
        
        if (isNaN(num)) {
            return options.defaultValue !== undefined ? options.defaultValue : null;
        }
        
        // Check min/max bounds
        if (options.min !== undefined && num < options.min) {
            return options.allowClamp ? options.min : null;
        }
        
        if (options.max !== undefined && num > options.max) {
            return options.allowClamp ? options.max : null;
        }
        
        // Check if integer is required
        if (options.integer && !Number.isInteger(num)) {
            return options.allowRound ? Math.round(num) : null;
        }
        
        // Check for positive only
        if (options.positive && num <= 0) {
            return null;
        }
        
        return num;
    },
    
    /**
     * Validate email address
     * @param {string} email - Email address to validate
     * @returns {boolean} True if valid email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    /**
     * Validate date string
     * @param {string} dateString - Date string to validate
     * @returns {boolean} True if valid date
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    },
    
    /**
     * Create safe DOM element with sanitized content
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string} content - Element content
     * @returns {HTMLElement} Safe DOM element
     */
    createSafeElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        // Set attributes safely
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'innerHTML' || key === 'outerHTML') {
                continue; // Skip dangerous properties
            }
            
            if (key === 'class' || key === 'className') {
                element.className = this.escapeHtml(value);
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, this.escapeHtml(value));
            } else if (key === 'href' || key === 'src') {
                // Validate URLs
                if (this.isSafeUrl(value)) {
                    element.setAttribute(key, value);
                }
            } else {
                element.setAttribute(key, this.escapeHtml(value));
            }
        }
        
        // Set content safely
        if (content) {
            element.textContent = content; // Use textContent instead of innerHTML
        }
        
        return element;
    },
    
    /**
     * Check if URL is safe (no javascript: or data: protocols)
     * @param {string} url - URL to check
     * @returns {boolean} True if URL is safe
     */
    isSafeUrl(url) {
        if (!url) return false;
        
        const trimmedUrl = url.trim().toLowerCase();
        
        // Block dangerous protocols
        const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
        
        for (const protocol of dangerousProtocols) {
            if (trimmedUrl.startsWith(protocol)) {
                return false;
            }
        }
        
        return true;
    },
    
    /**
     * Sanitize object for safe JSON storage
     * @param {Object} obj - Object to sanitize
     * @returns {Object} Sanitized object
     */
    sanitizeObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        
        const sanitized = Array.isArray(obj) ? [] : {};
        
        for (const [key, value] of Object.entries(obj)) {
            // Skip prototype pollution attempts
            if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
                continue;
            }
            
            if (typeof value === 'string') {
                sanitized[key] = this.sanitizeInput(value, { stripHtml: true });
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        
        return sanitized;
    },
    
    /**
     * Generate secure random ID
     * @param {number} length - Length of ID
     * @returns {string} Random ID
     */
    generateSecureId(length = 16) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const array = new Uint8Array(length);
        
        if (window.crypto && window.crypto.getRandomValues) {
            window.crypto.getRandomValues(array);
        } else {
            // Fallback for older browsers
            for (let i = 0; i < length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        
        return Array.from(array, byte => chars[byte % chars.length]).join('');
    }
};

// Export for use in other modules
window.SecurityUtils = SecurityUtils;