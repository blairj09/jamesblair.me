// Vercel Edge Function for Claude API Proxy
// This keeps your API key secure while enabling Claude chat

// Simple in-memory session tracking (resets on function cold start)
const sessionStore = new Map();

// Function to load and process James Blair context from llms.txt
async function loadJamesContext() {
  try {
    let llmsContent;
    
    // Try filesystem first (works in Vercel deployment)
    try {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');
      const llmsPath = join(process.cwd(), 'llms.txt');
      console.log('Attempting to load llms.txt from path:', llmsPath);
      llmsContent = readFileSync(llmsPath, 'utf-8');
      console.log('Successfully loaded llms.txt from filesystem. Content length:', llmsContent.length);
      console.log('First 200 chars:', llmsContent.substring(0, 200));
      console.log('Contains FTP?', llmsContent.includes('FTP'));
    } catch (fsError) {
      // Fall back to HTTP (for other environments)
      console.log('Filesystem access failed, trying HTTP:', fsError.message);
      
      const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : 'http://localhost:3000';
      
      console.log('Fetching from URL:', `${baseUrl}/llms.txt`);
      const llmsResponse = await fetch(`${baseUrl}/llms.txt`);
      
      if (!llmsResponse.ok) {
        throw new Error(`Failed to load llms.txt via HTTP: ${llmsResponse.status}`);
      }
      
      llmsContent = await llmsResponse.text();
      console.log('Successfully loaded llms.txt via HTTP. Content length:', llmsContent.length);
      console.log('First 200 chars:', llmsContent.substring(0, 200));
      console.log('Contains FTP?', llmsContent.includes('FTP'));
    }
    
    // Create a system prompt that incorporates the llms.txt content
    const systemPrompt = `You are an AI assistant providing information about James Blair based on his professional background and experience. You should respond as if you have comprehensive knowledge about James, but always clarify that you are an AI providing information about him, not James himself.

Here is comprehensive information about James Blair:

${llmsContent}

Instructions:
- Be conversational but professional
- Keep responses concise (2-3 paragraphs max)  
- For complex technical or business inquiries, suggest contacting James directly at james@jamesblair.me
- Always clarify you're an AI providing information about James, not James himself
- Focus on James's professional expertise in data science, AI, and product management
- If asked about personal details, share appropriate information while maintaining professional boundaries
- Use the context provided above to answer questions accurately`;

    return systemPrompt;
  } catch (error) {
    console.error('Error loading llms.txt:', error);
    // Fallback to basic prompt if file loading fails
    return `You are an AI assistant providing information about James Blair, a Senior Product Manager at Posit with expertise in data science and AI. Always clarify that you are an AI providing information about James, not James himself. For detailed inquiries, suggest contacting James directly at james@jamesblair.me.`;
  }
}

// Function to call Claude API with retry logic for 529 errors
async function callClaudeWithRetry(systemPrompt, messages, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514', // Updated to Claude Sonnet 4
          max_tokens: 1000,
          temperature: 0.7,
          system: systemPrompt,
          messages: messages
        })
      });

      // If successful, return the response
      if (claudeResponse.ok) {
        return claudeResponse;
      }

      // Handle 529 overloaded errors with retry
      if (claudeResponse.status === 529) {
        const errorData = await claudeResponse.text();
        console.log(`Claude overloaded (attempt ${attempt}/${maxRetries}):`, errorData);
        
        if (attempt < maxRetries) {
          // Exponential backoff: wait 1s, 2s, 4s
          const waitTime = Math.pow(2, attempt - 1) * 1000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue; // Try again
        }
      }

      // For other errors, log and break out of retry loop
      const errorData = await claudeResponse.text();
      console.error(`Claude API error (attempt ${attempt}):`, claudeResponse.status, errorData);
      return null; // Don't retry for non-529 errors
      
    } catch (error) {
      console.error(`Claude API request failed (attempt ${attempt}):`, error);
      
      // Only retry on last attempt if it's a network/connection error
      if (attempt === maxRetries) {
        return null;
      }
      
      // Wait before retry
      const waitTime = Math.pow(2, attempt - 1) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  return null; // All retries exhausted
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { message, conversationHistory = [], sessionId } = req.body;

    // Basic input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // Session-based rate limiting
    const maxMessagesPerSession = 10;
    if (sessionId) {
      const sessionData = sessionStore.get(sessionId) || { messageCount: 0, createdAt: Date.now() };
      
      // Clean up old sessions (older than 24 hours)
      if (Date.now() - sessionData.createdAt > 24 * 60 * 60 * 1000) {
        sessionStore.delete(sessionId);
        sessionData.messageCount = 0;
        sessionData.createdAt = Date.now();
      }
      
      // Check session limit
      if (sessionData.messageCount >= maxMessagesPerSession) {
        return res.status(429).json({ 
          error: 'Session message limit reached. Please refresh the page to start a new session.' 
        });
      }
      
      // Increment message count
      sessionData.messageCount++;
      sessionStore.set(sessionId, sessionData);
    }

    // Rate limiting - basic IP-based limiting
    const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';

    // Content filtering - ensure messages are about James
    const jamesKeywords = ['james', 'blair', 'background', 'experience', 'work', 'posit', 'data science', 'product manager', 'ai', 'cycling', 'family'];
    const messageText = message.toLowerCase();
    const isAboutJames = jamesKeywords.some(keyword => messageText.includes(keyword)) || 
                        messageText.includes('tell me') || 
                        messageText.includes('what') ||
                        messageText.includes('who') ||
                        messageText.includes('how') ||
                        conversationHistory.length === 0; // Allow first message

    if (!isAboutJames && conversationHistory.length > 0) {
      return res.status(400).json({ 
        error: 'Please ask questions about James Blair, his background, experience, or interests.' 
      });
    }

    // Build conversation messages for Claude
    const messages = [
      ...conversationHistory.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Load James Blair context dynamically from llms.txt
    const systemPrompt = await loadJamesContext();
    console.log('System prompt length:', systemPrompt.length);
    console.log('System prompt contains FTP?', systemPrompt.includes('FTP'));

    // Call Claude API with retry logic for overloaded errors
    const claudeResponse = await callClaudeWithRetry(systemPrompt, messages);

    if (!claudeResponse) {
      return res.status(500).json({ 
        error: 'AI service temporarily unavailable. Please try again later.' 
      });
    }

    const claudeData = await claudeResponse.json();
    
    // Extract the assistant's response
    const assistantMessage = claudeData.content?.[0]?.text;
    
    if (!assistantMessage) {
      console.error('Unexpected Claude response format:', claudeData);
      return res.status(500).json({ 
        error: 'Unexpected response format from AI service.' 
      });
    }

    // Return the response
    return res.status(200).json({
      message: assistantMessage,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error. Please try again later.' 
    });
  }
}