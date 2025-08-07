class SXUDOChat {
    constructor() {
        this.username = localStorage.getItem('sxudo_username') || '';
        this.personality = localStorage.getItem('sxudo_personality') || 'supportive';
        this.mood = localStorage.getItem('sxudo_mood') || 'neutral';
        this.isTyping = false;
        this.currentTheme = localStorage.getItem('sxudo_theme') || 'dark';
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeTheme();
        this.loadConversationHistory();
        
        // Check if user has completed setup
        if (this.username) {
            this.showChatView();
        } else {
            this.showProfileView();
        }
    }
    
    initializeElements() {
        // Views
        this.profileView = document.getElementById('profile-view');
        this.chatView = document.getElementById('chat-view');
        
        // Profile elements
        this.usernameInput = document.getElementById('username');
        this.personalitySelect = document.getElementById('personality');
        this.moodSelect = document.getElementById('mood');
        this.startBtn = document.getElementById('start-btn');
        
        // Chat elements
        this.chatHistory = document.getElementById('chat-history');
        this.userInput = document.getElementById('user-input');
        this.sendBtn = document.getElementById('send-btn');
        this.displayUsername = document.getElementById('display-username');
        this.typingIndicator = document.getElementById('typing-indicator');
        
        // Control buttons
        this.themeToggle = document.getElementById('theme-toggle');
        this.clearChat = document.getElementById('clear-chat');
        this.settingsBtn = document.getElementById('settings-btn');
        this.imageBtn = document.getElementById('image-btn');
        this.voiceBtn = document.getElementById('voice-btn');
        this.emojiBtn = document.getElementById('emoji-btn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settings-modal');
        this.closeModal = document.getElementById('close-modal');
        this.personalitySetting = document.getElementById('personality-setting');
        this.resetBtn = document.getElementById('reset-btn');
    }
    
    setupEventListeners() {
        // Profile setup
        this.startBtn.addEventListener('click', () => this.completeSetup());
        this.usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.completeSetup();
        });
        
        // Chat interface
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Controls
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.clearChat.addEventListener('click', () => this.clearConversation());
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModal.addEventListener('click', () => this.closeSettings());
        this.resetBtn.addEventListener('click', () => this.resetAllData());
        
        // Settings changes
        this.personalitySetting.addEventListener('change', (e) => {
            this.personality = e.target.value;
            localStorage.setItem('sxudo_personality', this.personality);
        });
        
        // Theme selection
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme || e.target.closest('.theme-option').dataset.theme;
                this.setTheme(theme);
            });
        });
        
        // Close modal when clicking outside
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) this.closeSettings();
        });
    }
    
    completeSetup() {
        const username = this.usernameInput.value.trim();
        if (!username) {
            alert('Please enter your name');
            return;
        }
        
        this.username = username;
        this.personality = this.personalitySelect.value;
        this.mood = this.moodSelect.value;
        
        // Save to localStorage
        localStorage.setItem('sxudo_username', this.username);
        localStorage.setItem('sxudo_personality', this.personality);
        localStorage.setItem('sxudo_mood', this.mood);
        
        this.showChatView();
        this.addWelcomeMessage();
    }
    
    showProfileView() {
        this.profileView.classList.remove('hidden');
        this.chatView.classList.add('hidden');
        
        // Pre-fill if returning user
        if (this.username) this.usernameInput.value = this.username;
        this.personalitySelect.value = this.personality;
        this.moodSelect.value = this.mood;
    }
    
    showChatView() {
        this.profileView.classList.add('hidden');
        this.chatView.classList.remove('hidden');
        this.displayUsername.textContent = this.username;
        this.personalitySetting.value = this.personality;
    }
    
    addWelcomeMessage() {
        const welcomeMessages = {
            supportive: `Hello ${this.username}! I'm SXUDO, your supportive AI companion. I'm here to listen, understand, and help you through whatever you're facing. How are you feeling today?`,
            analytical: `Hello ${this.username}! I'm SXUDO, ready to analyze problems and think through solutions with you. What would you like to explore today?`,
            creative: `Hello ${this.username}! I'm SXUDO, your creative partner. Let's brainstorm, imagine, and create something amazing together! What's inspiring you today?`,
            humorous: `Hey there ${this.username}! I'm SXUDO, and I'm here to add some fun and laughs to your day. What's going on in your world?`
        };
        
        const message = welcomeMessages[this.personality] || welcomeMessages.supportive;
        this.addMessage('ai', message, '🧠');
    }
    
    async sendMessage() {
        const message = this.userInput.value.trim();
        if (!message) return;
        
        // Add user message
        this.addMessage('user', message, '👤');
        this.userInput.value = '';
        
        // Show typing indicator
        this.showTyping();
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    username: this.username,
                    personality: this.personality,
                    mood: this.mood
                })
            });
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTyping();
            
            if (data.reply) {
                this.addMessage('ai', data.reply, data.emotion || '🧠');
            } else {
                this.addMessage('ai', 'Sorry, I encountered an error. Please try again.', '😕');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTyping();
            this.addMessage('ai', 'Sorry, I\'m having trouble connecting right now. Please try again.', '😕');
        }
    }
    
    addMessage(type, content, emoji) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">${type === 'user' ? this.username : 'SXUDO'} ${emoji}</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        this.chatHistory.appendChild(messageDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
        
        // Save to memory
        this.saveMessageToHistory(type, content, emoji);
    }
    
    formatMessage(content) {
        // Basic formatting for better readability
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }
    
    showTyping() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    hideTyping() {
        this.isTyping = false;
        this.typingIndicator.classList.add('hidden');
    }
    
    saveMessageToHistory(type, content, emoji) {
        try {
            let history = JSON.parse(localStorage.getItem('sxudo_history') || '[]');
            history.push({
                type: type,
                content: content,
                emoji: emoji,
                timestamp: new Date().toISOString(),
                username: this.username
            });
            
            // Keep only last 100 messages
            if (history.length > 100) {
                history = history.slice(-100);
            }
            
            localStorage.setItem('sxudo_history', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving message to history:', error);
        }
    }
    
    loadConversationHistory() {
        try {
            const history = JSON.parse(localStorage.getItem('sxudo_history') || '[]');
            
            // Only load recent messages for current user
            const recentMessages = history
                .filter(msg => msg.username === this.username)
                .slice(-20); // Last 20 messages
            
            recentMessages.forEach(msg => {
                this.addMessageToUI(msg.type, msg.content, msg.emoji);
            });
            
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }
    
    addMessageToUI(type, content, emoji) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">${type === 'user' ? this.username : 'SXUDO'} ${emoji}</span>
            </div>
            <div class="message-content">${this.formatMessage(content)}</div>
        `;
        
        this.chatHistory.appendChild(messageDiv);
    }
    
    clearConversation() {
        if (confirm('Are you sure you want to clear this conversation?')) {
            this.chatHistory.innerHTML = '';
            // Remove only current user's messages
            try {
                let history = JSON.parse(localStorage.getItem('sxudo_history') || '[]');
                history = history.filter(msg => msg.username !== this.username);
                localStorage.setItem('sxudo_history', JSON.stringify(history));
                this.addWelcomeMessage();
            } catch (error) {
                console.error('Error clearing conversation:', error);
            }
        }
    }
    
    resetAllData() {
        if (confirm('This will delete all your conversations and reset your profile. Are you sure?')) {
            localStorage.removeItem('sxudo_username');
            localStorage.removeItem('sxudo_personality');
            localStorage.removeItem('sxudo_mood');
            localStorage.removeItem('sxudo_history');
            location.reload();
        }
    }
    
    initializeTheme() {
        this.setTheme(this.currentTheme);
    }
    
    setTheme(theme) {
        this.currentTheme = theme;
        localStorage.setItem('sxudo_theme', theme);
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        document.body.setAttribute('data-theme', theme);
        
        // Update theme toggle icon
        const icon = this.themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Update active theme option
        document.querySelectorAll('.theme-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${this.currentTheme}"]`)?.classList.add('active');
    }
    
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }
    
    openSettings() {
        this.settingsModal.classList.remove('hidden');
    }
    
    closeSettings() {
        this.settingsModal.classList.add('hidden');
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SXUDOChat();
});
