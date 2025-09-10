/**
 * Research Framework UI Controller
 * Manages the display and interaction of research components
 */

// Initialize Research Framework
let researchFramework = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize after page loads
    setTimeout(() => {
        researchFramework = new ResearchFramework();
        initializeResearchUI();
        updateLastUpdateTime();
    }, 300);
});

// Initialize Research UI
function initializeResearchUI() {
    // Load research data
    loadResearchData();
    
    // Set up interval for updating metrics
    setInterval(updateLiveMetrics, 5000);
}

// Show Research Tab
function showResearchTab(tabName, eventOrElement) {
    try {
        // Hide all tabs
        const allTabs = document.querySelectorAll('.research-content');
        allTabs.forEach(tab => tab.classList.add('hidden'));
        
        // Remove active class from all tab buttons
        const allButtons = document.querySelectorAll('.research-tab');
        allButtons.forEach(btn => {
            btn.classList.remove('border-indigo-500', 'text-indigo-600');
            btn.classList.add('border-transparent', 'text-gray-500');
        });
        
        // Show selected tab
        const selectedTab = document.getElementById(`${tabName}-tab`);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        } else {
            console.warn(`Tab container not found: ${tabName}-tab`);
        }
        
        // Get the clicked button element
        let clickedButton = null;
        if (eventOrElement) {
            // If it's an event object, get the target
            if (eventOrElement.target) {
                clickedButton = eventOrElement.target;
            } 
            // If it's an element, use it directly
            else if (eventOrElement.nodeType) {
                clickedButton = eventOrElement;
            }
        }
        
        // If we still don't have the button, try to find it by tab name
        if (!clickedButton) {
            // Find the button that contains the tabName in its onclick attribute
            allButtons.forEach(btn => {
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(`'${tabName}'`)) {
                    clickedButton = btn;
                }
            });
        }
        
        // Add active class to selected button
        if (clickedButton) {
            clickedButton.classList.remove('border-transparent', 'text-gray-500');
            clickedButton.classList.add('border-indigo-500', 'text-indigo-600');
        }
        
        // Load tab-specific data
        loadTabData(tabName);
    } catch (error) {
        console.error('Error switching research tab:', error);
        if (window.errorHandler) {
            window.errorHandler.handleError({
                message: `Failed to switch to ${tabName} tab`,
                type: 'TAB_SWITCH_ERROR',
                details: error.message
            });
        }
    }
}

// Load Research Data
function loadResearchData() {
    if (!researchFramework) return;
    
    const report = researchFramework.generateResearchReport();
    
    // Update problem definition
    updateProblemDefinition(report.executiveSummary);
    
    // Update data pipeline
    updateDataPipeline(report.dataMethodology);
    
    // Update model metrics
    updateModelMetrics(report.results);
}

// Load Tab-Specific Data
function loadTabData(tabName) {
    // Each tab loading function handles its own errors,
    // so we don't need a try-catch here to avoid duplicate error messages
    switch(tabName) {
        case 'hypothesis':
            loadHypothesisTab();
            break;
        case 'model':
            loadModelDesignTab();
            break;
        case 'evaluation':
            loadEvaluationTab();
            break;
        case 'innovation':
            loadInnovationTab();
            break;
        case 'problem':
            // Problem tab is loaded differently
            break;
        case 'data':
            // Data tab is loaded differently
            break;
        default:
            console.warn(`Unknown tab: ${tabName}`);
    }
}

