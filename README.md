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

## Analytics

All static HTML pages load `/analytics.js`, which initializes Vercel Web Analytics.
Include `<script defer src="/analytics.js"></script>` in any new page's head.
The loader skips localhost. Web Analytics must be enabled for the Vercel project;
deploy afterward to activate the `/_vercel/insights/` endpoints. View traffic in
the project's Analytics tab.

## Project Structure

```
├── index.html          # Main site
├── style.css           # Compiled CSS
├── chat.js            # Claude integration
├── api/chat.js        # Vercel Edge Function
├── css/               # CSS source modules
└── images/            # Optimized assets
```

## Design and styling

The site uses the Bold visual direction: Archivo, citron introductions, charcoal type,
sharp edges, and real photography. See `DESIGN.md` for the shared design decisions.

- `css/tokens.css`: shared palette and theme values.
- `css/{base,components,layout,chat,responsive}.css`: public site styles; run `npm run build` after editing.
- `css/classroom.css`: shared visual treatment for the STAT 121 apps, loaded after their own layout styles.
- `theme.js` applies the initial theme before paint; `script.js` handles navigation, theme controls, and analytics.

Design explorations in `mockups/` are local references and excluded from Vercel deployments.
