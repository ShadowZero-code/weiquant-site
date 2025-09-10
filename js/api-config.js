// API Configuration Module for DeepSeek Integration

// API Settings Management
class ApiConfigManager {
    constructor() {
        this.settings = this.loadSettings();
        this.apiCallCount = parseInt(localStorage.getItem('apiCallCount') || '0');
        this.lastApiCall = localStorage.getItem('lastApiCall') || null;
    }

    // Load settings from localStorage
    loadSettings() {
        try {
            const saved = localStorage.getItem('apiSettings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading API settings:', error);
            return this.getDefaultSettings();
        }
    }

    // Get default settings
    getDefaultSettings() {
        return {
            deepseek: {
                enabled: false,
                apiKey: '',
                endpoint: 'https://api.deepseek.com/v1/chat/completions',
                model: 'deepseek-chat',
                temperature: 0.7,
                maxTokens: 2000
            }
        };
    }

    // Save settings to localStorage
    saveSettings(settings) {
        try {
            this.settings = { ...this.settings, ...settings };
            localStorage.setItem('apiSettings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving API settings:', error);
            return false;
        }
    }

    // Get DeepSeek settings
    getDeepSeekSettings() {
        return this.settings.deepseek || this.getDefaultSettings().deepseek;
    }

    // Update API call statistics
    updateApiStats() {
        this.apiCallCount++;
        this.lastApiCall = new Date().toISOString();
        localStorage.setItem('apiCallCount', this.apiCallCount.toString());
        localStorage.setItem('lastApiCall', this.lastApiCall);
        this.updateStatusDisplay();
    }

    // Update status display
    updateStatusDisplay() {
        const countElement = document.getElementById('apiCallCount');
        const lastCallElement = document.getElementById('lastApiCall');
        
        if (countElement) {
            countElement.textContent = this.apiCallCount;
        }
        
        if (lastCallElement && this.lastApiCall) {
            const date = new Date(this.lastApiCall);
            lastCallElement.textContent = date.toLocaleString('en-US');
        }
    }

    // Clear all settings
    clearSettings() {
        this.settings = this.getDefaultSettings();
        this.apiCallCount = 0;
        this.lastApiCall = null;
        localStorage.removeItem('apiSettings');
        localStorage.removeItem('apiCallCount');
        localStorage.removeItem('lastApiCall');
        return true;
    }
}

// Initialize API Config Manager
const apiConfig = new ApiConfigManager();

// DeepSeek API Client
class DeepSeekClient {
    constructor(settings) {
        this.settings = settings;
    }