// Load Hypothesis Tab
function loadHypothesisTab() {
    try {
        if (!researchFramework) {
            console.warn('Research framework not initialized');
            return;
        }
        
        const hypothesis = researchFramework.formulateModelingHypothesis();
        
        let content = `
        <div class="space-y-6">
            <!-- Core Assumptions -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-lightbulb text-amber-500 mr-2"></i>Core Modeling Assumptions
                </h4>
                <div class="grid md:grid-cols-2 gap-4">
                    <div class="bg-amber-50 rounded-lg p-4">
                        <h5 class="font-medium text-amber-800 mb-2">Market Structure</h5>
                        <ul class="text-sm space-y-1 text-gray-600">
                            <li>• Semi-strong form efficiency with temporary inefficiencies</li>
                            <li>• Fat-tailed return distributions with regime dependence</li>
                            <li>• Time-varying factor loadings with structural breaks</li>
                        </ul>
                    </div>
                    <div class="bg-blue-50 rounded-lg p-4">
                        <h5 class="font-medium text-blue-800 mb-2">Risk Premium</h5>
                        <ul class="text-sm space-y-1 text-gray-600">
                            <li>• Compensation varies with investor sentiment</li>
                            <li>• Factor premiums exhibit momentum (3-6 months)</li>
                            <li>• Tail risk increases non-linearly with correlation</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Model Selection Rationale -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-brain text-purple-500 mr-2"></i>Model Selection Rationale
                </h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-4 py-2 text-left">Model Type</th>
                                <th class="px-4 py-2 text-left">Rationale</th>
                                <th class="px-4 py-2 text-left">Strengths</th>
                                <th class="px-4 py-2 text-left">Limitations</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr class="border-b">
                                <td class="px-4 py-2 font-medium">Ensemble Methods</td>
                                <td class="px-4 py-2">Capture non-linear interactions</td>
                                <td class="px-4 py-2 text-green-600">Robust, interpretable</td>
                                <td class="px-4 py-2 text-red-600">Computationally intensive</td>
                            </tr>
                            <tr class="border-b">
                                <td class="px-4 py-2 font-medium">Deep Learning</td>
                                <td class="px-4 py-2">Learn complex patterns from alt data</td>
                                <td class="px-4 py-2 text-green-600">High capacity</td>
                                <td class="px-4 py-2 text-red-600">Black box, overfitting risk</td>
                            </tr>
                            <tr class="border-b">
                                <td class="px-4 py-2 font-medium">Bayesian Models</td>
                                <td class="px-4 py-2">Incorporate uncertainty & priors</td>
                                <td class="px-4 py-2 text-green-600">Uncertainty quantification</td>
                                <td class="px-4 py-2 text-red-600">Prior sensitivity</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
        
        const hypothesisTab = document.getElementById('hypothesis-tab');
        if (hypothesisTab) {
            hypothesisTab.innerHTML = content;
        } else {
            console.error('Hypothesis tab container not found');
        }
    } catch (error) {
        console.error('Error loading hypothesis tab:', error);
        const hypothesisTab = document.getElementById('hypothesis-tab');
        if (hypothesisTab) {
            hypothesisTab.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Failed to load hypothesis content. Please try again.
                    </p>
                </div>
            `;
        }
        // Don't rethrow - we've handled the error here
    }
}

// Load Model Design Tab
function loadModelDesignTab() {
    try {
        if (!researchFramework) {
            console.warn('Research framework not initialized');
            return;
        }
        
        const models = researchFramework.designModels();
        
        let content = `
        <div class="space-y-6">
            <!-- Model Architecture Overview -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-project-diagram text-indigo-500 mr-2"></i>Model Architecture Pipeline
                </h4>
                <div class="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6">
                    <div class="flex items-center justify-between space-x-2 text-center">
                        <div class="flex-1">
                            <div class="bg-white rounded-lg p-3 shadow">
                                <i class="fas fa-eye text-indigo-600 text-2xl mb-2"></i>
                                <p class="text-xs font-medium">Regime Detection</p>
                                <p class="text-xs text-gray-500">HMM + GRU</p>
                            </div>
                        </div>
                        <i class="fas fa-arrow-right text-gray-400"></i>
                        <div class="flex-1">
                            <div class="bg-white rounded-lg p-3 shadow">
                                <i class="fas fa-chart-line text-purple-600 text-2xl mb-2"></i>
                                <p class="text-xs font-medium">Return Prediction</p>
                                <p class="text-xs text-gray-500">Ensemble</p>
                            </div>
                        </div>
                        <i class="fas fa-arrow-right text-gray-400"></i>
                        <div class="flex-1">
                            <div class="bg-white rounded-lg p-3 shadow">
                                <i class="fas fa-shield-alt text-green-600 text-2xl mb-2"></i>
                                <p class="text-xs font-medium">Risk Model</p>
                                <p class="text-xs text-gray-500">Multi-factor</p>
                            </div>
                        </div>
                        <i class="fas fa-arrow-right text-gray-400"></i>
                        <div class="flex-1">
                            <div class="bg-white rounded-lg p-3 shadow">
                                <i class="fas fa-balance-scale text-blue-600 text-2xl mb-2"></i>
                                <p class="text-xs font-medium">Optimization</p>
                                <p class="text-xs text-gray-500">HRP + BL</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Model Details -->
            <div class="grid md:grid-cols-2 gap-6">
                <div>
                    <h5 class="font-medium text-gray-800 mb-3">Return Prediction Ensemble</h5>
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div class="flex justify-between text-sm">
                            <span>XGBoost (Trees: 500, Depth: 6)</span>
                            <span class="text-indigo-600 font-medium">35%</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>LSTM (Bi-directional, 256-128)</span>
                            <span class="text-indigo-600 font-medium">30%</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Transformer (8 heads, 4 layers)</span>
                            <span class="text-indigo-600 font-medium">35%</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h5 class="font-medium text-gray-800 mb-3">Risk Components</h5>
                    <div class="bg-gray-50 rounded-lg p-4 space-y-3">
                        <div class="flex justify-between text-sm">
                            <span>Factor Model (40 factors)</span>
                            <span class="text-red-600 font-medium">VaR 95%</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>GARCH-DCC Volatility</span>
                            <span class="text-red-600 font-medium">CVaR 95%</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>EVT-Copula Tail Risk</span>
                            <span class="text-red-600 font-medium">Stress Test</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
        const modelTab = document.getElementById('model-tab');
        if (modelTab) {
            modelTab.innerHTML = content;
        } else {
            console.error('Model tab container not found');
        }
    } catch (error) {
        console.error('Error loading model tab:', error);
        const modelTab = document.getElementById('model-tab');
        if (modelTab) {
            modelTab.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Failed to load model design content. Please try again.
                    </p>
                </div>
            `;
        }
        // Don't rethrow - we've handled the error here
    }
}

