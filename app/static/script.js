// Enhanced SXUDO Frontend Logic
class SXUDOChat {
    constructor() {
        this.username = localStorage.getItem('sxudo_username') || 'default';
        this.isRecording = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.currentEmotion = '😊';
        this.autoSpeak = true;
        this.voiceSpeed = 1.0;
        this.showEmotions = true;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSettings();
        this.setupSpeechRecognition();
        this.setupKeyboardShortcuts();
        
        // Load conversation history and check health
        this.loadConversationHistory();
        this.checkHealth();
    }
    
    initializeElements() {
        // Chat elements
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.statusText = document.getElementById('statusText');
        this.emotionIndicator = document.getElementById('emotionIndicator');
        
        // Action buttons
        this.voiceBtn = document.getElementById('voiceBtn');
        this.imageBtn = document.getElementById('imageBtn');
        this.imageInput = document.getElementById('imageInput');
        this.generateImageBtn = document.getElementById('generateImageBtn');
        this.clearChatBtn = document.getElementById('clearChatBtn');
        
        // Settings
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsPanel = document.getElementById('settingsPanel');
        this.closeSettings = document.getElementById('closeSettings');
        this.usernameInput = document.getElementById('usernameInput');
        this.voiceSpeedSlider = document.getElementById('voiceSpeed');
        this.voiceSpeedValue = document.getElementById('voiceSpeedValue');
        this.autoSpeakCheckbox = document.getElementById('autoSpeak');
        this.showEmotionsCheckbox = document.getElementById('showEmotions');

        // Ollama configuration
        this.ollamaHost = document.getElementById('ollamaHost');
        this.ollamaPort = document.getElementById('ollamaPort');
        this.connectOllama = document.getElementById('connectOllama');
        this.ollamaStatus = document.getElementById('ollamaStatus');
        
        // Indicators
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.voiceIndicator = document.getElementById('voiceIndicator');
    }
    
    setupEventListeners() {
        // Message sending
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Voice input
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        
        // Image upload
        this.imageBtn.addEventListener('click', () => this.imageInput.click());
        this.imageInput.addEventListener('change', (e) => this.handleImageUpload(e));
        
        // Image generation
        this.generateImageBtn.addEventListener('click', () => this.generateImage());
        
        // Settings
        this.settingsBtn.addEventListener('click', () => this.toggleSettings());
        this.closeSettings.addEventListener('click', () => this.toggleSettings());
        this.clearChatBtn.addEventListener('click', () => this.clearChat());
        
        // Settings changes
        this.usernameInput.addEventListener('change', () => this.updateUsername());
        this.voiceSpeedSlider.addEventListener('input', () => this.updateVoiceSpeed());
        this.autoSpeakCheckbox.addEventListener('change', () => this.updateAutoSpeak());
        this.showEmotionsCheckbox.addEventListener('change', () => this.updateShowEmotions());

        // Ollama configuration
        this.connectOllama.addEventListener('click', () => this.connectToOllama());
        
        // Real-time input analysis
        this.messageInput.addEventListener('input', () => this.analyzeInputEmotion());
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + M - Focus message input
            if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
                e.preventDefault();
                this.messageInput.focus();
            }
            
