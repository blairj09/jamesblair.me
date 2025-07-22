# Rate Limiting Implementation Plan

## Current State
- **Session-based limiting**: 10 messages per session (resets on page refresh)
- **Easy to bypass**: Users can refresh to get more messages
- **Cost concern**: Potential for abuse

## Proposed IP-Based Rate Limiting

### Benefits
- **Better cost control**: Harder to bypass than session refreshing
- **Educational value**: Teaches users about LLM workflows and llms.txt standard
- **Professional approach**: Demonstrates understanding of API economics
- **Generous but sustainable**: 20 messages per IP address

### Implementation Details

#### Rate Limiting Logic
- **Track by IP address**: Use `req.headers['x-forwarded-for']` or `req.connection?.remoteAddress`
- **Limit**: 20 messages per IP address per day
- **Storage**: In-memory Map with IP as key, message count + timestamp as value
- **Reset**: Daily reset (24 hours from first message)

#### Developer Bypass
```javascript
const clientIP = req.headers['x-forwarded-for'] || req.connection?.remoteAddress || 'unknown';
const isDeveloper = clientIP === '24.2.72.214'; // James's IP
```

#### Limit Exceeded Message
When users hit the 20-message limit, show educational message:

```
You've reached your 20-message limit for today. To continue chatting about James Blair, you can:

1. **Use your own LLM tool** with James's context:
   - Download: https://jamesblair.me/llms.txt
   - Use with ChatGPT, Claude, or any LLM that supports file upload
   - Copy/paste the content as context for your conversation

2. **Wait 24 hours** for your limit to reset

3. **Contact James directly** at james@jamesblair.me for detailed discussions

This approach helps manage costs while giving you full access to James's professional context for unlimited conversations with your preferred AI tool.
```

### Technical Implementation

#### Data Structure
```javascript
const ipLimitStore = new Map(); // IP -> { messageCount, firstMessageTime }
```

#### Rate Limiting Check
```javascript
function checkIPLimit(clientIP) {
  const ipData = ipLimitStore.get(clientIP) || { messageCount: 0, firstMessageTime: Date.now() };
  
  // Reset after 24 hours
  if (Date.now() - ipData.firstMessageTime > 24 * 60 * 60 * 1000) {
    ipData.messageCount = 0;
    ipData.firstMessageTime = Date.now();
  }
  
  if (ipData.messageCount >= 20) {
    return { allowed: false, remaining: 0 };
  }
  
  ipData.messageCount++;
  ipLimitStore.set(clientIP, ipData);
  
  return { allowed: true, remaining: 20 - ipData.messageCount };
}
```

### User Experience Improvements
- **Status indicator**: Show "X messages remaining today"
- **Progressive warnings**: Warn at 15, 18, 19 messages
- **Helpful guidance**: Clear instructions on how to continue unlimited conversations

### Cost Impact
- **Current**: ~$0.50-2.00 per 10-message session
- **Proposed**: ~$1.00-4.00 per 20-message IP (daily)
- **Expected**: Better control due to bypass difficulty

### Professional Benefits
- **Showcases LLM ecosystem knowledge** for Anthropic application
- **Demonstrates cost-conscious API design**
- **Educational approach** teaches users about LLM workflows
- **Promotes llms.txt standard** adoption

## Implementation Steps
1. Update rate limiting logic from session to IP-based
2. Increase limit from 10 to 20 messages
3. Add developer IP bypass for testing
4. Create informative limit exceeded message
5. Update status indicator to show daily remaining messages
6. Test with preview deployment
7. Deploy to production

## Future Considerations
- **Analytics**: Track daily active IPs and message usage
- **Adjustable limits**: Environment variable for easy limit changes
- **Geographic insights**: Optional logging of IP regions for usage patterns