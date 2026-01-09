# Ollama Setup Guide

## Installation

### Windows
1. Download from: https://ollama.ai/download/windows
2. Run the installer
3. Ollama will start automatically

### macOS
```bash
brew install ollama
ollama serve
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama serve
```

## Download Llama Model

After installing Ollama, download a model:

### Recommended (3B - Fast & Good Quality)
```bash
ollama pull llama3.2
```

### Smaller (1B - Fastest)
```bash
ollama pull llama3.2:1b
```

### Larger (8B - Best Quality)
```bash
ollama pull llama3.1:8b
```

## Verify Installation

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# List installed models
ollama list

# Test a model
ollama run llama3.2 "Hello, how are you?"
```

## Using with StudyMate

Once Ollama is installed and a model is downloaded:

1. **Restart your server** (if running):
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart
   npm run dev
   ```

2. **Test Smart Insights**:
   - Navigate to Analytics page
   - Check Smart Insights section
   - Server logs will show: `🤖 Calling Ollama (llama3.2)...`

3. **If Ollama is not running**:
   - System will automatically fall back to Groq
   - Server logs will show: `⚠️ Ollama failed, falling back to Groq`

## Troubleshooting

### Ollama not connecting
```bash
# Check if Ollama is running
ollama serve

# Or on Windows, check if the Ollama service is running
# in Task Manager
```

### Model not found
```bash
# List available models
ollama list

# Pull the model if missing
ollama pull llama3.2
```

### Disable Ollama temporarily
Set in `.env`:
```bash
USE_OLLAMA=false
```

This will use Groq directly without trying Ollama first.
