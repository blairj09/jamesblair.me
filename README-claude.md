# Claude API Integration for jamesblair.me

This branch replaces the web-llm implementation with Claude API integration for faster, higher-quality AI chat.

## Changes Made

### Removed
- Web-LLM CDN imports and complex model loading
- Model selection dropdown and configuration UI
- Progressive loading states and browser compatibility checks
- Mobile-only restrictions

### Added
- Vercel edge function (`/api/chat.js`) for secure Claude API proxy
- Simplified chat interface with Claude 3.5 Sonnet
- Rate limiting and content filtering on the server side
- Fast, consistent responses (~2-3 seconds vs 10-30 seconds)

## Deployment Instructions

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Set Environment Variable
```bash
vercel env add ANTHROPIC_API_KEY
# Enter your Anthropic API key when prompted
```

### 3. Deploy
```bash
vercel --prod
```

### 4. Test the Chat
- Visit your deployed site
- Try the AI chat feature
- Responses should be fast and high-quality

## Security Features

- API key stored as secure environment variable (never exposed to clients)
- Rate limiting per IP and session
- Content filtering to ensure questions are about James
- CORS headers properly configured
- Error handling with user-friendly messages

## Cost Management

The edge function includes:
- Basic rate limiting (can be enhanced with Redis/KV for production)
- Content filtering to prevent off-topic usage
- Conversation length limits
- Request validation

Expected costs: ~$2-10/month depending on usage.

## File Structure

```
├── api/
│   └── chat.js              # Vercel edge function for Claude API proxy
├── chat-claude.js           # New Claude-focused frontend chat implementation
├── index.html              # Updated to remove web-llm complexity
├── style.css               # Updated styles for simplified interface
├── vercel.json             # Vercel deployment configuration
└── package.json            # Updated with Vercel dependencies
```

## Benefits

- **Performance**: ~2-3 second responses vs 10-30 seconds with web-llm
- **Quality**: Claude 3.5 Sonnet vs smaller local models
- **Reliability**: No model loading failures or device compatibility issues
- **Simplicity**: Much cleaner codebase without complex model management
- **Mobile Support**: Works on all devices without restrictions
- **Professional**: Higher quality responses for visitors

## Monitoring

Monitor your Anthropic API usage at: https://console.anthropic.com/

Set up billing alerts to avoid unexpected costs.