    // Call DeepSeek API
    async chat(messages, options = {}) {
        if (!this.settings.enabled || !this.settings.apiKey) {
            throw new Error('DeepSeek API not configured or not enabled');
        }

        const requestBody = {
            model: this.settings.model,
            messages: messages,
            temperature: options.temperature || this.settings.temperature,
            max_tokens: options.maxTokens || this.settings.maxTokens,
            stream: false
        };

        try {
            const response = await fetch(this.settings.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.settings.apiKey}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMessage = `API Error: ${response.status}`;
                try {
                    const error = await response.json();
                    errorMessage = error.error?.message || error.message || errorMessage;
                } catch (e) {
                    // If JSON parsing fails, use default error message
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            apiConfig.updateApiStats();
            return data;
        } catch (error) {
            // Network or other errors
            if (error.message.includes('Failed to fetch')) {
                throw new Error('Network connection failed, please check network or API endpoint settings');
            }
            console.error('DeepSeek API Error:', error);
            throw error;
        }
    }

    // Analyze financial news
    async analyzeFinancialNews(newsContent) {
        const systemPrompt = `You are a professional financial analyst specializing in market analysis and investment recommendations.
Please analyze the following news content and provide:
1. Market sentiment analysis with percentages and explanations:
   - bullish: percentage (0-100) and explanation why
   - neutral: percentage (0-100) and explanation why
   - bearish: percentage (0-100) and explanation why
   (percentages should sum to 100)
2. Investment recommendations (at least 3) as an array of objects, each with:
   - type: action type ("buy", "sell", "hold", or "adjust")
   - title: brief name of the recommendation
   - description: detailed explanation
   - confidence: confidence level ("high", "medium", or "low")
3. Recommended asset allocation (stocks, bonds, commodities, cash percentages)
4. Risk assessment (0-100 score)
5. Key points summary

Please return results in JSON format like:
{
  "sentiment": {
    "bullish": {"value": 45, "explanation": "Strong earnings reports and positive GDP growth indicate..."},
    "neutral": {"value": 30, "explanation": "Mixed signals from central banks create uncertainty..."},
    "bearish": {"value": 25, "explanation": "Rising inflation concerns and geopolitical tensions..."}
  },
  "recommendations": [
    {"type": "buy", "title": "Technology Stocks", "description": "Tech sector shows strong growth potential", "confidence": "high"},
    {"type": "hold", "title": "Government Bonds", "description": "Maintain defensive position", "confidence": "medium"},
    {"type": "sell", "title": "Energy Sector", "description": "Overvalued with declining demand", "confidence": "low"}
  ],
  "allocation": {"stocks": 40, "bonds": 30, "commodities": 20, "cash": 10},
  "riskScore": 50,
  "summary": "..."
}`;

        const userPrompt = `Please analyze the following financial news:\n\n${newsContent}`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ];

        try {
            const response = await this.chat(messages);
            const content = response.choices[0].message.content;
            
            // Try to parse JSON from response
            try {
                // Extract JSON if it's wrapped in markdown code blocks
                const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[1]);
                }
                // Try direct parsing
                return JSON.parse(content);
            } catch (parseError) {
                // If parsing fails, extract information using regex
                return this.parseTextResponse(content);
            }
        } catch (error) {
            console.error('Error analyzing news:', error);
            throw error;
        }
    }

    // Parse text response if JSON parsing fails
    parseTextResponse(text) {
        const result = {
            sentiment: {
                bullish: { value: 33, explanation: 'Unable to extract detailed explanation from response' },
                neutral: { value: 34, explanation: 'Unable to extract detailed explanation from response' },
                bearish: { value: 33, explanation: 'Unable to extract detailed explanation from response' }
            },
            recommendations: [],
            allocation: { stocks: 40, bonds: 30, commodities: 20, cash: 10 },
            riskScore: 50,
            summary: ''
        };

        // Extract sentiment - look for multiple patterns
        const sentimentPatterns = [
            /bullish.*?(\d+)/i,
            /positive.*?(\d+)/i,
            /bearish.*?(\d+)/i,
            /negative.*?(\d+)/i,
            /neutral.*?(\d+)/i
        ];
        
        sentimentPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                const value = parseInt(match[1]);
                if (pattern.source.includes('bullish') || pattern.source.includes('positive')) {
                    result.sentiment.bullish.value = value;
                } else if (pattern.source.includes('bearish') || pattern.source.includes('negative')) {
                    result.sentiment.bearish.value = value;
                } else if (pattern.source.includes('neutral')) {
                    result.sentiment.neutral.value = value;
                }
            }
        });

        // Extract recommendations - look for numbered items or bullet points
        const recPatterns = [
            /\d+\.\s*([^\n]+)/g,
            /•\s*([^\n]+)/g,
            /-\s*([^\n]+)/g,
            /recommendation.*?:(.+?)(?:\n|$)/gi
        ];
        
        for (const pattern of recPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                if (result.recommendations.length < 5) { // Limit to 5 recommendations
                    const recommendation = match[1].trim();
                    if (recommendation.length > 10 && recommendation.length < 300) {
                        // Determine type based on keywords
                        let type = 'hold';
                        const lowerRec = recommendation.toLowerCase();
                        if (lowerRec.includes('buy') || lowerRec.includes('increase') || lowerRec.includes('add')) {
                            type = 'buy';
                        } else if (lowerRec.includes('sell') || lowerRec.includes('reduce') || lowerRec.includes('exit')) {
                            type = 'sell';
                        } else if (lowerRec.includes('adjust') || lowerRec.includes('rebalance')) {
                            type = 'adjust';
                        }
                        
                        // Determine confidence based on keywords
                        let confidence = 'medium';
                        if (lowerRec.includes('strong') || lowerRec.includes('definitely') || lowerRec.includes('must')) {
                            confidence = 'high';
                        } else if (lowerRec.includes('consider') || lowerRec.includes('maybe') || lowerRec.includes('possibly')) {
                            confidence = 'low';
                        }
                        
                        result.recommendations.push({
                            type: type,
                            title: recommendation.substring(0, 50).replace(/[.,;:]$/, ''),
                            description: recommendation,
                            confidence: confidence
                        });
                    }
                }
            }
        }

        // Extract asset allocation
        const assetPatterns = [
            /stocks?.*?(\d+)%/i,
            /equit.*?(\d+)%/i,
            /bonds?.*?(\d+)%/i,
            /commodit.*?(\d+)%/i,
            /cash.*?(\d+)%/i
        ];
        
        assetPatterns.forEach(pattern => {
            const match = text.match(pattern);
            if (match) {
                const value = parseInt(match[1]);
                if (pattern.source.includes('stock') || pattern.source.includes('equit')) {
                    result.allocation.stocks = value;
                } else if (pattern.source.includes('bond')) {
                    result.allocation.bonds = value;
                } else if (pattern.source.includes('commodit')) {
                    result.allocation.commodities = value;
                } else if (pattern.source.includes('cash')) {
                    result.allocation.cash = value;
                }
            }
        });

        // Extract risk score
        const riskPatterns = [
            /risk.*?score.*?(\d+)/i,
            /risk.*?(\d+)/i,
            /score.*?(\d+)/i
        ];
        
        for (const pattern of riskPatterns) {
            const match = text.match(pattern);
            if (match) {
                result.riskScore = parseInt(match[1]);
                break;
            }
        }

        // Extract summary - get first meaningful paragraph
        const paragraphs = text.split(/\n\n+/);
        for (const para of paragraphs) {
            if (para.length > 50 && para.length < 500) {
                result.summary = para.trim();
                break;
            }
        }
        
        if (!result.summary) {
            result.summary = text.substring(0, 200).trim();
        }

        return result;
    }

    // Test API connection
    async testConnection() {
        try {
            const messages = [
                { role: 'system', content: 'You are a helpful assistant. Reply with exactly: "Connection successful"' },
                { role: 'user', content: 'Test connection' }
            ];
            
            const response = await this.chat(messages, { maxTokens: 50 });
            if (response && response.choices && response.choices[0] && response.choices[0].message) {
                return true; // If we get any valid response, connection is working
            }
            return false;
        } catch (error) {
            console.error('Test connection error:', error);
            throw error;
        }
    }
}

