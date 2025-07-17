// Web-LLM Chat Integration for James Blair's website
// This module handles the AI chat functionality using web-llm

class JamesChat {
    constructor() {
        this.engine = null;
        this.isInitialized = false;
        this.isInitializing = false;
        this.messageHistory = [];
        this.maxRetries = 3;
        this.retryDelay = 1000;
        this.availableModels = [];
        this.currentModel = null;
        this.contextContent = null;
        this.modelCache = new Map();
        this.cachePrefix = 'webllm_model_cache_';
        
        // DOM elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        this.chatLoading = document.getElementById('chat-loading');
        this.loadingText = document.querySelector('.loading-text');
        this.chatStatus = document.getElementById('chat-status');
        this.statusText = document.querySelector('.status-text');
        this.modelSelect = document.getElementById('model-select');
        this.switchModelBtn = document.getElementById('switch-model');
        
        this.initializeEventListeners();
        this.initializeModelSelection();
        
        // Initialize with proper state - hide both indicators initially
        this.hideLoading();
        this.hideStatus();
        
        // Register service worker for better caching (if available)
        this.registerServiceWorker();
        
        // Start background preloading of popular models after a delay
        setTimeout(() => {
            this.preloadPopularModels();
        }, 5000); // Wait 5 seconds after page load
    }

    initializeEventListeners() {
        // Send message on button click
        if (this.sendButton) {
            this.sendButton.addEventListener('click', () => this.sendMessage());
        }

        // Send message on Enter key press
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Auto-resize textarea and handle input
            this.chatInput.addEventListener('input', () => {
                this.adjustInputHeight();
                this.updateSendButton();
            });
        }

