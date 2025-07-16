# Build Personal Website with AI Chat for jamesblair.me

Create a professional personal website using vanilla HTML, CSS, and JavaScript with web-llm integration for an AI chat interface. The site should be simple to maintain and deploy while providing a unique conversational AI experience.

## Project Structure

Create the following files:

```
jamesblair.me/
├── index.html
├── style.css
├── script.js
├── chat.js
├── james-context.js
├── images/
│   └── profile.jpg (placeholder - to be replaced)
└── README.md
```

## Implementation Requirements

### 1. HTML Structure (index.html)

Create a single-page website with these sections:
- Header with navigation
- Hero section with name, title, and prominent chat CTA
- About section
- Skills section
- Contact section
- Floating chat widget
- Footer

Include web-llm via CDN and ensure HTTPS compatibility.

### 2. CSS Styling (style.css)

Requirements:
- Clean, professional design
- Responsive layout using CSS Grid/Flexbox
- System fonts for fast loading
- Professional color scheme (navy, white, light gray)
- Smooth animations for chat widget
- Mobile-first approach

### 3. Chat Integration (chat.js)

Implement web-llm integration with:
- CDN import (no build process)
- Llama-3.1-8B-Instruct model
- Lazy loading (only when chat opens)
- Error handling and fallbacks
- Loading states and progress indicators
- Message history within session

### 4. Personal Context (james-context.js)

Create a comprehensive context file containing:
- Professional background and experience
- Education and skills
- Current role and focus
- Personality and communication style
- Contact preferences
- Instructions for AI behavior

Use placeholder content that can be easily customized.

### 5. Core JavaScript (script.js)

Implement:
- Smooth scrolling navigation
- Chat widget toggle functionality
- Basic interactions and animations
- Mobile menu if needed

## Technical Specifications

### Web-LLM Integration
- Use ESM imports via CDN
- Implement progressive enhancement
- Handle model loading with progress indicators
- Provide graceful degradation if AI fails
- Support offline functionality

### Performance Requirements
- Fast initial page load (AI loads separately)
- Minimal dependencies
- Optimized images
- Efficient CSS and JavaScript

### Accessibility
- Semantic HTML structure
- Proper ARIA labels for chat interface
- Keyboard navigation support
- Screen reader compatibility

## Content Guidelines

### Personal Information Template
Include placeholders for:
- Name and professional title
- Professional tagline/mission statement
- Background and experience summary
- Technical and professional skills
- Education and certifications
- Contact information (email, LinkedIn, GitHub)
- Professional interests and values

### AI Chat Context
The AI should:
- Respond as James Blair in first person
- Be professional but conversational
- Provide accurate information about background
- Encourage meaningful professional connections
- Direct complex inquiries to direct contact
- Maintain consistent personality

## Deployment Configuration

### Static Hosting Compatibility
- Works with GitHub Pages, Netlify, Vercel
- No server-side requirements
- HTTPS required for web-llm functionality
- Custom domain configuration for jamesblair.me

### SEO and Meta Tags
Include:
- Proper HTML meta tags
- Open Graph tags for social sharing
- Structured data markup
- Sitemap for search engines

## Code Examples

### Chat Widget HTML Structure
```html
<div id="chat-widget" class="chat-widget hidden">
  <div class="chat-header">
    <h3>Chat with James</h3>
    <button id="close-chat" aria-label="Close chat">×</button>
  </div>
  <div id="chat-messages" class="chat-messages" role="log" aria-live="polite">
    <div class="message ai-message">
      Hi! I'm James. Ask me anything about my background, experience, or interests!
    </div>
  </div>
  <div class="chat-input-container">
    <input type="text" id="chat-input" placeholder="Ask me anything..." aria-label="Chat message">
    <button id="send-message">Send</button>
  </div>
  <div id="chat-loading" class="hidden" aria-live="polite">AI is thinking...</div>
</div>

<button id="chat-toggle" class="chat-toggle" aria-label="Open chat with James">
  💬 Chat with James
</button>
```

### Web-LLM Initialization Pattern
```javascript
class JamesChat {
  constructor() {
    this.engine = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      this.showLoading('Initializing AI...');
      const selectedModel = "Llama-3.1-8B-Instruct-q4f16_1-MLC";
      
      this.engine = await window.ChatModule.CreateMLCEngine(selectedModel, {
        initProgressCallback: (progress) => {
          this.showLoading(`Loading model: ${Math.round(progress.progress * 100)}%`);
        }
      });
      
      await this.engine.reload(selectedModel, undefined, {
        systemPrompt: window.JAMES_CONTEXT
      });
      
      this.isInitialized = true;
      this.hideLoading();
    } catch (error) {
      this.showError('AI chat temporarily unavailable. Please use the contact form.');
    }
  }
}
```

### Personal Context Template
```javascript
window.JAMES_CONTEXT = `
You are James Blair, speaking directly to visitors on your personal website jamesblair.me.

ABOUT YOU:
- Professional Title: [Your Role/Title]
- Background: [Professional background and experience]
- Education: [Education details]
- Current Focus: [What you're working on]
- Location: [Your location]

KEY EXPERIENCE:
- [Role 1]: [Description and achievements]
- [Role 2]: [Description and achievements]
- [Notable Projects]: [Project descriptions]

SKILLS & EXPERTISE:
- Technical: [Technical skills list]
- Professional: [Professional competencies]
- Specializations: [Areas of expertise]

CONTACT PREFERENCES:
- Email: contact@jamesblair.me
- LinkedIn: [LinkedIn URL]
- GitHub: [GitHub URL]

INSTRUCTIONS:
- Always respond as James Blair in first person
- Be professional but approachable
- Keep responses concise and informative
- For detailed inquiries, suggest direct contact
- Encourage professional connections
`;
```

## Implementation Steps

1. **Create HTML structure** with semantic markup and accessibility features
2. **Implement responsive CSS** with professional styling and chat widget design
3. **Add core JavaScript** for navigation and basic interactions
4. **Integrate web-llm chat** with proper error handling and loading states
5. **Create personal context** with comprehensive information about James
6. **Test functionality** across devices and browsers
7. **Optimize performance** and ensure fast loading
8. **Deploy to static hosting** and configure custom domain

## Maintenance Instructions

### Content Updates
- Edit `james-context.js` to update AI knowledge
- Modify `index.html` for site content changes
- Update `style.css` for design adjustments
- No build process required - changes are live immediately

### Performance Monitoring
- Monitor chat loading times
- Track user engagement with AI feature
- Optimize based on common questions
- Keep web-llm library updated

## Success Criteria

- Professional, fast-loading personal website
- Functional AI chat that responds as James
- Mobile-responsive design
- Accessible to all users
- Easy content management
- Successful deployment to jamesblair.me
- Engaging user experience that differentiates from typical personal sites