// UI Functions
function toggleApiKeyVisibility() {
    const input = document.getElementById('deepseekApiKey');
    const icon = document.getElementById('apiKeyToggleIcon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// Save API Settings
function saveApiSettings() {
    const apiKey = document.getElementById('deepseekApiKey').value;
    const endpoint = document.getElementById('deepseekApiEndpoint').value;
    const model = document.getElementById('deepseekModel').value;
    const enabled = document.getElementById('enableDeepseekApi').checked;
    
    if (enabled && !apiKey) {
        showAlert('Please enter API key', 'warning');
        return;
    }
    
    const settings = {
        deepseek: {
            enabled: enabled,
            apiKey: apiKey,
            endpoint: endpoint || 'https://api.deepseek.com/v1/chat/completions',
            model: model,
            temperature: 0.7,
            maxTokens: 2000
        }
    };
    
    if (apiConfig.saveSettings(settings)) {
        showAlert('API settings saved', 'success');
        updateConnectionStatus(enabled ? 'configured' : 'disabled');
    } else {
        showAlert('Failed to save settings', 'error');
    }
}

// Test API Connection
async function testApiConnection() {
    // Get current form values directly
    const apiKey = document.getElementById('deepseekApiKey').value;
    const endpoint = document.getElementById('deepseekApiEndpoint').value;
    const model = document.getElementById('deepseekModel').value;
    
    if (!apiKey) {
        showAlert('Please enter API key first', 'warning');
        return;
    }
    
    // Create settings object with current form values
    const settings = {
        enabled: true,
        apiKey: apiKey,
        endpoint: endpoint || 'https://api.deepseek.com/v1/chat/completions',
        model: model || 'deepseek-chat',
        temperature: 0.7,
        maxTokens: 2000
    };
    
    // Find the button that was clicked
    const testBtn = document.querySelector('button[onclick="testApiConnection()"]');
    if (!testBtn) return;
    
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Testing...';
    
    try {
        const client = new DeepSeekClient(settings);
        const success = await client.testConnection();
        
        if (success) {
            showAlert('API connection successful!', 'success');
            updateConnectionStatus('connected');
            // Save settings if test is successful
            document.getElementById('enableDeepseekApi').checked = true;
            apiConfig.saveSettings({ deepseek: settings });
        } else {
            showAlert('API connection failed', 'error');
            updateConnectionStatus('error');
        }
    } catch (error) {
        showAlert(`Connection failed: ${error.message}`, 'error');
        updateConnectionStatus('error');
    } finally {
        testBtn.disabled = false;
        testBtn.innerHTML = originalText;
    }
}

// Clear API Settings
function clearApiSettings() {
    if (confirm('Are you sure you want to clear all API settings?')) {
        apiConfig.clearSettings();
        document.getElementById('deepseekApiKey').value = '';
        document.getElementById('deepseekApiEndpoint').value = 'https://api.deepseek.com/v1/chat/completions';
        document.getElementById('deepseekModel').value = 'deepseek-chat';
        document.getElementById('enableDeepseekApi').checked = false;
        updateConnectionStatus('disabled');
        showAlert('API settings cleared', 'info');
    }
}

// Update Connection Status Display
function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connectionStatus');
    if (!statusElement) return;
    
    const statusConfig = {
        connected: {
            text: 'Connected',
            icon: 'fa-check-circle',
            color: 'text-green-600'
        },
        configured: {
            text: 'Configured',
            icon: 'fa-cog',
            color: 'text-blue-600'
        },
        disabled: {
            text: 'Disabled',
            icon: 'fa-times-circle',
            color: 'text-gray-500'
        },
        error: {
            text: 'Connection Error',
            icon: 'fa-exclamation-circle',
            color: 'text-red-600'
        },
        default: {
            text: 'Not Configured',
            icon: 'fa-circle',
            color: 'text-gray-400'
        }
    };
    
    const config = statusConfig[status] || statusConfig.default;
    statusElement.innerHTML = `
        <i class="fas ${config.icon} ${config.color} mr-1"></i>
        <span class="${config.color}">${config.text}</span>
    `;
}

// Load settings on page load
document.addEventListener('DOMContentLoaded', function() {
    const settings = apiConfig.getDeepSeekSettings();
    
    if (document.getElementById('deepseekApiKey')) {
        document.getElementById('deepseekApiKey').value = settings.apiKey || '';
        document.getElementById('deepseekApiEndpoint').value = settings.endpoint || 'https://api.deepseek.com/v1/chat/completions';
        document.getElementById('deepseekModel').value = settings.model || 'deepseek-chat';
        document.getElementById('enableDeepseekApi').checked = settings.enabled || false;
        
        updateConnectionStatus(settings.enabled ? 'configured' : 'disabled');
        apiConfig.updateStatusDisplay();
    }
});

// Export for use in other modules
window.DeepSeekClient = DeepSeekClient;
window.apiConfig = apiConfig;