        // Model switch button
        if (this.switchModelBtn) {
            this.switchModelBtn.addEventListener('click', () => this.switchModel());
        }
    }

    async initializeModelSelection() {
        try {
            // Wait for webllm to be available
            if (!window.webllm) {
                setTimeout(() => this.initializeModelSelection(), 1000);
                return;
            }

            // Get available models and filter out ones with insufficient context window
            const allModels = window.webllm.prebuiltAppConfig.model_list;
            
            // Filter out models with 1K context window since our llms.txt content is ~1214 tokens
            this.availableModels = allModels.filter(model => {
                const modelId = model.model_id.toLowerCase();
                // Exclude models with "1k" in their ID (indicates 1024 token context window)
                // Also exclude any other known small context models
                return !modelId.includes('1k') && !modelId.includes('-1k');
            });
            
            console.log(`Filtered models: ${allModels.length} total, ${this.availableModels.length} compatible with context size`);
            console.log(`Filtered out ${allModels.length - this.availableModels.length} models with insufficient context window`);
            
            // Safety check - ensure we have models available
            if (this.availableModels.length === 0) {
                console.error('No models available after filtering for context size compatibility');
                this.availableModels = allModels; // Fallback to all models if filtering removed everything
            }
            
            // Populate model dropdown
            this.populateModelDropdown();
            
            // Set default model (prefer Llama-3 without 1K context limitation)
            const defaultModel = this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct') && !model.model_id.includes('1k')
            ) || this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct')
            ) || this.availableModels[0];
            
            this.currentModel = defaultModel;
            
            if (this.modelSelect) {
                this.modelSelect.value = defaultModel.model_id;
            }
            
        } catch (error) {
            console.error('Failed to initialize model selection:', error);
        }
    }

    populateModelDropdown() {
        if (!this.modelSelect) return;
        
        // Clear existing options
        this.modelSelect.innerHTML = '';
        
        // Group models by type for better UX
        const modelGroups = this.groupModelsByType();
        
        Object.entries(modelGroups).forEach(([groupName, models]) => {
            if (models.length > 0) {
                const optgroup = document.createElement('optgroup');
                optgroup.label = groupName;
                
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.model_id;
                    option.textContent = this.formatModelName(model.model_id);
                    optgroup.appendChild(option);
                });
                
                this.modelSelect.appendChild(optgroup);
            }
        });
    }

    groupModelsByType() {
        const groups = {
            'Llama 3': [],
            'Llama 2': [],
            'Phi': [],
            'Mistral': [],
            'Gemma': [],
            'Qwen': [],
            'Other': []
        };
        
        this.availableModels.forEach(model => {
            const modelId = model.model_id;
            if (modelId.includes('Llama-3')) {
                groups['Llama 3'].push(model);
            } else if (modelId.includes('Llama-2')) {
                groups['Llama 2'].push(model);
            } else if (modelId.includes('Phi') || modelId.includes('phi')) {
                groups['Phi'].push(model);
            } else if (modelId.includes('Mistral')) {
                groups['Mistral'].push(model);
            } else if (modelId.includes('gemma')) {
                groups['Gemma'].push(model);
            } else if (modelId.includes('Qwen')) {
                groups['Qwen'].push(model);
            } else {
                groups['Other'].push(model);
            }
        });
        
        return groups;
    }

    formatModelName(modelId) {
        // Convert model ID to more readable format
        return modelId
            .replace(/-/g, ' ')
            .replace(/q4f16_1/g, '(4-bit)')
            .replace(/q4f32_1/g, '(4-bit float)')
            .replace(/MLC/g, '')
            .replace(/1k/g, '1K context')
            .trim();
    }

    async switchModel() {
        if (!this.modelSelect || !this.switchModelBtn) return;
        
        const selectedModelId = this.modelSelect.value;
        const selectedModel = this.availableModels.find(model => model.model_id === selectedModelId);
        
        if (!selectedModel || selectedModel.model_id === this.currentModel?.model_id) {
            return;
        }
        
        // Disable switch button during transition
        this.switchModelBtn.disabled = true;
        this.switchModelBtn.textContent = 'Switching...';
        this.hideStatus();
        
        try {
            // Add model switch message
            const modelName = this.formatModelName(selectedModelId);
            this.addMessage('ai', `Switching to ${modelName}. Please wait...`);
            
            // Clean up current state
            this.engine = null;
            this.isInitialized = false;
            this.isInitializing = false;
            this.currentModel = selectedModel;
            
            // Re-initialize with new model
            await this.initialize();
            
        } catch (error) {
            console.error('Failed to switch model:', error);
            const modelName = this.formatModelName(selectedModelId);
            this.addMessage('ai', `Failed to switch to ${modelName}. Error: ${error.message || 'Unknown error'}. Please try again or contact James directly.`);
            // Revert dropdown to current model
            this.modelSelect.value = this.currentModel?.model_id || '';
        } finally {
            // Re-enable switch button
            this.switchModelBtn.disabled = false;
            this.switchModelBtn.textContent = 'Switch Model';
        }
    }

    async fetchLLMsContext() {
        try {
            // Try to fetch llms.txt (works in production with HTTP server)
            const response = await fetch('./llms.txt');
            if (!response.ok) {
                throw new Error(`Failed to fetch llms.txt: ${response.status}`);
            }
            
            const content = await response.text();
            this.contextContent = this.processLLMsContent(content);
            return this.contextContent;
            
        } catch (error) {
            console.error('Error fetching llms.txt:', error);
            
            // For local file:// protocol, provide helpful error message
            if (window.location.protocol === 'file:') {
                throw new Error('AI chat requires HTTP access to load context. Please serve this site via a web server (e.g., python -m http.server) rather than opening the HTML file directly.');
            }
            
            throw new Error('Failed to load context from llms.txt. Please ensure the file exists and is accessible.');
        }
    }


    processLLMsContent(content) {
        // Convert the llms.txt content to a system prompt
        const systemPrompt = `You are an AI assistant providing information about James Blair based on his personal website jamesblair.me. Use the following context to answer questions about James:

${content}

Remember to:
- Always clarify that you are an AI providing information about James, not James himself
- Be professional but conversational and approachable
- Keep responses concise but informative (2-3 paragraphs maximum)
- For detailed inquiries or business matters, suggest contacting James directly via email
- Show enthusiasm when discussing James's work in data science, AI, and technology
- Be encouraging when discussing James's expertise and availability for speaking engagements
- Direct users to email james@jamesblair.me for direct communication with James`;

        return systemPrompt;
    }

    async initialize() {
        if (this.isInitialized || this.isInitializing) {
            return;
        }
        
        this.isInitializing = true;
        
        try {
            // Check if web-llm is available
            if (!window.webllm) {
                throw new Error('Web-LLM not available. Please check your internet connection.');
            }

            this.showLoading('Loading context...');
            
            // Fetch llms.txt context
            await this.fetchLLMsContext();
            
            // Use the currently selected model or fall back to default
            const selectedModel = this.currentModel?.model_id || this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct') && !model.model_id.includes('1k')
            )?.model_id || this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct')
            )?.model_id || this.availableModels[0]?.model_id;
            
            console.log('Selected model:', selectedModel);
            
            // Check cache and show appropriate loading message
            const isCached = await this.checkModelCache(selectedModel);
            if (!isCached) {
                this.showLoading('Initializing AI chat...');
            }
            
            // Initialize the engine with optimized settings for caching and performance
            this.engine = await window.webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (progress) => {
                    const percentage = Math.round(progress.progress * 100);
                    let progressText = `Loading AI model: ${percentage}%`;
                    
                    // Show more detailed progress information
                    if (progress.text) {
                        progressText = `${progress.text}: ${percentage}%`;
                    }
                    
                    this.showLoading(progressText);
                    
                    // Log detailed progress for debugging
                    console.log('Model loading progress:', {
                        percentage,
                        text: progress.text,
                        timeStamp: new Date().toISOString()
                    });
                },
                context_window_size: 4096, // Increased from default 1024
                sliding_window_size: 2048,   // Enable sliding window for longer conversations
                
                // Enable aggressive caching for faster subsequent loads
                use_cache: true,
                
                // Optimize memory usage
                low_resource_required: false,
                
                // Enable model file caching in browser
                cache_model_in_cache_api: true
            });
            
            // Initialize message history with system prompt from llms.txt
            this.messageHistory = [{ role: "system", content: this.contextContent }];
            
            this.isInitialized = true;
            this.isInitializing = false;
            this.hideLoading();
            this.showStatus('available');
            
            // Update model usage for cache prioritization
            this.updateModelUsage(selectedModel);
            
            // Start background preloading of recently used models
            setTimeout(() => {
                this.preloadPopularModels();
            }, 2000); // Wait 2 seconds after initialization
            
            // Show success message with model info
            const modelName = this.formatModelName(selectedModel);
            this.addMessage('ai', `Chat ready using ${modelName}! Ask me anything about James's background, experience, or interests.`);
            
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            this.isInitializing = false;
            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        this.hideLoading();
        this.hideStatus();
        
        let errorMessage = 'Chat is temporarily unavailable. ';
        
        if (error.message.includes('network') || error.message.includes('connection')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('WebGL') || error.message.includes('GPU')) {
            errorMessage += 'Your browser may not support the required features. Please try a different browser.';
        } else {
            errorMessage += 'Please try refreshing the page or contact James directly via email.';
        }
        
        this.addMessage('ai', errorMessage);
        this.addMessage('ai', 'You can always reach James at james@jamesblair.me for direct communication.');
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        
        if (!message) {
            return;
        }

        // Clear input and disable send button
        this.chatInput.value = '';
        this.updateSendButton();
        this.adjustInputHeight();

        // Add user message to chat
        this.addMessage('user', message);

        // Initialize chat if not already done
        if (!this.isInitialized && !this.isInitializing) {
            await this.initialize();
        }

        // If still not initialized, show error
        if (!this.isInitialized) {
            this.addMessage('ai', 'I\'m having trouble connecting right now. Please try again in a moment or contact James directly at james@jamesblair.me.');
            return;
        }

        // Show loading state only when generating response
        this.showLoading('Thinking...');
        this.hideStatus();

        try {
            // Generate response
            const response = await this.generateResponse(message);
            
            this.hideLoading();
            this.showStatus('available');
            this.addMessage('ai', response);
            
        } catch (error) {
            console.error('Error generating response:', error);
            this.hideLoading();
            this.showStatus('available');
            this.handleResponseError(error);
        }
    }

    async generateResponse(message, retryCount = 0) {
        try {
            // Add message to history
            this.messageHistory.push({ role: 'user', content: message });
            
            // Generate response
            const response = await this.engine.chat.completions.create({
                messages: this.messageHistory,
                temperature: 0.7,
                max_tokens: 800,
                stream: false
            });
            
            const aiResponse = response.choices[0].message.content;
            
            // Add AI response to history
            this.messageHistory.push({ role: 'assistant', content: aiResponse });
            
            // Keep history manageable (last 20 messages + system prompt for 4K context)
            if (this.messageHistory.length > 21) {
                const systemPrompt = this.messageHistory[0]; // Preserve system prompt
                this.messageHistory = [systemPrompt, ...this.messageHistory.slice(-20)];
            }
            
            return aiResponse;
            
        } catch (error) {
            if (retryCount < this.maxRetries) {
                console.log(`Retrying message generation (attempt ${retryCount + 1}/${this.maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return await this.generateResponse(message, retryCount + 1);
            }
            throw error;
        }
    }

    handleResponseError(error) {
        let errorMessage = 'I encountered an issue generating a response. ';
        
        if (error.message.includes('network') || error.message.includes('connection')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
            errorMessage += 'The AI service is busy. Please try again in a moment.';
        } else {
            errorMessage += 'Please try asking your question again, or contact James directly at james@jamesblair.me.';
        }
        
        this.addMessage('ai', errorMessage);
    }

    addMessage(sender, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.setAttribute('role', 'article');
        messageDiv.setAttribute('aria-label', `${sender} message`);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = content;
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Auto-scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        
        // Announce new messages to screen readers
        if (sender === 'ai') {
            this.announceMessage(content);
        }
    }

    announceMessage(content) {
        // Create a temporary element for screen reader announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.textContent = `James responded: ${content}`;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    showLoading(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
        
        if (this.chatLoading) {
            this.chatLoading.classList.remove('hidden');
        }
        
        // Hide status when showing loading
        this.hideStatus();
        
        this.updateSendButton(true);
    }

    hideLoading() {
        if (this.chatLoading) {
            this.chatLoading.classList.add('hidden');
        }
        
        // Don't update send button if we're hiding loading during initialization
        if (this.isInitialized) {
            this.updateSendButton(false);
        }
    }

    showStatus(status) {
        if (!this.chatStatus) return;
        
        // Hide loading spinner when showing status (but don't affect send button state)
        if (this.chatLoading) {
            this.chatLoading.classList.add('hidden');
        }
        
        this.chatStatus.classList.remove('hidden');
        
        if (this.statusText) {
            switch(status) {
                case 'available':
                    this.statusText.textContent = 'Ready';
                    break;
                case 'initializing':
                    this.statusText.textContent = 'Initializing chat...';
                    break;
                default:
                    this.statusText.textContent = 'Ready';
            }
        }
    }

    hideStatus() {
        if (this.chatStatus) {
            this.chatStatus.classList.add('hidden');
        }
    }

    updateSendButton(isLoading = false) {
        if (!this.sendButton) return;
        
        const hasText = this.chatInput && this.chatInput.value.trim().length > 0;
        
        this.sendButton.disabled = isLoading || !hasText;
        this.sendButton.textContent = isLoading ? 'Sending...' : 'Send';
    }

    adjustInputHeight() {
        if (!this.chatInput) return;
        
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    // Public method to check if chat is ready
    isReady() {
        return this.isInitialized;
    }

    // Public method to get chat history
    getHistory() {
        return [...this.messageHistory];
    }

    // Public method to clear chat history
    clearHistory() {
        this.messageHistory = [{ role: "system", content: this.contextContent }];
        
        // Clear visual messages except the first two (disclaimer and welcome)
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach((message, index) => {
            if (index > 1) { // Keep the first two messages (disclaimer and welcome)
                message.remove();
            }
        });
    }

    // Enhanced model caching and preloading methods
    getCacheKey(modelId) {
        return `${this.cachePrefix}${modelId}`;
    }

    isCacheSupported() {
        try {
            return typeof Storage !== 'undefined' && window.localStorage;
        } catch (e) {
            return false;
        }
    }

    // Check if web-llm has the model cached
    async isModelCachedByWebLLM(modelId) {
        try {
            if (window.webllm && window.webllm.hasModelInCache) {
                return await window.webllm.hasModelInCache(modelId);
            }
        } catch (e) {
            console.log('Could not check web-llm cache status:', e);
        }
        return false;
    }

    getCachedModel(modelId) {
        if (!this.isCacheSupported()) return null;
        
        try {
            const cacheKey = this.getCacheKey(modelId);
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                // Check if cache is still valid (7 days for model info)
                const cacheAge = Date.now() - data.timestamp;
                if (cacheAge < 7 * 24 * 60 * 60 * 1000) {
                    console.log(`Using cached model info for ${modelId}`);
                    return data.modelData;
                } else {
                    // Remove expired cache
                    localStorage.removeItem(cacheKey);
                }
            }
        } catch (e) {
            console.warn('Error reading model cache:', e);
        }
        return null;
    }

    setCachedModel(modelId, modelData) {
        if (!this.isCacheSupported()) return;
        
        try {
            const cacheKey = this.getCacheKey(modelId);
            const data = {
                modelData: modelData,
                timestamp: Date.now(),
                lastUsed: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(data));
            console.log(`Cached model info for ${modelId}`);
        } catch (e) {
            console.warn('Error caching model:', e);
            // If storage is full, try to clear old cache entries
            this.clearExpiredCache();
        }
    }

    // Update last used timestamp for cache prioritization
    updateModelUsage(modelId) {
        if (!this.isCacheSupported()) return;
        
        try {
            const cacheKey = this.getCacheKey(modelId);
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                data.lastUsed = Date.now();
                localStorage.setItem(cacheKey, JSON.stringify(data));
            }
        } catch (e) {
            console.warn('Error updating model usage:', e);
        }
    }

    // Preload popular models in the background
    async preloadPopularModels() {
        if (!window.webllm || this.isInitializing) return;
        
        // Get most recently used models
        const recentModels = this.getRecentlyUsedModels();
        
        // Preload the most recent model if it's not the current one
        if (recentModels.length > 0 && recentModels[0] !== this.currentModel?.model_id) {
            const modelToPreload = recentModels[0];
            console.log(`Preloading recently used model: ${modelToPreload}`);
            
            try {
                // Check if already cached
                const isCached = await this.isModelCachedByWebLLM(modelToPreload);
                if (!isCached) {
                    // Preload in background (don't await to avoid blocking)
                    window.webllm.preloadModel(modelToPreload).catch(e => {
                        console.log('Background preload failed (this is normal):', e);
                    });
                }
            } catch (e) {
                console.log('Could not preload model:', e);
            }
        }
    }

    getRecentlyUsedModels() {
        if (!this.isCacheSupported()) return [];
        
        const models = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.lastUsed) {
                        models.push({
                            modelId: key.replace(this.cachePrefix, ''),
                            lastUsed: data.lastUsed
                        });
                    }
                }
            }
            // Sort by most recently used
            models.sort((a, b) => b.lastUsed - a.lastUsed);
            return models.map(m => m.modelId);
        } catch (e) {
            console.warn('Error getting recent models:', e);
            return [];
        }
    }

    clearExpiredCache() {
        if (!this.isCacheSupported()) return;
        
        try {
            const now = Date.now();
            const keysToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.cachePrefix)) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        const cacheAge = now - data.timestamp;
                        if (cacheAge > 24 * 60 * 60 * 1000) {
                            keysToRemove.push(key);
                        }
                    } catch (e) {
                        keysToRemove.push(key); // Remove corrupted entries
                    }
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`Cleared ${keysToRemove.length} expired cache entries`);
        } catch (e) {
            console.warn('Error clearing expired cache:', e);
        }
    }

    // Enhanced cache checking with web-llm integration
    async checkModelCache(modelId) {
        // Check our localStorage cache first
        const cachedModel = this.getCachedModel(modelId);
        
        // Check if web-llm has the model files cached
        const isWebLLMCached = await this.isModelCachedByWebLLM(modelId);
        
        if (isWebLLMCached) {
            this.showLoading('Loading cached AI model...');
            console.log(`Model ${modelId} found in web-llm cache - should load quickly`);
            return true;
        } else if (cachedModel) {
            this.showLoading('Model info cached, downloading model files...');
            console.log(`Model ${modelId} info cached but files need download`);
            return false; // Still need to download, but we have some info
        }
        
        console.log(`Model ${modelId} not cached - first-time download`);
        return false;
    }

    // Add service worker registration for better caching
    async registerServiceWorker() {
        if ('serviceWorker' in navigator && 'caches' in window) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered for model caching');
                return registration;
            } catch (error) {
                console.log('Service Worker registration failed (this is normal):', error);
            }
        }
        return null;
    }

}

// Initialize chat when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create global chat instance
    window.JamesChat = new JamesChat();
    
    // The embedded chat is always visible, so no need for visibility observer
    // Chat initialization is handled by the intersection observer in script.js
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.JamesChat) {
        // Page is hidden, could pause any ongoing operations
        console.log('Page hidden, chat operations paused');
    } else if (window.JamesChat) {
        // Page is visible again
        console.log('Page visible, chat operations resumed');
    }
});

// Handle errors globally
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('webllm')) {
        console.error('Web-LLM error:', event.error);
        if (window.AppUtils) {
            window.AppUtils.showNotification('AI chat encountered an error. Please try again.', 'error');
        }
    }
});

// Export for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JamesChat;
}