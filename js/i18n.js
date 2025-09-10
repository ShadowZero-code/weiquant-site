/**
 * Internationalization (i18n) Module
 * Provides multi-language support for the application
 */

const i18n = {
    // Current language
    currentLang: localStorage.getItem('language') || 'en',
    
    // Language translations
    translations: {
        en: {
            // Navigation
            'nav.home': 'Home',
            'nav.analysis': 'Analysis',
            'nav.portfolio': 'Portfolio',
            'nav.quantModels': 'Quant Models',
            'nav.research': 'Research',
            'nav.marketData': 'Market Data',
            'nav.backtest': 'Backtest',
            'nav.history': 'History',
            'nav.settings': 'Settings',
            
            // Hero Section
            'hero.title': 'AI Financial Analyst',
            'hero.subtitle': 'Professional Investment Analysis Platform',
            'hero.getStarted': 'Get Started',
            'hero.learnMore': 'Learn More',
            
            // Analysis Section
            'analysis.title': 'AI-Powered Analysis',
            'analysis.newsInput': 'Enter financial news or market updates for analysis',
            'analysis.placeholder': 'Paste financial news, market reports, or company announcements here...',
            'analysis.analyzeBtn': 'Analyze',
            'analysis.sentiment': 'Market Sentiment',
            'analysis.bullish': 'Bullish',
            'analysis.neutral': 'Neutral',
            'analysis.bearish': 'Bearish',
            'analysis.recommendations': 'Investment Recommendations',
            'analysis.allocation': 'Suggested Asset Allocation',
            'analysis.riskAssessment': 'Risk Assessment',
            
            // Portfolio Section
            'portfolio.title': 'Portfolio Management',
            'portfolio.addAsset': 'Add Asset',
            'portfolio.totalValue': 'Total Value',
            'portfolio.totalPL': 'Total P&L',
            'portfolio.noAssets': 'No portfolio assets',
            'portfolio.editAsset': 'Edit Asset',
            'portfolio.updateAsset': 'Update Asset',
            'portfolio.updatePrice': 'Update Price',
            'portfolio.removeAsset': 'Remove Asset',
            'portfolio.stock': 'Stock',
            'portfolio.bond': 'Bond',
            'portfolio.fund': 'ETF',
            'portfolio.commodity': 'Commodity',
            'portfolio.assetType': 'Asset Type',
            'portfolio.assetName': 'Asset Name',
            'portfolio.quantity': 'Quantity',
            'portfolio.buyPrice': 'Buy Price',
            'portfolio.currentPrice': 'Current Price',
            'portfolio.value': 'Value',
            'portfolio.pl': 'P&L',
            'portfolio.actions': 'Actions',
            
            // Market Data
            'market.title': 'Real-time Market Data',
            'market.indices': 'Market Indices',
            'market.trendingStocks': 'Trending Stocks',
            'market.symbol': 'Symbol',
            'market.name': 'Name',
            'market.price': 'Price',
            'market.change': 'Change',
            'market.volume': 'Volume',
            'market.analyze': 'Analyze',
            'market.add': 'Add',
            
            // Backtest
            'backtest.title': 'Strategy Backtesting',
            'backtest.dataConfig': 'Data Configuration',
            'backtest.strategyConfig': 'Strategy Configuration',
            'backtest.symbol': 'Symbol',
            'backtest.startDate': 'Start Date',
            'backtest.endDate': 'End Date',
            'backtest.loadData': 'Load Historical Data',
            'backtest.strategy': 'Strategy',
            'backtest.initialCapital': 'Initial Capital',
            'backtest.runBacktest': 'Run Backtest',
            'backtest.results': 'Backtest Results',
            'backtest.metrics': 'Performance Metrics',
            'backtest.trades': 'Trade History',
            
            // Settings
            'settings.title': 'API Settings',
            'settings.apiKey': 'API Key',
            'settings.endpoint': 'API Endpoint',
            'settings.model': 'Model',
            'settings.enableApi': 'Enable DeepSeek API',
            'settings.testConnection': 'Test Connection',
            'settings.save': 'Save Settings',
            'settings.clear': 'Clear Settings',
            'settings.connectionStatus': 'Connection Status',
            'settings.apiCallCount': 'API Call Count',
            'settings.lastApiCall': 'Last API Call',
            
            // Common
            'common.loading': 'Loading...',
            'common.error': 'Error',
            'common.success': 'Success',
            'common.warning': 'Warning',
            'common.info': 'Info',
            'common.confirm': 'Confirm',
            'common.cancel': 'Cancel',
            'common.save': 'Save',
            'common.delete': 'Delete',
            'common.edit': 'Edit',
            'common.update': 'Update',
            'common.add': 'Add',
            'common.remove': 'Remove',
            'common.search': 'Search',
            'common.filter': 'Filter',
            'common.export': 'Export',
            'common.import': 'Import',
            'common.language': 'Language',
            
            // Alerts and Messages
            'alert.analysisComplete': 'Analysis complete! Please check results below',
            'alert.apiAnalyzing': 'Analyzing with DeepSeek API...',
            'alert.apiError': 'API error, switching to mock mode',
            'alert.assetAdded': 'Asset added successfully',
            'alert.assetUpdated': 'Asset updated successfully',
            'alert.assetRemoved': 'Asset removed',
            'alert.duplicateAsset': 'Asset "{name}" already exists. Do you want to add it anyway?',
            'alert.enterNewsContent': 'Please enter news content for analysis',
            'alert.dataCleared': 'All data has been cleared (API settings preserved)',
            'alert.noMatchingStocks': 'No matching stocks found',
            'alert.confidence': 'Confidence'
        },
        
        zh: {
            // Navigation
            'nav.home': '首页',
            'nav.analysis': '分析',
            'nav.portfolio': '投资组合',
            'nav.quantModels': '量化模型',
            'nav.research': '研究',
            'nav.marketData': '市场数据',
            'nav.backtest': '回测',
            'nav.history': '历史记录',
            'nav.settings': '设置',
            
            // Hero Section
            'hero.title': 'AI金融分析师',
            'hero.subtitle': '专业投资分析平台',
            'hero.getStarted': '开始使用',
            'hero.learnMore': '了解更多',
            
            // Analysis Section
            'analysis.title': 'AI智能分析',
            'analysis.newsInput': '输入金融新闻或市场动态进行分析',
            'analysis.placeholder': '粘贴金融新闻、市场报告或公司公告...',
            'analysis.analyzeBtn': '分析',
            'analysis.sentiment': '市场情绪',
            'analysis.bullish': '看涨',
            'analysis.neutral': '中性',
            'analysis.bearish': '看跌',
            'analysis.recommendations': '投资建议',
            'analysis.allocation': '建议资产配置',
            'analysis.riskAssessment': '风险评估',
            
            // Portfolio Section
            'portfolio.title': '投资组合管理',
            'portfolio.addAsset': '添加资产',
            'portfolio.totalValue': '总市值',
            'portfolio.totalPL': '总盈亏',
            'portfolio.noAssets': '暂无持仓资产',
            'portfolio.editAsset': '编辑资产',
            'portfolio.updateAsset': '更新资产',
            'portfolio.updatePrice': '更新价格',
            'portfolio.removeAsset': '移除资产',
            'portfolio.stock': '股票',
            'portfolio.bond': '债券',
            'portfolio.fund': 'ETF',
            'portfolio.commodity': '商品',
            'portfolio.assetType': '资产类型',
            'portfolio.assetName': '资产名称',
            'portfolio.quantity': '数量',
            'portfolio.buyPrice': '买入价',
            'portfolio.currentPrice': '现价',
            'portfolio.value': '市值',
            'portfolio.pl': '盈亏',
            'portfolio.actions': '操作',
            
            // Market Data
            'market.title': '实时市场数据',
            'market.indices': '市场指数',
            'market.trendingStocks': '热门股票',
            'market.symbol': '代码',
            'market.name': '名称',
            'market.price': '价格',
            'market.change': '涨跌',
            'market.volume': '成交量',
            'market.analyze': '分析',
            'market.add': '加入',
            
            // Backtest
            'backtest.title': '策略回测',
            'backtest.dataConfig': '数据配置',
            'backtest.strategyConfig': '策略配置',
            'backtest.symbol': '标的',
            'backtest.startDate': '开始日期',
            'backtest.endDate': '结束日期',
            'backtest.loadData': '加载历史数据',
            'backtest.strategy': '策略',
            'backtest.initialCapital': '初始资金',
            'backtest.runBacktest': '运行回测',
            'backtest.results': '回测结果',
            'backtest.metrics': '绩效指标',
            'backtest.trades': '交易历史',
            
            // Settings
            'settings.title': 'API设置',
            'settings.apiKey': 'API密钥',
            'settings.endpoint': 'API端点',
            'settings.model': '模型',
            'settings.enableApi': '启用DeepSeek API',
            'settings.testConnection': '测试连接',
            'settings.save': '保存设置',
            'settings.clear': '清除设置',
            'settings.connectionStatus': '连接状态',
            'settings.apiCallCount': 'API调用次数',
            'settings.lastApiCall': '最后调用时间',
            
            // Common
            'common.loading': '加载中...',
            'common.error': '错误',
            'common.success': '成功',
            'common.warning': '警告',
            'common.info': '信息',
            'common.confirm': '确认',
            'common.cancel': '取消',
            'common.save': '保存',
            'common.delete': '删除',
            'common.edit': '编辑',
            'common.update': '更新',
            'common.add': '添加',
            'common.remove': '移除',
            'common.search': '搜索',
            'common.filter': '筛选',
            'common.export': '导出',
            'common.import': '导入',
            'common.language': '语言',
            
            // Alerts and Messages
            'alert.analysisComplete': '分析完成！请查看下方结果',
            'alert.apiAnalyzing': '正在使用DeepSeek API分析...',
            'alert.apiError': 'API错误，切换到模拟模式',
            'alert.assetAdded': '资产添加成功',
            'alert.assetUpdated': '资产更新成功',
            'alert.assetRemoved': '资产已移除',
            'alert.duplicateAsset': '资产"{name}"已存在。是否仍要添加？',
            'alert.enterNewsContent': '请输入新闻内容进行分析',
            'alert.dataCleared': '所有数据已清除（API设置已保留）',
            'alert.noMatchingStocks': '未找到匹配的股票',
            'alert.confidence': '置信度'
        }
    },
    
    /**
     * Get translation for a key
     * @param {string} key - Translation key
     * @param {Object} params - Parameters for interpolation
     * @returns {string} Translated text
     */
    t(key, params = {}) {
        const translation = this.translations[this.currentLang][key] || 
                          this.translations['en'][key] || 
                          key;
        
        // Simple interpolation
        let result = translation;
        for (const [param, value] of Object.entries(params)) {
            result = result.replace(`{${param}}`, value);
        }
        
        return result;
    },
    
    /**
     * Change language
     * @param {string} lang - Language code ('en' or 'zh')
     */
    setLanguage(lang) {
        if (!this.translations[lang]) {
            console.error(`Language ${lang} not supported`);
            return;
        }
        
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.updatePageTranslations();
        
        // Trigger language change event
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    },
    
    /**
     * Get current language
     * @returns {string} Current language code
     */
    getLanguage() {
        return this.currentLang;
    },
    
    /**
     * Update all translations on the page
     */
    updatePageTranslations() {
        // Update elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.t(key);
            
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = translation;
            } else if (element.tagName === 'BUTTON') {
                // Preserve icons if present
                const icon = element.querySelector('i');
                if (icon) {
                    element.innerHTML = icon.outerHTML + ' ' + translation;
                } else {
                    element.textContent = translation;
                }
            } else {
                element.textContent = translation;
            }
        });
        
        // Update page title
        if (document.title.includes('Financial')) {
            document.title = this.t('hero.title') + ' - ' + this.t('hero.subtitle');
        }
    },
    
    /**
     * Initialize i18n
     */
    init() {
        // Add language switcher to page
        this.addLanguageSwitcher();
        
        // Update translations on page load
        this.updatePageTranslations();
        
        // Listen for dynamic content changes
        this.observeDynamicContent();
    },
    
    /**
     * Add language switcher to navigation
     */
    addLanguageSwitcher() {
        const nav = document.querySelector('nav .container');
        if (!nav) return;
        
        const switcher = document.createElement('div');
        switcher.className = 'language-switcher ml-auto flex items-center space-x-2';
        switcher.innerHTML = `
            <button onclick="i18n.setLanguage('en')" class="px-2 py-1 rounded ${this.currentLang === 'en' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}">
                EN
            </button>
            <button onclick="i18n.setLanguage('zh')" class="px-2 py-1 rounded ${this.currentLang === 'zh' ? 'bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}">
                中文
            </button>
        `;
        
        // Insert before the last nav item
        const lastItem = nav.querySelector('.md\\:hidden');
        if (lastItem) {
            nav.insertBefore(switcher, lastItem);
        } else {
            nav.appendChild(switcher);
        }
    },
    
    /**
     * Observe dynamic content for translation updates
     */
    observeDynamicContent() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const elements = node.querySelectorAll('[data-i18n]');
                            elements.forEach(el => {
                                const key = el.getAttribute('data-i18n');
                                el.textContent = this.t(key);
                            });
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
};

// Initialize i18n when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    i18n.init();
});

// Export for use in other modules
window.i18n = i18n;