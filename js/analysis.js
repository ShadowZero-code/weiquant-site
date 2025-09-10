// Analysis Module for AI Financial Analyst

// Perform Analysis
async function performAnalysis() {
    const newsInput = document.getElementById('newsInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const analysisResults = document.getElementById('analysisResults');
    
    if (!newsInput.value.trim()) {
        showAlert('Please enter news content for analysis', 'warning');
        return;
    }
    
    // Disable button and show loading
    analyzeBtn.disabled = true;
    loadingIndicator.classList.remove('hidden');
    analysisResults.classList.add('hidden');
    
    try {
        let analysis;
        
        // Check if DeepSeek API is configured and enabled
        const deepseekSettings = window.apiConfig ? window.apiConfig.getDeepSeekSettings() : null;
        
        if (deepseekSettings && deepseekSettings.enabled && deepseekSettings.apiKey) {
            // Use real DeepSeek API
            try {
                showAlert('Analyzing with DeepSeek API...', 'info');
                const client = new window.DeepSeekClient(deepseekSettings);
                const apiResult = await client.analyzeFinancialNews(newsInput.value);
                
                // Convert API result to our format, handling both old and new formats
                analysis = {
                    sentiment: normalizeSentiment(apiResult.sentiment),
                    recommendations: normalizeRecommendations(apiResult.recommendations),
                    allocation: apiResult.allocation || { stocks: 40, bonds: 30, commodities: 20, cash: 10 },
                    riskMetrics: {
                        overall: apiResult.riskScore || 50,
                        volatility: 'medium',
                        recommendation: apiResult.summary || 'AI-based investment recommendations'
                    },
                    timestamp: new Date().toISOString(),
                    source: 'DeepSeek API'
                };
                
                showAlert('DeepSeek API analysis complete!', 'success');
            } catch (apiError) {
                console.error('DeepSeek API error:', apiError);
                showAlert(`API error, switching to mock mode: ${apiError.message}`, 'warning');
                
                // Fallback to mock analysis
                await simulateAnalysisDelay();
                analysis = await mockAIAnalysis(newsInput.value);
                analysis.source = 'Mock Analysis';
            }
        } else {
            // Use mock analysis
            await simulateAnalysisDelay();
            analysis = await mockAIAnalysis(newsInput.value);
            analysis.source = 'Mock Analysis';
        }
        
        // Display results
        displayAnalysisResults(analysis);
        
        // Save to history
        saveAnalysisToHistory(analysis, newsInput.value);
        
        // Show completion message
        const sourceText = analysis.source === 'DeepSeek API' ? ' (AI Analysis)' : ' (Mock Analysis)';
        showAlert(`Analysis complete${sourceText}! Please check results below`, 'success');
        
    } catch (error) {
        console.error('Analysis error:', error);
        showAlert('Analysis failed, please try again', 'error');
    } finally {
        analyzeBtn.disabled = false;
        loadingIndicator.classList.add('hidden');
    }
}

// Simulate Analysis Delay
function simulateAnalysisDelay() {
    return new Promise(resolve => setTimeout(resolve, 2000));
}

// Mock AI Analysis
async function mockAIAnalysis(newsText) {
    // Extract keywords for sentiment analysis
    const keywords = extractKeywords(newsText);
    
    // Analyze sentiment
    const sentiment = analyzeSentiment(keywords, newsText);
    
    // Generate recommendations
    const recommendations = generateRecommendations(sentiment, keywords);
    
    // Calculate asset allocation
    const allocation = calculateAssetAllocation(sentiment);
    
    // Calculate risk metrics
    const riskMetrics = calculateRiskMetrics(sentiment, keywords);
    
    return {
        sentiment: sentiment,
        recommendations: recommendations,
        allocation: allocation,
        riskMetrics: riskMetrics,
        timestamp: new Date().toISOString()
    };
}

// Extract Keywords
function extractKeywords(text) {
    const positiveKeywords = ['rise', 'growth', 'breakthrough', 'high', 'positive', 'increase', 'improve', 'strong', 'exceed', 'profit', 'surge', 'rally', 'gain', 'bull', 'up'];
    const negativeKeywords = ['fall', 'decline', 'loss', 'risk', 'concern', 'decrease', 'deteriorate', 'weak', 'below', 'pressure', 'crash', 'crisis', 'bear', 'down', 'plunge'];
    const neutralKeywords = ['stable', 'flat', 'maintain', 'adjust', 'fluctuate', 'volatile', 'steady', 'sideways'];
    
    const found = {
        positive: [],
        negative: [],
        neutral: []
    };
    
    positiveKeywords.forEach(keyword => {
        if (text.includes(keyword)) found.positive.push(keyword);
    });
    
    negativeKeywords.forEach(keyword => {
        if (text.includes(keyword)) found.negative.push(keyword);
    });
    
    neutralKeywords.forEach(keyword => {
        if (text.includes(keyword)) found.neutral.push(keyword);
    });
    
    return found;
}

// Normalize recommendations to handle various formats
function normalizeRecommendations(recommendations) {
    // If no recommendations, return empty array
    if (!recommendations || !Array.isArray(recommendations)) {
        return [];
    }
    
    // Process each recommendation
    return recommendations.map((rec, index) => {
        // If it's already a properly formatted object
        if (typeof rec === 'object' && rec.type && rec.title && rec.description) {
            return {
                type: rec.type || 'hold',
                title: rec.title || `Recommendation ${index + 1}`,
                description: rec.description || 'No description available',
                confidence: rec.confidence || 'medium'
            };
        }
        
        // If it's a string, convert to object format
        if (typeof rec === 'string') {
            const lowerRec = rec.toLowerCase();
            let type = 'hold';
            
            // Detect type from content
            if (lowerRec.includes('buy') || lowerRec.includes('increase') || lowerRec.includes('accumulate')) {
                type = 'buy';
            } else if (lowerRec.includes('sell') || lowerRec.includes('reduce') || lowerRec.includes('exit')) {
                type = 'sell';
            } else if (lowerRec.includes('adjust') || lowerRec.includes('rebalance')) {
                type = 'adjust';
            }
            
            return {
                type: type,
                title: rec.substring(0, 50).replace(/[.,;:]$/, ''),
                description: rec,
                confidence: 'medium'
            };
        }
        
        // If it's an object but missing fields
        if (typeof rec === 'object') {
            return {
                type: rec.type || rec.action || 'hold',
                title: rec.title || rec.name || rec.asset || `Recommendation ${index + 1}`,
                description: rec.description || rec.details || rec.text || JSON.stringify(rec),
                confidence: rec.confidence || rec.level || 'medium'
            };
        }
        
        // Fallback for unknown format
        return {
            type: 'hold',
            title: `Recommendation ${index + 1}`,
            description: String(rec),
            confidence: 'low'
        };
    }).filter(rec => rec.description && rec.description.length > 0); // Filter out empty recommendations
}

// Normalize sentiment to handle both old and new formats
function normalizeSentiment(sentimentData) {
    // If sentiment data is missing, return default
    if (!sentimentData) {
        return {
            bullish: { value: 33, explanation: 'No sentiment data available' },
            neutral: { value: 34, explanation: 'No sentiment data available' },
            bearish: { value: 33, explanation: 'No sentiment data available' }
        };
    }
    
    // If it's already in the new format (with value and explanation)
    if (sentimentData.bullish && typeof sentimentData.bullish === 'object' && 'value' in sentimentData.bullish) {
        return sentimentData;
    }
    
    // If it's in the old format (just numbers)
    if (typeof sentimentData.bullish === 'number') {
        return {
            bullish: { value: sentimentData.bullish, explanation: 'Analysis based on market indicators' },
            neutral: { value: sentimentData.neutral, explanation: 'Analysis based on market indicators' },
            bearish: { value: sentimentData.bearish, explanation: 'Analysis based on market indicators' }
        };
    }
    
    // Default fallback
    return {
        bullish: { value: 33, explanation: 'Unable to determine sentiment' },
        neutral: { value: 34, explanation: 'Unable to determine sentiment' },
        bearish: { value: 33, explanation: 'Unable to determine sentiment' }
    };
}

// Analyze Sentiment
function analyzeSentiment(keywords, text) {
    const scores = {
        bullish: 0,
        neutral: 0,
        bearish: 0
    };
    
    const explanations = {
        bullish: [],
        neutral: [],
        bearish: []
    };
    
    // Calculate based on keywords
    scores.bullish = keywords.positive.length * 10;
    scores.bearish = keywords.negative.length * 10;
    scores.neutral = keywords.neutral.length * 5;
    
    // Build explanations based on found keywords
    if (keywords.positive.length > 0) {
        explanations.bullish.push(`Positive indicators found: ${keywords.positive.slice(0, 3).join(', ')}`);
    }
    if (keywords.negative.length > 0) {
        explanations.bearish.push(`Negative factors detected: ${keywords.negative.slice(0, 3).join(', ')}`);
    }
    if (keywords.neutral.length > 0) {
        explanations.neutral.push(`Neutral signals: ${keywords.neutral.slice(0, 3).join(', ')}`);
    }
    
    // Additional context analysis with explanations
    if (text.includes('加息') || text.includes('rate hike')) {
        scores.bearish += 15;
        explanations.bearish.push('Interest rate hikes may pressure markets');
    }
    if (text.includes('降息') || text.includes('rate cut')) {
        scores.bullish += 15;
        explanations.bullish.push('Rate cuts typically support market growth');
    }
    if (text.includes('经济增长') || text.includes('economic growth')) {
        scores.bullish += 10;
        explanations.bullish.push('Economic growth signals positive outlook');
    }
    if (text.includes('经济衰退') || text.includes('recession')) {
        scores.bearish += 20;
        explanations.bearish.push('Recession concerns weigh on sentiment');
    }
    if (text.includes('通胀') || text.includes('inflation')) {
        scores.bearish += 10;
        explanations.bearish.push('Inflation pressures create uncertainty');
    }
    if (text.includes('创新') || text.includes('innovation')) {
        scores.bullish += 8;
        explanations.bullish.push('Innovation drives future growth potential');
    }
    
    // Normalize scores
    const total = scores.bullish + scores.neutral + scores.bearish;
    if (total === 0) {
        scores.neutral = 100;
        explanations.neutral.push('No clear directional signals detected');
    } else {
        scores.bullish = Math.round((scores.bullish / total) * 100);
        scores.bearish = Math.round((scores.bearish / total) * 100);
        scores.neutral = 100 - scores.bullish - scores.bearish;
    }
    
    // Add default explanations if none were generated
    if (explanations.bullish.length === 0 && scores.bullish > 0) {
        explanations.bullish.push('Overall positive market conditions');
    }
    if (explanations.bearish.length === 0 && scores.bearish > 0) {
        explanations.bearish.push('Market risks and uncertainties present');
    }
    if (explanations.neutral.length === 0 && scores.neutral > 0) {
        explanations.neutral.push('Mixed signals suggest wait-and-see approach');
    }
    
    // Return in the new format with explanations
    return {
        bullish: { 
            value: scores.bullish, 
            explanation: explanations.bullish.join('. ') || 'Limited bullish indicators'
        },
        neutral: { 
            value: scores.neutral, 
            explanation: explanations.neutral.join('. ') || 'Balanced market conditions'
        },
        bearish: { 
            value: scores.bearish, 
            explanation: explanations.bearish.join('. ') || 'Limited bearish indicators'
        }
    };
}

// Generate Recommendations
function generateRecommendations(sentiment, keywords) {
    const recommendations = [];
    
    // Get sentiment values (handle both old and new formats)
    const sentimentValues = getSentimentValues(sentiment);
    
    if (sentimentValues.bullish > 60) {
        recommendations.push({
            type: 'buy',
            title: 'Increase Equity Allocation',
            description: 'Positive market sentiment, recommend increasing growth stock allocation',
            confidence: 'high'
        });
        recommendations.push({
            type: 'hold',
            title: 'Hold Technology Sector',
            description: 'Innovation-driven growth, maintain quality tech holdings',
            confidence: 'medium'
        });
    } else if (sentimentValues.bearish > 60) {
        recommendations.push({
            type: 'sell',
            title: 'Reduce Risk Assets',
            description: 'Elevated market risk, consider reducing high-risk asset allocation',
            confidence: 'high'
        });
        recommendations.push({
            type: 'buy',
            title: 'Increase Defensive Assets',
            description: 'Consider adding bonds, gold and other defensive assets',
            confidence: 'medium'
        });
    } else {
        recommendations.push({
            type: 'hold',
            title: 'Maintain Current Allocation',
            description: 'Uncertain market direction, recommend holding current portfolio',
            confidence: 'medium'
        });
        recommendations.push({
            type: 'diversify',
            title: 'Diversify Holdings',
            description: 'Reduce risk through diversification across asset classes',
            confidence: 'high'
        });
    }
    
    // Add specific recommendations based on keywords
    if (keywords.positive.some(k => ['tech', 'innovation', 'growth', 'breakthrough', '科技', '创新'].includes(k))) {
        recommendations.push({
            type: 'buy',
            title: 'Focus on Tech Innovation',
            description: 'Technology sector shows promise, consider AI and clean energy plays',
            confidence: 'medium'
        });
    }
    
    if (keywords.negative.some(k => ['inflation', 'rate', 'crisis', '通胀', '加息'].includes(k))) {
        recommendations.push({
            type: 'adjust',
            title: 'Adjust Bond Allocation',
            description: 'In rising rate environment, shorten duration and consider floating rate bonds',
            confidence: 'high'
        });
    }
    
    return recommendations.slice(0, 4); // Return top 4 recommendations
}

// Calculate Asset Allocation
function calculateAssetAllocation(sentiment) {
    let allocation = {};
    
    if (sentiment.bullish > 60) {
        allocation = {
            stocks: 60,
            bonds: 20,
            commodities: 10,
            cash: 10
        };
    } else if (sentiment.bearish > 60) {
        allocation = {
            stocks: 30,
            bonds: 40,
            commodities: 15,
            cash: 15
        };
    } else {
        allocation = {
            stocks: 45,
            bonds: 30,
            commodities: 15,
            cash: 10
        };
    }
    
    return allocation;
}

// Calculate Risk Metrics (Enhanced with Professional Risk Assessment)
function calculateRiskMetrics(sentiment, keywords) {
    let riskLevel = 50; // Base risk
    let volatility = 'medium';
    
    // Try to use professional risk assessment if available
    if (typeof ProfessionalRiskAssessment !== 'undefined') {
        try {
            const riskAssessment = new ProfessionalRiskAssessment();
            
            // Create mock market data for risk calculation
            const mockMarketData = {
                volatility: sentiment.bearish > 60 ? 0.35 : 0.20,
                volume: 1000000,
                priceChanges: sentiment.bearish > sentiment.bullish ? -0.02 : 0.02
            };
            
            // Calculate professional risk score
            const professionalRisk = riskAssessment.calculateRiskScore(
                mockMarketData,
                portfolio || [],
                { sentiment: sentiment }
            );
            
            if (professionalRisk && professionalRisk.totalRisk) {
                riskLevel = professionalRisk.totalRisk;
                
                // Determine volatility based on risk components
                if (professionalRisk.components && professionalRisk.components.market > 70) {
                    volatility = 'high';
                } else if (professionalRisk.components && professionalRisk.components.market < 30) {
                    volatility = 'low';
                }
            }
        } catch (error) {
            console.log('Using simplified risk calculation');
            // Fall back to simple calculation
        }
    } else {
        // Simple risk calculation as fallback
        // Adjust based on sentiment
        if (sentiment.bearish > 70) {
            riskLevel += 30;
            volatility = 'high';
        } else if (sentiment.bearish > 50) {
            riskLevel += 15;
        } else if (sentiment.bullish > 70) {
            riskLevel -= 20;
            volatility = 'low';
        }
    }
    
    // Adjust based on specific keywords (now in English)
    if (keywords.negative.some(k => k.includes('crisis') || k.includes('crash') || k.includes('collapse'))) {
        riskLevel += 20;
        volatility = 'very high';
    }
    
    // Ensure risk level is between 0 and 100
    riskLevel = Math.max(0, Math.min(100, riskLevel));
    
    return {
        overall: riskLevel,
        volatility: volatility,
        recommendation: getRiskRecommendation(riskLevel)
    };
}

// Get Risk Recommendation
function getRiskRecommendation(riskLevel) {
    if (riskLevel < 30) {
        return 'Low risk - Suitable for aggressive positioning';
    } else if (riskLevel < 50) {
        return 'Moderate risk - Balanced allocation recommended';
    } else if (riskLevel < 70) {
        return 'Elevated risk - Cautious approach advised';
    } else {
        return 'High risk - Defensive positioning recommended';
    }
}

// Display Analysis Results
function displayAnalysisResults(analysis) {
    const analysisResults = document.getElementById('analysisResults');
    
    // Update or remove source indicator based on analysis source
    const existingIndicator = document.getElementById('sourceIndicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    if (analysis.source === 'DeepSeek API') {
        const sourceIndicator = document.createElement('div');
        sourceIndicator.id = 'sourceIndicator';
        sourceIndicator.className = 'mb-4 p-2 bg-purple-50 border border-purple-200 rounded-lg text-center';
        sourceIndicator.innerHTML = `
            <i class="fas fa-brain text-purple-600 mr-2"></i>
            <span class="text-purple-700 font-medium">Powered by DeepSeek AI</span>
        `;
        analysisResults.insertBefore(sourceIndicator, analysisResults.firstChild);
    } else if (analysis.source === 'Mock Analysis') {
        const sourceIndicator = document.createElement('div');
        sourceIndicator.id = 'sourceIndicator';
        sourceIndicator.className = 'mb-4 p-2 bg-gray-50 border border-gray-200 rounded-lg text-center';
        sourceIndicator.innerHTML = `
            <i class="fas fa-robot text-gray-600 mr-2"></i>
            <span class="text-gray-700 font-medium">Using Local Analysis (Demo Mode)</span>
        `;
        analysisResults.insertBefore(sourceIndicator, analysisResults.firstChild);
    }
    
    // Update sentiment scores - handle both old and new formats
    const sentimentValues = getSentimentValues(analysis.sentiment);
    document.getElementById('bullishScore').textContent = sentimentValues.bullish + '%';
    document.getElementById('neutralScore').textContent = sentimentValues.neutral + '%';
    document.getElementById('bearishScore').textContent = sentimentValues.bearish + '%';
    
    // Add sentiment explanations if available
    addSentimentExplanations(analysis.sentiment);
    
    // Display recommendations
    const recommendationsDiv = document.getElementById('recommendations');
    
    if (!analysis.recommendations || analysis.recommendations.length === 0) {
        // Show fallback message when no recommendations available
        recommendationsDiv.innerHTML = `
            <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div class="flex items-center space-x-3">
                    <i class="fas fa-info-circle text-gray-400 text-lg"></i>
                    <div>
                        <p class="text-gray-600 font-medium">No specific recommendations available</p>
                        <p class="text-sm text-gray-500 mt-1">The analysis could not generate specific investment recommendations for this content. Please try with more detailed financial news.</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Display the recommendations
        recommendationsDiv.innerHTML = analysis.recommendations.map(rec => `
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                    ${getRecommendationIcon(rec.type || 'hold')}
                </div>
                <div class="flex-1">
                    <h5 class="font-semibold text-gray-800">${rec.title || 'Recommendation'}</h5>
                    <p class="text-sm text-gray-600 mt-1">${rec.description || 'No description available'}</p>
                    <span class="inline-block mt-2 text-xs px-2 py-1 rounded ${getConfidenceBadgeClass(rec.confidence || 'medium')}">
                        Confidence: ${getConfidenceText(rec.confidence || 'medium')}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    // Create allocation chart
    createAllocationChart(analysis.allocation);
    
    // Create risk chart
    createRiskChart(analysis.riskMetrics);
    
    // Show results
    analysisResults.classList.remove('hidden');
    analysisResults.classList.add('fade-in');
    
    // Store current analysis
    currentAnalysis = analysis;
}

// Get Recommendation Icon
function getRecommendationIcon(type) {
    const icons = {
        buy: '<i class="fas fa-arrow-up text-green-600 text-xl"></i>',
        sell: '<i class="fas fa-arrow-down text-red-600 text-xl"></i>',
        hold: '<i class="fas fa-pause text-yellow-600 text-xl"></i>',
        diversify: '<i class="fas fa-chart-pie text-blue-600 text-xl"></i>',
        adjust: '<i class="fas fa-sync text-purple-600 text-xl"></i>'
    };
    return icons[type] || '<i class="fas fa-info-circle text-gray-600 text-xl"></i>';
}

// Get Confidence Badge Class
function getConfidenceBadgeClass(confidence) {
    const classes = {
        high: 'bg-green-100 text-green-800',
        medium: 'bg-yellow-100 text-yellow-800',
        low: 'bg-red-100 text-red-800'
    };
    return classes[confidence] || 'bg-gray-100 text-gray-800';
}

// Get Confidence Text
function getConfidenceText(confidence) {
    const texts = {
        high: 'High',
        medium: 'Medium',
        low: 'Low'
    };
    return texts[confidence] || 'Unknown';
}

// Create Allocation Chart
function createAllocationChart(allocation) {
    const ctx = document.getElementById('allocationChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.allocationChartInstance) {
        window.allocationChartInstance.destroy();
    }
    
    window.allocationChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Equities', 'Bonds', 'Commodities', 'Cash'],
            datasets: [{
                data: [allocation.stocks, allocation.bonds, allocation.commodities, allocation.cash],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(156, 163, 175, 0.8)'
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(34, 197, 94, 1)',
                    'rgba(251, 146, 60, 1)',
                    'rgba(156, 163, 175, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500  // Reduce animation duration
            },
            plugins: {
                legend: {
                    position: 'bottom',
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

// Get sentiment values from either old or new format
function getSentimentValues(sentiment) {
    if (!sentiment) {
        return { bullish: 33, neutral: 34, bearish: 33 };
    }
    
    // Handle new format (with value and explanation)
    if (sentiment.bullish && typeof sentiment.bullish === 'object' && 'value' in sentiment.bullish) {
        return {
            bullish: sentiment.bullish.value,
            neutral: sentiment.neutral.value,
            bearish: sentiment.bearish.value
        };
    }
    
    // Handle old format (just numbers)
    if (typeof sentiment.bullish === 'number') {
        return sentiment;
    }
    
    return { bullish: 33, neutral: 34, bearish: 33 };
}

// Add sentiment explanations to the UI
function addSentimentExplanations(sentiment) {
    // Only add explanations if we have the new format with explanations
    if (!sentiment || !sentiment.bullish || typeof sentiment.bullish !== 'object' || !sentiment.bullish.explanation) {
        return;
    }
    
    // Add expandable explanations for each sentiment
    const sentimentContainers = {
        bullish: document.getElementById('bullishScore').parentElement,
        neutral: document.getElementById('neutralScore').parentElement,
        bearish: document.getElementById('bearishScore').parentElement
    };
    
    Object.keys(sentimentContainers).forEach(type => {
        const container = sentimentContainers[type];
        const explanation = sentiment[type].explanation;
        
        // Remove any existing explanation
        const existingExplanation = container.querySelector('.sentiment-explanation');
        if (existingExplanation) {
            existingExplanation.remove();
        }
        
        // Add clickable indicator and explanation
        const explanationDiv = document.createElement('div');
        explanationDiv.className = 'sentiment-explanation mt-2';
        explanationDiv.innerHTML = `
            <button onclick="toggleSentimentExplanation(this)" class="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                <i class="fas fa-info-circle mr-1"></i>
                <span>Why ${sentiment[type].value}%?</span>
                <i class="fas fa-chevron-down ml-1 transition-transform" id="${type}-chevron"></i>
            </button>
            <div class="hidden mt-2 p-2 bg-gray-50 rounded text-xs text-gray-700" id="${type}-explanation">
                ${explanation}
            </div>
        `;
        container.appendChild(explanationDiv);
    });
}

// Toggle sentiment explanation visibility
function toggleSentimentExplanation(button) {
    const explanationDiv = button.nextElementSibling;
    const chevron = button.querySelector('.fa-chevron-down, .fa-chevron-up');
    
    if (explanationDiv.classList.contains('hidden')) {
        explanationDiv.classList.remove('hidden');
        chevron.classList.remove('fa-chevron-down');
        chevron.classList.add('fa-chevron-up');
    } else {
        explanationDiv.classList.add('hidden');
        chevron.classList.remove('fa-chevron-up');
        chevron.classList.add('fa-chevron-down');
    }
}

// Calculate component risks based on overall metrics
function calculateLiquidityRisk(riskMetrics) {
    // Liquidity risk based on market conditions and volatility
    let liquidityRisk = 40; // Base level
    
    // High volatility reduces liquidity
    if (riskMetrics.volatility === 'very high') {
        liquidityRisk += 35;
    } else if (riskMetrics.volatility === 'high') {
        liquidityRisk += 20;
    } else if (riskMetrics.volatility === 'low') {
        liquidityRisk -= 10;
    }
    
    // Overall risk affects liquidity
    if (riskMetrics.overall > 70) {
        liquidityRisk += 15;
    } else if (riskMetrics.overall < 30) {
        liquidityRisk -= 15;
    }
    
    return Math.min(100, Math.max(0, liquidityRisk));
}

function calculateCreditRisk(riskMetrics) {
    // Credit risk based on market conditions
    let creditRisk = 35; // Base level
    
    // High overall risk increases credit concerns
    if (riskMetrics.overall > 80) {
        creditRisk += 40;
    } else if (riskMetrics.overall > 60) {
        creditRisk += 25;
    } else if (riskMetrics.overall > 40) {
        creditRisk += 10;
    } else if (riskMetrics.overall < 20) {
        creditRisk -= 15;
    }
    
    // Volatility affects credit risk
    if (riskMetrics.volatility === 'very high') {
        creditRisk += 20;
    } else if (riskMetrics.volatility === 'high') {
        creditRisk += 10;
    }
    
    return Math.min(100, Math.max(0, creditRisk));
}

function calculatePolicyRisk(riskMetrics) {
    // Policy/regulatory risk based on market conditions
    let policyRisk = 30; // Base level
    
    // Extreme market conditions may trigger regulatory responses
    if (riskMetrics.overall > 85) {
        policyRisk += 45;
    } else if (riskMetrics.overall > 70) {
        policyRisk += 30;
    } else if (riskMetrics.overall > 50) {
        policyRisk += 15;
    } else if (riskMetrics.overall < 25) {
        policyRisk -= 10;
    }
    
    // Very high volatility may prompt policy intervention
    if (riskMetrics.volatility === 'very high') {
        policyRisk += 25;
    } else if (riskMetrics.volatility === 'high') {
        policyRisk += 15;
    }
    
    return Math.min(100, Math.max(0, policyRisk));
}

// Create Risk Chart
function createRiskChart(riskMetrics) {
    const ctx = document.getElementById('riskChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.riskChartInstance) {
        window.riskChartInstance.destroy();
    }
    
    // Calculate actual risk components based on metrics
    const liquidityRisk = calculateLiquidityRisk(riskMetrics);
    const creditRisk = calculateCreditRisk(riskMetrics);
    const policyRisk = calculatePolicyRisk(riskMetrics);
    
    window.riskChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Overall Risk', 'Market Volatility', 'Liquidity', 'Credit Risk', 'Policy Risk'],
            datasets: [{
                label: 'Risk Score',
                data: [
                    riskMetrics.overall,
                    getVolatilityScore(riskMetrics.volatility),
                    liquidityRisk,
                    creditRisk,
                    policyRisk
                ],
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
                pointBackgroundColor: 'rgba(239, 68, 68, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(239, 68, 68, 1)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 500  // Reduce animation duration
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 20
                    }
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

// Get Volatility Score
function getVolatilityScore(volatility) {
    const scores = {
        'very high': 90,
        'high': 70,
        'medium': 50,
        'low': 30,
        'very low': 10
    };
    return scores[volatility] || 50;
}

// Save Analysis to History
function saveAnalysisToHistory(analysis, newsText) {
    const historyItem = {
        id: generateId(),
        timestamp: new Date().toISOString(),
        newsSnippet: newsText.substring(0, 100) + '...',
        sentiment: getSentimentType(analysis.sentiment),
        riskLevel: getRiskLevel(analysis.riskMetrics.overall),
        analysis: analysis
    };
    
    analysisHistory.push(historyItem);
    
    // Keep only last 50 items
    if (analysisHistory.length > 50) {
        analysisHistory = analysisHistory.slice(-50);
    }
    
    saveToLocalStorage();
    renderHistory();
}

// Get Sentiment Type
function getSentimentType(sentiment) {
    if (sentiment.bullish > sentiment.bearish && sentiment.bullish > sentiment.neutral) {
        return 'bullish';
    } else if (sentiment.bearish > sentiment.bullish && sentiment.bearish > sentiment.neutral) {
        return 'bearish';
    }
    return 'neutral';
}

// Get Risk Level
function getRiskLevel(riskScore) {
    if (riskScore < 30) return '低';
    if (riskScore < 50) return '中';
    if (riskScore < 70) return '高';
    return '极高';
}