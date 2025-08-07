class SXUDOChat {
    constructor() {
        this.username = localStorage.getItem('sxudo_username') || '';
        this.personality = localStorage.getItem('sxudo_personality') || 'supportive';
        this.mood = localStorage.getItem('sxudo_mood') || 'neutral';
        this.isTyping = false;
        this.isRecording = false;
        this.recognition = null;
        this.voiceIndicator = null;
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

        // Image and voice functionality
        this.imageBtn.addEventListener('click', () => this.uploadImage());
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceRecording());

        // Create hidden file input for images
        this.imageInput = document.createElement('input');
        this.imageInput.type = 'file';
        this.imageInput.accept = 'image/*';
        this.imageInput.style.display = 'none';
        document.body.appendChild(this.imageInput);

        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
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

    // Image upload functionality
    uploadImage() {
        this.imageInput.click();
    }

    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB.');
            return;
        }

        try {
            // Convert to base64
            const base64 = await this.fileToBase64(file);

            // Add image message to chat
            this.addImageMessage('user', `📸 Uploaded: ${file.name}`, base64);

            // Show typing indicator
            this.showTyping();

            // Send to AI for analysis using XMLHttpRequest to avoid body stream issues
            const result = await this.makeRequest('/api/image-chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: base64,
                    message: `Please analyze this image: ${file.name}`,
                    username: this.username,
                    personality: this.personality,
                    mood: this.mood
                }),
                timeout: 30000
            });

            // Hide typing indicator
            this.hideTyping();

            if (result.success && result.data.reply) {
                this.addMessage('ai', result.data.reply, result.data.emotion || '🔍');
            } else {
                this.addMessage('ai', 'Sorry, I had trouble analyzing that image. Please try again.', '😕');
            }

        } catch (error) {
            console.error('Error uploading image:', error);
            this.hideTyping();
            this.addMessage('ai', 'Sorry, there was an error processing your image.', '😕');
        }

        // Clear the input
        event.target.value = '';
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    addImageMessage(type, content, imageData) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="sender">${type === 'user' ? this.username : 'SXUDO'} 📸</span>
                <span class="timestamp">${timestamp}</span>
            </div>
            <div class="message-content">
                <img src="${imageData}" alt="Uploaded image" style="max-width: 100%; border-radius: 8px; margin-bottom: 0.5rem;">
                <p>${content}</p>
            </div>
        `;

        this.chatHistory.appendChild(messageDiv);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }

    // Voice recording functionality
    toggleVoiceRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    async startRecording() {
        try {
            // Check if browser supports speech recognition
            if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
                alert('Speech recognition is not supported in your browser.');
                return;
            }

            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();

            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                this.voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
                this.showVoiceIndicator();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.userInput.value = transcript;
                this.hideVoiceIndicator();
                // Auto-send the message
                this.sendMessage();
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.stopRecording();
                this.hideVoiceIndicator();
            };

            this.recognition.onend = () => {
                this.stopRecording();
                this.hideVoiceIndicator();
            };

            this.recognition.start();

        } catch (error) {
            console.error('Error starting voice recognition:', error);
            alert('Unable to start voice recording. Please try again.');
        }
    }

    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
        }
        this.isRecording = false;
        this.voiceBtn.style.background = '';
        this.voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        this.hideVoiceIndicator();
    }

    showVoiceIndicator() {
        // Create voice recording indicator
        if (!this.voiceIndicator) {
            this.voiceIndicator = document.createElement('div');
            this.voiceIndicator.className = 'voice-recording-indicator';
            this.voiceIndicator.innerHTML = `
                <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                           background: rgba(0,0,0,0.8); color: white; padding: 1rem 2rem;
                           border-radius: 10px; z-index: 2000; text-align: center;">
                    <div style="margin-bottom: 0.5rem;">🎤 Listening...</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">Speak now</div>
                </div>
            `;
            document.body.appendChild(this.voiceIndicator);
        }
    }

    hideVoiceIndicator() {
        if (this.voiceIndicator) {
            this.voiceIndicator.remove();
            this.voiceIndicator = null;
        }
    }

    // Helper method using XMLHttpRequest to avoid fetch response body issues
    makeRequest(url, options) {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', url);

            // Set headers
            if (options.headers) {
                Object.keys(options.headers).forEach(key => {
                    xhr.setRequestHeader(key, options.headers[key]);
                });
            }

            // Set timeout
            if (options.timeout) {
                xhr.timeout = options.timeout;
            }

            xhr.onload = function() {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve({
                        success: xhr.status >= 200 && xhr.status < 300,
                        status: xhr.status,
                        data: data
                    });
                } catch (parseError) {
                    resolve({
                        success: false,
                        status: xhr.status,
                        data: { error: `Invalid JSON response: ${xhr.responseText.substring(0, 200)}...` }
                    });
                }
            };

            xhr.onerror = function() {
                reject(new Error('Network error'));
            };

            xhr.ontimeout = function() {
                reject(new Error('Request timeout'));
            };

            // Send the request
            xhr.send(options.body || null);
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new SXUDOChat();
});
