import axios from 'axios';

export default async function handler(req, res) {
  // CORS settings
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle POST requests
  if (req.method === 'POST') {
    try {
      const { command, userId = 'user' } = req.body;
      
      if (!command || command.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'Please provide a command' 
        });
      }
      
      console.log(`Processing command: ${command}`);
      
      // Call Groq AI
      const aiResponse = await callGroqAI(command);
      
      // Success response
      return res.status(200).json({
        success: true,
        response: aiResponse,
        userId: userId,
        timestamp: Date.now(),
        model: 'llama3-70b-8192'
      });
      
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
      });
    }
  }
  
  // Handle GET requests (for testing)
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: '🎀 Friday AI Cloud API',
      status: 'online',
      timestamp: Date.now(),
      endpoints: {
        main: 'POST /api/friday',
        test: 'GET /api/friday'
      },
      usage: 'Send POST request with { "command": "your question" }'
    });
  }
  
  // Method not allowed
  return res.status(405).json({
    success: false,
    error: 'Method not allowed'
  });
}

// Groq AI function
async function callGroqAI(userMessage) {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }
  
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama3-70b-8192',
      messages: [
        {
          role: 'system',
          content: `You are Friday, a friendly AI assistant that speaks in Hinglish (Hindi + English mix).
          You help with music, jokes, time, weather, and general conversations.
          Be concise, friendly, and helpful.
          Current time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}
          Always respond in Hinglish.`
        },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
      stream: false
    },
    {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Friday-AI/1.0'
      },
      timeout: 10000 // 10 seconds timeout
    }
  );
  
  return response.data.choices[0].message.content;
}
