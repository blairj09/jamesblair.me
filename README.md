# jamesblair.me

Personal website with an optional Claude-powered site guide.

## Features

- **Optional AI guide**: A supplemental assistant that can answer questions about James’s public background; direct contact remains the best way to connect
- **Responsive Design**: Mobile-first, accessible interface
- **Dark/Light Mode**: Theme switching with system preference detection
- **Serverless function**: API integration via Vercel; configure durable rate limiting at the hosting layer before relying on it for abuse protection

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
