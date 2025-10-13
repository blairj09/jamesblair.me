# jamesblair.me

Personal website with Claude AI chat integration.

## Features

- **Claude Chat**: Interactive AI assistant powered by [Claude Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5)
- **Responsive Design**: Mobile-first, accessible interface
- **Dark/Light Mode**: Theme switching with system preference detection
- **Edge Functions**: Fast, secure API integration via Vercel

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **API**: Anthropic Claude API via Vercel Edge Functions
- **Hosting**: Vercel with custom domain
- **Build**: CSS concatenation from modular source files

## Development

```bash
npm install
npm run build:css    # Compile CSS modules
vercel dev          # Local development server
```

## Deployment

Automatically deploys to [jamesblair.me](https://jamesblair.me) when pushed to main branch.

## Project Structure

```
├── index.html          # Main site
├── style.css           # Compiled CSS
├── chat.js            # Claude integration
├── api/chat.js        # Vercel Edge Function
├── css/               # CSS source modules
└── images/            # Optimized assets
```