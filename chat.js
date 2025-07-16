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
        
        // DOM elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        this.chatLoading = document.getElementById('chat-loading');
        this.loadingText = document.querySelector('.loading-text');
        this.modelSelect = document.getElementById('model-select');
        this.switchModelBtn = document.getElementById('switch-model');
        
        this.initializeEventListeners();
        this.initializeModelSelection();
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

            // Get available models
            this.availableModels = window.webllm.prebuiltAppConfig.model_list;
            
            // Populate model dropdown
            this.populateModelDropdown();
            
            // Set default model (prefer Llama-3)
            const defaultModel = this.availableModels.find(model => 
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
        
        try {
            // Clean up current engine
            if (this.engine) {
                this.engine = null;
            }
            
            // Reset state
            this.isInitialized = false;
            this.isInitializing = false;
            this.currentModel = selectedModel;
            
            // Add model switch message
            this.addMessage('ai', `Switching to ${this.formatModelName(selectedModel.model_id)}. Please wait...`);
            
            // Initialize with new model
            await this.initialize();
            
        } catch (error) {
            console.error('Failed to switch model:', error);
            this.addMessage('ai', `Failed to switch to ${this.formatModelName(selectedModel.model_id)}. Please try again or contact James directly.`);
        } finally {
            // Re-enable switch button
            this.switchModelBtn.disabled = false;
            this.switchModelBtn.textContent = 'Switch Model';
        }
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

            this.showLoading('Initializing AI chat...');
            
            // Use the currently selected model or fall back to default
            const selectedModel = this.currentModel?.model_id || this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct')
            )?.model_id || this.availableModels[0]?.model_id;
            
            console.log('Selected model:', selectedModel);
            
            // Initialize the engine with progress callback and increased context window
            this.engine = await window.webllm.CreateMLCEngine(selectedModel, {
                initProgressCallback: (progress) => {
                    const percentage = Math.round(progress.progress * 100);
                    this.showLoading(`Loading AI model: ${percentage}%`);
                },
                context_window_size: 4096, // Increased from default 1024
                sliding_window_size: 2048   // Enable sliding window for longer conversations
            });
            
            // Initialize message history with system prompt
            this.messageHistory = [{ role: "system", content: window.JAMES_CONTEXT }];
            
            this.isInitialized = true;
            this.isInitializing = false;
            this.hideLoading();
            
            // Show success message with model info
            const modelName = this.formatModelName(selectedModel);
            this.addMessage('ai', `AI chat is ready using ${modelName}! Ask me anything about James's background, experience, or interests.`);
            
        } catch (error) {
            console.error('Failed to initialize chat:', error);
            this.isInitializing = false;
            this.handleInitializationError(error);
        }
    }

    handleInitializationError(error) {
        this.hideLoading();
        
        let errorMessage = 'AI chat is temporarily unavailable. ';
        
        if (error.message.includes('network') || error.message.includes('connection')) {
            errorMessage += 'Please check your internet connection and try again.';
        } else if (error.message.includes('WebGL') || error.message.includes('GPU')) {
            errorMessage += 'Your browser may not support the required features. Please try a different browser.';
        } else {
            errorMessage += 'Please try refreshing the page or contact James directly via email.';
        }
        
        this.addMessage('ai', errorMessage);
        this.addMessage('ai', 'You can always reach James at james.m.blair@icloud.com for direct communication.');
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
            this.addMessage('ai', 'I\'m having trouble connecting right now. Please try again in a moment or contact James directly at james.m.blair@icloud.com.');
            return;
        }

        // Show loading state
        this.showLoading('James is thinking...');

        try {
            // Generate response
            const response = await this.generateResponse(message);
            
            this.hideLoading();
            this.addMessage('ai', response);
            
        } catch (error) {
            console.error('Error generating response:', error);
            this.hideLoading();
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
            errorMessage += 'Please try asking your question again, or contact James directly at james.m.blair@icloud.com.';
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
        
        this.updateSendButton(true);
    }

    hideLoading() {
        if (this.chatLoading) {
            this.chatLoading.classList.add('hidden');
        }
        
        this.updateSendButton(false);
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
        this.messageHistory = [{ role: "system", content: window.JAMES_CONTEXT }];
        
        // Clear visual messages except the first two (disclaimer and welcome)
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach((message, index) => {
            if (index > 1) { // Keep the first two messages (disclaimer and welcome)
                message.remove();
            }
        });
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