// Load Evaluation Tab
function loadEvaluationTab() {
    try {
        if (!researchFramework) {
            console.warn('Research framework not initialized');
            return;
        }
        
        const evaluation = researchFramework.evaluateModels();
    
    let content = `
        <div class="space-y-6">
            <!-- Performance Metrics -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-chart-bar text-green-500 mr-2"></i>Model Performance Metrics
                </h4>
                <div class="grid md:grid-cols-4 gap-4">
                    <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                        <div class="text-2xl font-bold text-green-700">${evaluation.performanceMetrics.financial.sharpeRatio}</div>
                        <div class="text-sm text-gray-600">Sharpe Ratio</div>
                        <div class="text-xs text-green-600 mt-1">Target: > 1.3</div>
                    </div>
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                        <div class="text-2xl font-bold text-blue-700">${(evaluation.performanceMetrics.statistical.OOS_R2 * 100).toFixed(1)}%</div>
                        <div class="text-sm text-gray-600">OOS R²</div>
                        <div class="text-xs text-blue-600 mt-1">In-sample: ${(evaluation.performanceMetrics.statistical.IS_R2 * 100).toFixed(1)}%</div>
                    </div>
                    <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                        <div class="text-2xl font-bold text-red-700">${(evaluation.performanceMetrics.financial.maxDrawdown * 100).toFixed(1)}%</div>
                        <div class="text-sm text-gray-600">Max Drawdown</div>
                        <div class="text-xs text-red-600 mt-1">Limit: < 15%</div>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                        <div class="text-2xl font-bold text-purple-700">${(evaluation.performanceMetrics.financial.winRate * 100).toFixed(1)}%</div>
                        <div class="text-sm text-gray-600">Win Rate</div>
                        <div class="text-xs text-purple-600 mt-1">Profit Factor: ${evaluation.performanceMetrics.financial.profitFactor}</div>
                    </div>
                </div>
            </div>
            
            <!-- Feature Importance -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-ranking-star text-amber-500 mr-2"></i>Top Feature Importance
                </h4>
                <div class="space-y-2">
                    ${evaluation.featureImportance.top_factors.map(factor => `
                        <div class="flex items-center">
                            <div class="flex-1">
                                <div class="flex justify-between mb-1">
                                    <span class="text-sm font-medium">${factor.name}</span>
                                    <span class="text-sm text-gray-500">${(factor.importance * 100).toFixed(1)}%</span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-2">
                                    <div class="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" 
                                         style="width: ${factor.importance * 100}%"></div>
                                </div>
                            </div>
                            <span class="ml-3 text-xs text-gray-500">${factor.direction}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
        const evaluationTab = document.getElementById('evaluation-tab');
        if (evaluationTab) {
            evaluationTab.innerHTML = content;
        } else {
            console.error('Evaluation tab container not found');
        }
    } catch (error) {
        console.error('Error loading evaluation tab:', error);
        const evaluationTab = document.getElementById('evaluation-tab');
        if (evaluationTab) {
            evaluationTab.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Failed to load evaluation content. Please try again.
                    </p>
                </div>
            `;
        }
        // Don't rethrow - we've handled the error here
    }
}

// Load Innovation Tab
function loadInnovationTab() {
    try {
        if (!researchFramework) {
            console.warn('Research framework not initialized');
            return;
        }
        
        const innovations = researchFramework.proposeInnovations();
    
    let content = `
        <div class="space-y-6">
            <!-- Immediate Improvements -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-rocket text-blue-500 mr-2"></i>Immediate Improvements
                </h4>
                <div class="grid md:grid-cols-3 gap-4">
                    ${innovations.immediateImprovements.map(item => `
                        <div class="border border-blue-200 rounded-lg p-4 hover:shadow-lg transition">
                            <h5 class="font-medium text-blue-800 mb-2">${item.area}</h5>
                            <p class="text-xs text-gray-600 mb-2">${item.proposal}</p>
                            <div class="flex justify-between text-xs">
                                <span class="text-green-600">Impact: ${item.expectedImpact}</span>
                                <span class="text-gray-500">${item.implementation}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Research Directions -->
            <div>
                <h4 class="font-semibold text-gray-800 mb-3">
                    <i class="fas fa-microscope text-purple-500 mr-2"></i>Novel Research Directions
                </h4>
                <div class="space-y-4">
                    ${innovations.researchDirections.map(research => `
                        <div class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-4">
                            <h5 class="font-medium text-purple-800 mb-2">${research.title}</h5>
                            <p class="text-sm text-gray-700 mb-2"><strong>Hypothesis:</strong> ${research.hypothesis}</p>
                            <p class="text-sm text-gray-600 mb-2"><strong>Method:</strong> ${research.methodology}</p>
                            <p class="text-xs text-indigo-600"><strong>Innovation:</strong> ${research.novelty}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
    
        const innovationTab = document.getElementById('innovation-tab');
        if (innovationTab) {
            innovationTab.innerHTML = content;
        } else {
            console.error('Innovation tab container not found');
        }
    } catch (error) {
        console.error('Error loading innovation tab:', error);
        const innovationTab = document.getElementById('innovation-tab');
        if (innovationTab) {
            innovationTab.innerHTML = `
                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p class="text-red-700">
                        <i class="fas fa-exclamation-triangle mr-2"></i>
                        Failed to load innovation content. Please try again.
                    </p>
                </div>
            `;
        }
        // Don't rethrow - we've handled the error here
    }
}

// Update Problem Definition Display
function updateProblemDefinition(summary) {
    // This is already handled in the HTML
}

// Update Data Pipeline Display
function updateDataPipeline(methodology) {
    // This is already handled in the HTML
}

// Update Model Metrics Display
function updateModelMetrics(results) {
    // Update the metrics in the header if needed
}

// Update Live Metrics
function updateLiveMetrics() {
    // Simulate live metric updates
    const metrics = {
        sharpe: (1.3 + Math.random() * 0.3).toFixed(2),
        aum: (120 + Math.random() * 10).toFixed(1),
        pnl: (0.8 + Math.random() * 0.8).toFixed(1)
    };
    
    // Update header metrics if elements exist
    const sharpeElement = document.querySelector('.text-slate-400 .text-green-400');
    if (sharpeElement) {
        sharpeElement.textContent = metrics.sharpe;
    }
}

// Update Last Update Time
function updateLastUpdateTime() {
    const now = new Date();
    const formatted = now.toISOString().replace('T', ' ').substring(0, 19);
    const element = document.getElementById('lastUpdate');
    if (element) {
        element.textContent = formatted;
    }
    
    // Update every second
    setTimeout(updateLastUpdateTime, 1000);
}

// Export for use
window.showResearchTab = showResearchTab;