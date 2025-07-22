// Claude API Chat Implementation
// Enhanced with improved UX features from Web-LLM implementation

class ClaudeChat {
    constructor() {
        this.conversationHistory = [];
        this.isInitialized = false;
        this.maxMessages = 10;
        
        // Reset session on each page load for better UX
        this.resetSession();
        
        this.sessionId = this.getOrCreateSessionId();
        this.messageCount = this.getSessionMessageCount();
        this.init();
    }

    // Session management methods
    getOrCreateSessionId() {
        let sessionId = sessionStorage.getItem('claude-chat-session-id');
        if (!sessionId) {
            sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
            sessionStorage.setItem('claude-chat-session-id', sessionId);
            console.log('Created new session:', sessionId);
        } else {
            console.log('Using existing session:', sessionId);
        }
        return sessionId;
    }

    getSessionMessageCount() {
        const count = sessionStorage.getItem('claude-chat-message-count');
        const parsed = count ? parseInt(count, 10) : 0;
        console.log('Retrieved message count:', parsed);
        return parsed;
    }

    incrementMessageCount() {
        this.messageCount++;
        sessionStorage.setItem('claude-chat-message-count', this.messageCount.toString());
        console.log(`Message count incremented to: ${this.messageCount}/${this.maxMessages}`);
    }

    isSessionLimitReached() {
        return this.messageCount >= this.maxMessages;
    }

    resetSession() {
        // Clear existing session data
        sessionStorage.removeItem('claude-chat-session-id');
        sessionStorage.removeItem('claude-chat-message-count');
        sessionStorage.removeItem('claude-chat-session-timestamp');
        
        // Reset instance variables (new session will be created when needed)
        this.sessionId = null;
        this.messageCount = 0;
        console.log('Session reset');
    }

    handleSessionExpiration() {
        const sessionTimestamp = sessionStorage.getItem('claude-chat-session-timestamp');
        const currentTime = Date.now();
        
        // If no timestamp, this is a fresh start
        if (!sessionTimestamp) {
            sessionStorage.setItem('claude-chat-session-timestamp', currentTime.toString());
            return;
        }
        
        // Reset session if older than 30 minutes
        const sessionAge = currentTime - parseInt(sessionTimestamp);
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (sessionAge > thirtyMinutes) {
            console.log('Session expired (30+ minutes old), resetting');
            this.resetSession();
            sessionStorage.setItem('claude-chat-session-timestamp', currentTime.toString());
        } else {
            console.log(`Session still valid (${Math.round(sessionAge / 1000 / 60)} minutes old)`);
        }
    }

    init() {
        // Get DOM elements
        this.chatMessages = document.getElementById('chat-messages');
        this.chatInput = document.getElementById('chat-input');
        this.sendButton = document.getElementById('send-message');
        this.loadingIndicator = document.getElementById('chat-loading');
        this.statusIndicator = document.getElementById('chat-status');

        if (!this.chatMessages || !this.chatInput || !this.sendButton) {
            console.error('Required chat elements not found');
            return;
        }

        // Bind event listeners
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Enhanced input handling with auto-resize and send button updates
        this.chatInput.addEventListener('input', () => {
            this.adjustInputHeight();
            this.updateSendButton();
        });

        // Enable input immediately - no model loading needed
        this.chatInput.disabled = false;
        this.sendButton.disabled = false;
        
        // Show initial message count status
        this.updateMessageCountDisplay();
        this.updateSendButton(); // Initialize send button state
        
        this.isInitialized = true;
        console.log(`Claude chat initialized successfully. Session: ${this.sessionId}, Messages: ${this.messageCount}/${this.maxMessages}`);
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        // Check session limit
        if (this.isSessionLimitReached()) {
            this.showSessionLimitReached();
            return;
        }

        // Disable input while processing
        this.chatInput.disabled = true;
        this.sendButton.disabled = true;
        
        // Add user message to chat
        this.addMessage('user', message);
        
        // Clear input and reset height
        this.chatInput.value = '';
        this.adjustInputHeight();
        
        // Show loading state
        this.showLoading(true);

        try {
            // Send to Claude API via edge function
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    conversationHistory: this.conversationHistory.slice(-10), // Last 10 messages for context
                    sessionId: this.sessionId
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Network error' }));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.message) {
                throw new Error('Invalid response format');
            }

            // Add AI response to chat
            this.addMessage('assistant', data.message);

            // Increment message count (user message counts toward limit)
            this.incrementMessageCount();

            // Update message count display
            this.updateMessageCountDisplay();

            // Update conversation history
            this.conversationHistory.push(
                { role: 'user', content: message },
                { role: 'assistant', content: data.message }
            );

            // Keep conversation history reasonable size
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-16);
            }

        } catch (error) {
            console.error('Chat error:', error);
            this.handleResponseError(error);
        } finally {
            // Re-enable input
            this.showLoading(false);
            this.chatInput.disabled = false;
            this.updateSendButton();
            this.chatInput.focus();
        }
    }

    addMessage(role, content, type = 'normal') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message${type === 'error' ? ' error-message' : ''}`;
        messageDiv.setAttribute('role', 'article');
        messageDiv.setAttribute('aria-label', `${role} message`);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Render markdown for assistant messages, plain text for user messages
        if (role === 'assistant' && typeof marked !== 'undefined') {
            // Configure marked for security and styling
            const renderer = new marked.Renderer();
            
            // Customize link rendering for security
            renderer.link = (href, title, text) => {
                const titleAttr = title ? ` title="${title}"` : '';
                return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
            };
            
            // Configure marked options
            marked.setOptions({
                renderer: renderer,
                gfm: true, // GitHub Flavored Markdown
                breaks: true, // Convert \n to <br>
                sanitize: false, // We'll handle XSS protection with CSP
                silent: true // Don't throw on error
            });
            
            try {
                contentDiv.innerHTML = marked.parse(content);
            } catch (error) {
                console.warn('Markdown parsing failed, falling back to plain text:', error);
                contentDiv.textContent = content;
            }
        } else {
            contentDiv.textContent = content;
        }

        messageDiv.appendChild(contentDiv);
        this.chatMessages.appendChild(messageDiv);

        // Scroll to bottom
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;

        // Enhanced accessibility - announce new AI messages to screen readers
        if (role === 'assistant') {
            this.announceMessage(content);
        }
    }


    // Enhanced accessibility method from Web-LLM implementation
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

    showLoading(show) {
        if (show) {
            this.loadingIndicator?.classList.remove('hidden');
            this.statusIndicator?.classList.add('hidden');
        } else {
            this.loadingIndicator?.classList.add('hidden');
            this.showStatus('Ready', 'ready');
        }
    }

    showStatus(text, type) {
        if (!this.statusIndicator) return;
        
        const statusText = this.statusIndicator.querySelector('.status-text');
        const statusIndicator = this.statusIndicator.querySelector('.status-indicator');
        
        if (statusText) statusText.textContent = text;
        if (statusIndicator) {
            statusIndicator.className = `status-indicator status-${type}`;
        }
        
        this.statusIndicator.classList.remove('hidden');
    }

    showSessionLimitReached() {
        const limitMessage = `You've reached the 10 message limit for this session. This helps keep costs manageable while still allowing you to learn about James's background and experience. 
        
