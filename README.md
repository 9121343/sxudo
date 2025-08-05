# 🧠 SXUDO - Emotionally Intelligent AI Assistant

**SXUDO** is a local, emotionally supportive AI chatbot that behaves like a real human friend with voice interaction, image understanding, and memory capabilities.

![SXUDO Interface](https://via.placeholder.com/800x400/6d28d9/ffffff?text=SXUDO+AI+Assistant)

## ✨ Features

### 🗣️ **Natural Conversations**
- Emotionally intelligent responses
- Context-aware chat with memory
- Personalized interactions with user names

### 🎤 **Voice Interaction**
- **Speech-to-Text**: Voice input with visual feedback
- **Text-to-Speech**: Automatic response reading
- Customizable voice speed and pitch
- Hands-free conversation support

### 💝 **Emotional Awareness**
- Real-time emotion detection from text
- Visual emotion indicators (😊😢😠😰😕)
- Emotionally contextualized responses

### 📸 **Image Understanding**
- Upload and analyze images
- AI-powered image description
- Visual conversation support

### 🎨 **Image Generation**
- Create images from text prompts
- Integrated with Stable Diffusion (SDXL)
- Creative visual assistance

### 🔒 **Privacy-First & Local**
- Fully offline operation
- No cloud API dependencies
- Local data storage
- Powered by Ollama

### 🎯 **Smart Features**
- Persistent chat history
- User preference storage
- Customizable settings
- Responsive mobile design
- Keyboard shortcuts

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- [Ollama](https://ollama.ai/) installed locally

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/sxudo-ai-assistant.git
cd sxudo-ai-assistant
```

2. **Install dependencies**
```bash
pip install -r requirements.txt
```

3. **Set up Ollama models**
```bash
# Install required models
ollama pull llama3      # For chat
ollama pull llava       # For image analysis
ollama pull sdxl        # For image generation

# Start Ollama service
ollama serve
```

4. **Run SXUDO**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

5. **Open your browser**
Navigate to `http://localhost:8000`

## 🎮 Usage

### Getting Started
1. Enter your name when prompted
2. Start chatting with SXUDO
3. Use voice input by clicking the microphone button
4. Upload images for analysis
5. Generate images with the paint brush button

### Keyboard Shortcuts
- `Ctrl/Cmd + M` - Focus message input
- `Ctrl/Cmd + R` - Start/stop voice recording
- `Ctrl/Cmd + S` - Speak last SXUDO message
- `Enter` - Send message

### Voice Commands
- Click 🎤 to start voice input
- Click 🔊 to hear responses
- Adjust voice settings in the settings panel

## ⚙️ Configuration

### Environment Variables
```bash
OLLAMA_HOST=http://localhost:11434  # Ollama server URL
```

### Models Used
- **Chat**: `llama3` - Primary conversation model
- **Vision**: `llava` - Image analysis and understanding
- **Image Generation**: `sdxl` - Stable Diffusion XL

## 🏗️ Architecture

```
SXUDO/
├── app/
│   ├── main.py              # FastAPI application
│   ├── static/
│   │   ├── style.css        # Enhanced UI styles
│   │   └── script.js        # Frontend logic & features
│   └── templates/
│       └── index.html       # Main interface
├── requirements.txt         # Python dependencies
└── README.md               # This file
```

## 🎨 Design Philosophy

SXUDO is designed to be:
- **Emotionally Intelligent**: Understands and responds to user emotions
- **Privacy-Focused**: All processing happens locally
- **User-Friendly**: Intuitive interface with voice and visual interaction
- **Extensible**: Modular architecture for easy enhancement
- **Accessible**: Keyboard shortcuts and voice alternatives

## 🤖 AI Models

### Conversation (LLaMA 3)
- Natural language understanding
- Context-aware responses
- Emotional intelligence
- Personality consistency

### Vision (LLaVA)
- Image analysis and description
- Visual question answering
- Content understanding

### Image Generation (SDXL)
- High-quality image creation
- Text-to-image generation
- Creative visual assistance

## 🛠️ Development

### Local Development
```bash
# Install development dependencies
pip install -r requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Adding Features
1. Backend: Extend `app/main.py` with new API endpoints
2. Frontend: Add functionality to `app/static/script.js`
3. Styling: Enhance UI in `app/static/style.css`

## 📱 Browser Support

- Chrome/Chromium (recommended for voice features)
- Firefox
- Safari
- Edge

## 🔧 Troubleshooting

### Common Issues

**Ollama Connection Failed**
```bash
# Check if Ollama is running
ollama list

# Start Ollama service
ollama serve
```

**Voice Features Not Working**
- Enable microphone permissions in browser
- Use HTTPS or localhost for security requirements
- Check browser compatibility (Chrome recommended)

**Models Not Found**
```bash
# Pull required models
ollama pull llama3
ollama pull llava
ollama pull sdxl
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** - Local AI model serving
- **LLaMA 3** - Conversation AI
- **LLaVA** - Vision AI
- **FastAPI** - Web framework
- **Builder.io** - Development platform

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section
- Review Ollama documentation

---

**Made with ❤️ by Madhur Kharade**

*SXUDO - Your emotionally intelligent AI companion*