            // Ctrl/Cmd + R - Toggle voice recording
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.toggleVoiceInput();
            }
            
            // Ctrl/Cmd + S - Speak last message
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.speakLastMessage();
            }
        });
    }
    
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => {
                this.isRecording = true;
                this.voiceBtn.classList.add('active');
                this.voiceIndicator.classList.remove('hidden');
                this.updateStatus('Listening...');
            };
            
            this.recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                
                if (finalTranscript) {
                    this.messageInput.value = finalTranscript;
                    this.analyzeInputEmotion();
                }
            };
            
            this.recognition.onend = () => {
                this.isRecording = false;
                this.voiceBtn.classList.remove('active');
                this.voiceIndicator.classList.add('hidden');
                this.updateStatus('Ready to chat');
            };
            
            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.isRecording = false;
                this.voiceBtn.classList.remove('active');
                this.voiceIndicator.classList.add('hidden');
                this.updateStatus('Voice input error');
            };
        } else {
            this.voiceBtn.style.display = 'none';
            console.warn('Speech recognition not supported');
        }
    }
    
    initializeSettings() {
        this.usernameInput.value = this.username;
        this.voiceSpeedSlider.value = this.voiceSpeed;
        this.voiceSpeedValue.textContent = this.voiceSpeed;
        this.autoSpeakCheckbox.checked = this.autoSpeak;
        this.showEmotionsCheckbox.checked = this.showEmotions;
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;
        
        // Add user message to chat
        this.addMessage(message, 'user', this.currentEmotion);
        this.messageInput.value = '';
        this.currentEmotion = '😊';
        this.updateEmotionIndicator();
        
        // Show loading
        this.showLoading(true);
        this.updateStatus('SXUDO is thinking...');
        
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    username: this.username,
                    emotion: this.currentEmotion
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Add assistant response
            this.addMessage(data.reply, 'assistant', data.emotion);
            
            // Speak response if enabled
            if (this.autoSpeak) {
                this.speakText(data.reply);
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.addMessage('Sorry, I encountered an error. Please try again.', 'assistant', '😕');
        } finally {
            this.showLoading(false);
            this.updateStatus('Ready to chat');
            this.messageInput.focus();
        }
    }
    
    addMessage(content, type, emotion = '😊', hasImage = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = type === 'user' ? '👤' : '🧠';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('p');
        messageText.textContent = content;
        messageContent.appendChild(messageText);
        
        if (this.showEmotions || type === 'assistant') {
            const messageMeta = document.createElement('div');
            messageMeta.className = 'message-meta';
            
            const emotionBadge = document.createElement('span');
            emotionBadge.className = 'emotion-badge';
            emotionBadge.textContent = emotion;
            
            const timestamp = document.createElement('span');
            timestamp.textContent = new Date().toLocaleTimeString();
            
            messageMeta.appendChild(emotionBadge);
            messageMeta.appendChild(timestamp);
            
            if (type === 'assistant') {
                const speakBtn = document.createElement('button');
                speakBtn.className = 'speak-btn';
                speakBtn.textContent = '🔊';
                speakBtn.title = 'Speak this message';
                speakBtn.addEventListener('click', () => this.speakText(content));
                messageMeta.appendChild(speakBtn);
            }
            
            messageContent.appendChild(messageMeta);
        }
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }
    
    async handleImageUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const message = this.messageInput.value.trim() || 'Please analyze this image';
        
        // Show image preview
        const imagePreview = document.createElement('img');
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.className = 'image-preview';
        
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user';
        
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        avatar.textContent = '👤';
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.appendChild(imagePreview);
        
        const messageText = document.createElement('p');
        messageText.textContent = message;
        messageContent.appendChild(messageText);
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        this.messageInput.value = '';
        this.showLoading(true);
        this.updateStatus('Analyzing image...');
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            formData.append('message', message);
            formData.append('username', this.username);
            
            const response = await fetch('/api/image-chat', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.addMessage(data.reply, 'assistant', '📸');
            
            if (this.autoSpeak) {
                this.speakText(data.reply);
            }
            
        } catch (error) {
            console.error('Error uploading image:', error);
            this.addMessage('Sorry, I encountered an error analyzing the image.', 'assistant', '😕');
        } finally {
            this.showLoading(false);
            this.updateStatus('Ready to chat');
            event.target.value = ''; // Reset file input
        }
    }
    
    async generateImage() {
        const prompt = this.messageInput.value.trim();
        if (!prompt) {
            this.updateStatus('Please enter a description for the image');
            return;
        }
        
        this.addMessage(`Generate image: ${prompt}`, 'user', '🎨');
        this.messageInput.value = '';
        
        this.showLoading(true);
        this.updateStatus('Generating image...');
        
        try {
            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('username', this.username);
            
            const response = await fetch('/api/generate-image', {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.addMessage(data.reply, 'assistant', '🎨');
            
        } catch (error) {
            console.error('Error generating image:', error);
            this.addMessage('Sorry, I encountered an error generating the image.', 'assistant', '😕');
        } finally {
            this.showLoading(false);
            this.updateStatus('Ready to chat');
        }
    }
    
    toggleVoiceInput() {
        if (!this.recognition) {
            this.updateStatus('Voice input not supported');
            return;
        }
        
        if (this.isRecording) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }
    
    speakText(text) {
        if (!this.synthesis) return;
        
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = this.voiceSpeed;
        utterance.pitch = 1;
        utterance.volume = 0.8;
        
        this.synthesis.speak(utterance);
    }
    
    speakLastMessage() {
        const lastAssistantMessage = this.chatMessages.querySelector('.message.assistant:last-of-type p');
        if (lastAssistantMessage) {
            this.speakText(lastAssistantMessage.textContent);
        }
    }
    
    analyzeInputEmotion() {
        const text = this.messageInput.value.toLowerCase();
        
        if (text.includes('happy') || text.includes('great') || text.includes('awesome')) {
            this.currentEmotion = '😊';
        } else if (text.includes('sad') || text.includes('upset') || text.includes('disappointed')) {
            this.currentEmotion = '😢';
        } else if (text.includes('angry') || text.includes('mad') || text.includes('frustrated')) {
            this.currentEmotion = '����';
        } else if (text.includes('worried') || text.includes('nervous') || text.includes('anxious')) {
            this.currentEmotion = '😰';
        } else if (text.includes('confused') || text.includes('lost')) {
            this.currentEmotion = '😕';
        } else {
            this.currentEmotion = '😊';
        }
        
        this.updateEmotionIndicator();
    }
    
    updateEmotionIndicator() {
        this.emotionIndicator.textContent = this.currentEmotion;
    }
    
    toggleSettings() {
        this.settingsPanel.classList.toggle('hidden');
    }
    
    async clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
            try {
                const response = await fetch(`/api/memory/${this.username}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    // Clear chat messages except welcome message
                    const messages = this.chatMessages.querySelectorAll('.message:not(.welcome-message)');
                    messages.forEach(msg => msg.remove());
                    this.updateStatus('Chat cleared');
                } else {
                    this.updateStatus('Error clearing chat');
                }
            } catch (error) {
                console.error('Error clearing chat:', error);
                this.updateStatus('Error clearing chat');
            }
        }
    }
    
    async loadConversationHistory() {
        try {
            const response = await fetch(`/api/memory/${this.username}`);
            if (response.ok) {
                const memory = await response.json();
                const history = memory.history || [];
                
                // Load last few messages
                history.slice(-5).forEach(entry => {
                    this.addMessage(entry.user, 'user', entry.emotion || '😊');
                    this.addMessage(entry.assistant, 'assistant', entry.emotion || '😊');
                });
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
        }
    }
    
    updateUsername() {
        this.username = this.usernameInput.value || 'default';
        localStorage.setItem('sxudo_username', this.username);
    }
    
    updateVoiceSpeed() {
        this.voiceSpeed = parseFloat(this.voiceSpeedSlider.value);
        this.voiceSpeedValue.textContent = this.voiceSpeed.toFixed(1);
    }
    
    updateAutoSpeak() {
        this.autoSpeak = this.autoSpeakCheckbox.checked;
    }
    
    updateShowEmotions() {
        this.showEmotions = this.showEmotionsCheckbox.checked;
    }

    async connectToOllama() {
        const host = this.ollamaHost.value.trim();
        const port = parseInt(this.ollamaPort.value) || 11434;

        if (!host) {
            this.showOllamaStatus('Please enter your computer\'s IP address', 'error');
            return;
        }

        this.showOllamaStatus('Connecting...', 'info');
        this.connectOllama.disabled = true;

        try {
            const response = await fetch('/api/configure-ollama', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    host: host,
                    port: port
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                } catch {
                    errorData = { error: `HTTP ${response.status}: ${errorText}` };
                }

                if (response.status === 400) {
                    this.showOllamaStatus(`❌ ${errorData.error}\n💡 ${errorData.suggestion || 'Make sure Ollama is running and accessible'}`, 'error');
                } else {
                    this.showOllamaStatus(`❌ Connection failed: ${errorData.error}`, 'error');
                }
                return;
            }

            const data = await response.json();

            if (data.success) {
                this.showOllamaStatus(`✅ Connected! Found models: ${data.models.join(', ')}`, 'success');
                // Refresh health status
                setTimeout(() => this.checkHealth(), 1000);
            } else {
                this.showOllamaStatus(`❌ ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Connection error:', error);
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                this.showOllamaStatus(`❌ Network error: Cannot reach ${host}:${port}\n💡 Check if the IP address is correct and Ollama is running`, 'error');
            } else {
                this.showOllamaStatus(`❌ Connection failed: ${error.message}`, 'error');
            }
        } finally {
            this.connectOllama.disabled = false;
        }
    }

    showOllamaStatus(message, type) {
        // Handle multi-line messages
        const lines = message.split('\n');
        this.ollamaStatus.innerHTML = '';

        lines.forEach((line, index) => {
            const p = document.createElement('p');
            p.textContent = line;
            if (index > 0) p.style.marginTop = '5px';
            this.ollamaStatus.appendChild(p);
        });

        this.ollamaStatus.className = `status-message ${type}`;
        this.ollamaStatus.style.display = 'block';

        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.ollamaStatus.style.display = 'none';
            }, 5000);
        }
    }

    async checkHealth() {
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            console.log('Health check:', health);

            if (health.ollama_available) {
                this.updateStatus('🤖 AI Mode Active - Connected to Ollama');
            } else {
                this.updateStatus('📝 Demo Mode - AI not connected');
            }
        } catch (error) {
            console.error('Health check failed:', error);
        }
    }
    
    updateStatus(message) {
        this.statusText.textContent = message;
        
        // Auto-clear status after 3 seconds
        setTimeout(() => {
            if (this.statusText.textContent === message) {
                this.statusText.textContent = 'Ready to chat';
            }
        }, 3000);
    }
    
    showLoading(show) {
        if (show) {
            this.loadingIndicator.classList.remove('hidden');
            this.sendBtn.disabled = true;
        } else {
            this.loadingIndicator.classList.add('hidden');
            this.sendBtn.disabled = false;
        }
    }
    
    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
}

// Health check and initialization
async function checkHealth() {
    try {
        const response = await fetch('/api/health');
        const health = await response.json();
        console.log('SXUDO Health:', health);
        
        if (!health.ollama_available) {
            console.warn('Ollama not available:', health.error);
        }
    } catch (error) {
        console.error('Health check failed:', error);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const sxudo = new SXUDOChat();
    checkHealth();
    
    // Make sxudo globally available for debugging
    window.sxudo = sxudo;
});

// Service worker registration (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