To continue chatting, please refresh the page to start a new session.`;
        
        this.addMessage('assistant', limitMessage, 'info');
        
        // Disable input
        this.chatInput.disabled = true;
        this.sendButton.disabled = true;
        this.chatInput.placeholder = "Session limit reached - refresh to continue";
        
        this.showStatus(`Session limit reached (${this.messageCount}/${this.maxMessages})`, 'limit');
    }

    // Enhanced error handling from Web-LLM implementation
    handleResponseError(error) {
        let errorMessage = 'Sorry, I encountered an error. Please try again.';
        
        if (error.message.includes('Rate limited')) {
            errorMessage = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('temporarily unavailable')) {
            errorMessage = 'The AI service is temporarily unavailable. Please try again in a few moments.';
        } else if (error.message.includes('about James Blair')) {
            errorMessage = error.message; // Use the specific content filtering message
        } else if (error.message.includes('network') || error.message.includes('connection')) {
            errorMessage = 'Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'The request timed out. Please try asking your question again.';
        }
        
        this.addMessage('assistant', errorMessage, 'error');
    }

    // Add method to show remaining messages in status
    updateMessageCountDisplay() {
        const remaining = this.maxMessages - this.messageCount;
        console.log(`Updating display: ${this.messageCount} used, ${remaining} remaining`);
        
        if (remaining <= 3 && remaining > 0) {
            this.showStatus(`${remaining} messages remaining`, 'warning');
        } else if (remaining > 0) {
            this.showStatus('Ready', 'ready');
        }
    }

    // Enhanced input handling from Web-LLM implementation
    updateSendButton(isLoading = false) {
        if (!this.sendButton) return;
        
        const hasText = this.chatInput && this.chatInput.value.trim().length > 0;
        
        this.sendButton.disabled = isLoading || !hasText || this.chatInput?.disabled;
        this.sendButton.textContent = isLoading ? 'Sending...' : 'Send';
    }

    adjustInputHeight() {
        if (!this.chatInput) return;
        
        this.chatInput.style.height = 'auto';
        this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    }

    // Public methods for testing and external use
    isReady() {
        return this.isInitialized;
    }

    getHistory() {
        return [...this.conversationHistory];
    }

    clearHistory() {
        this.conversationHistory = [];
        
        // Clear visual messages except the first two (disclaimer and welcome)
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach((message, index) => {
            if (index > 1) { // Keep the first two messages (disclaimer and welcome)
                message.remove();
            }
        });
        
        // Reset session
        this.resetSession();
        this.updateMessageCountDisplay();
    }
}

// Initialize chat when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.claudeChat = new ClaudeChat();
    });
} else {
    window.claudeChat = new ClaudeChat();
}

// Handle page visibility changes for better resource management
document.addEventListener('visibilitychange', function() {
    if (document.hidden && window.claudeChat) {
        console.log('Page hidden, chat operations paused');
    } else if (window.claudeChat) {
        console.log('Page visible, chat operations resumed');
    }
});

// Export for testing or external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClaudeChat;
}