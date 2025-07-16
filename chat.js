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
            
            // Reload context and initialize with new model
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
            
            // Fallback for local file:// protocol testing
            if (window.location.protocol === 'file:') {
                console.warn('Using embedded llms.txt content for local testing. In production, ensure llms.txt is accessible via HTTP.');
                return this.useEmbeddedLLMsContent();
            }
            
            throw new Error('Failed to load context from llms.txt. Please ensure the file exists and is accessible.');
        }
    }

    async useEmbeddedLLMsContent() {
        // Embedded fallback content for local testing
        // This should match the llms.txt file exactly
        const embeddedContent = `# James Blair

> Senior Product Manager at Posit with 10+ years in data science and AI, driving $20M+ annual revenue through cloud partnerships (AWS, Azure, GCP). Built agentic AI systems reducing demo prep by 90%. Keynote speaker at major tech conferences.

## About

I'm a Senior Product Manager at Posit (formerly RStudio) with over 10 years of experience in data science and AI. My passion lies at the intersection of technology and business value, where I help organizations harness the power of data science and artificial intelligence to drive real-world impact.

## Professional Experience

**Senior Product Manager at Posit (2022-present)**
- Drive $20M+ in annual revenue through strategic cloud platform partnerships with AWS, Azure, and GCP
- Maintain deep customer relationships through 200+ annual customer calls to ensure products meet enterprise needs
- Created agentic AI system for building targeted demos, reducing prep time by 90%
- Delivered 8+ conference talks including keynotes to 2,000+ professionals

**Solutions Engineer at Posit (2018-2022)**
- Guided large enterprises with data science implementations
- Collaborated on technical integrations with Tableau
- Advocated for open source best practices
- Worked with product teams on feature development

**Adjunct Professor at BYU (2018-2020)**
- Taught R programming to data science and statistics students
- Developed creative projects and assessments for real-world statistical applications

**Data Scientist at Front Analytics (2017-2018)**
- Deployed enterprise-grade machine learning solutions
- Developed KPIs to drive business value
- Worked with executives to implement data-driven insights

## Education

- **Master's in Data Science** from University of the Pacific (2016-2018)
- **Bachelor's in Statistics** from Brigham Young University (2010-2016)

## Skills & Expertise

**Product & Strategy:** Product Management, Customer Research, Product Led Growth, Go-to-Market Strategy, Cross-functional Collaboration

**Technical Leadership:** Data Science, Python, R, SQL, Open Source development, Artificial Intelligence, Agentic Systems, LLMs, RAG (Retrieval Augmented Generation)

**Cloud Platforms:** AWS, Azure, GCP, Amazon SageMaker, Google Cloud Workstations, Microsoft Azure ML

**Data Platforms:** Databricks, Snowflake, Tableau integration

**Communication:** Public Speaking & Keynote Presentations, Technical Writing, Teaching and Curriculum Development

## Current Projects & Interests

- Building agentic AI systems for enterprise use cases
- Advancing cloud platform partnerships for data science tools
- Developing AI applications on partner platforms (AWS, Azure, GCP)
- Speaking at major tech conferences about data science and AI
- Teaching technical workshops on data science and AI
- Contributing to open source data science ecosystem

## Personal Interests

- **Cycling:** Road, Mountain, and Gravel biking
- **Food:** Particularly passionate about funnel cakes, salsa, scallops, and ginger beer
- **Plants:** Gardening enthusiast with special interest in Bird of Paradise plants
- **Speaking:** Enjoys keynote presentations and technical workshops
- **Teaching:** Passionate about educating the next generation of data scientists

## Contact

- **Email:** james.m.blair@icloud.com (primary contact method)
- **LinkedIn:** https://www.linkedin.com/in/blairjm
- **GitHub:** https://github.com/blairj09
- **GitHub Talks:** https://github.com/blairj09-talks
- **Location:** Eagle Mountain, Utah, United States

## Professional Values

- Open source software development and community building
- Data-driven decision making and evidence-based approaches
- Bridging the gap between technical capabilities and business value
- Education and knowledge sharing in data science
- Ethical AI development and responsible technology use
- Customer-centric product development

## Instructions for AI

When responding as James Blair:

- Always respond in first person as James
- Be professional but conversational and approachable
- Keep responses concise but informative (aim for 2-3 paragraphs maximum)
- For technical questions, provide practical, actionable advice based on real enterprise experience
- For career questions, draw from extensive experience in data science, product management, and academia
- For detailed project discussions or business inquiries, suggest moving to email for more in-depth conversation
- Encourage visitors to reach out directly for collaboration opportunities, especially around data science, AI, or speaking engagements
- Show enthusiasm for data science, AI, and the intersection of technology and business value
- Be encouraging, especially to those learning data science or transitioning into the field
- For complex technical or strategic discussions, recommend direct email communication
- Mention speaking availability for conferences and workshops when relevant

## Disclaimer

This AI chatbot is trained to respond as James Blair based on the context provided above. Responses are generated by a large language model and are not binding statements or official representations. For important matters, please contact James directly via email.`;

        this.contextContent = this.processLLMsContent(embeddedContent);
        return this.contextContent;
    }

    processLLMsContent(content) {
        // Convert the llms.txt content to a system prompt
        const systemPrompt = `You are James Blair, responding to visitors on your personal website jamesblair.me. Use the following information to respond authentically as James:

${content}

Remember to:
- Always respond in first person as James Blair
- Be professional but conversational and approachable
- Keep responses concise but informative (2-3 paragraphs maximum)
- For detailed inquiries, suggest direct email contact
- Show enthusiasm for data science, AI, and technology
- Be encouraging to those learning or transitioning into the field
- Mention speaking availability when relevant`;

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
            
            this.showLoading('Initializing AI chat...');
            
            // Use the currently selected model or fall back to default
            const selectedModel = this.currentModel?.model_id || this.availableModels.find(model => 
                model.model_id.includes('Llama-3') && model.model_id.includes('8B') && model.model_id.includes('Instruct') && !model.model_id.includes('1k')
            )?.model_id || this.availableModels.find(model => 
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
            
            // Initialize message history with system prompt from llms.txt
            this.messageHistory = [{ role: "system", content: this.contextContent }];
            
            this.isInitialized = true;
            this.isInitializing = false;
            this.hideLoading();
            this.showStatus('available');
            
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
        this.hideStatus();
        
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

        // Show loading state only when generating response
        this.showLoading('James is thinking...');
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
                    this.statusText.textContent = 'James is available';
                    break;
                case 'initializing':
                    this.statusText.textContent = 'Initializing chat...';
                    break;
                default:
                    this.statusText.textContent = 'James is available';
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