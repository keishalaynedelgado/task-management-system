const axios = require('axios');

exports.chatWithAI = async (req, res) => {
  try {
    const { message, context = {} } = req.body;
    
    // Get user info from request (set by auth middleware)
    const user = req.user;
    
    // Prepare context for AI
    const systemPrompt = `You are an AI assistant for a task management system. 
You help users with their tasks, system usage, and workflow guidance.
Current user: ${user.firstName} ${user.lastName}
User role: ${user.role}
User tenant: ${user.tenantId || 'No tenant assigned'}

Provide helpful, concise responses. If asked about specific tasks, guide them to use the task management features.
Always be professional and helpful.`;

    // Call AI API (using OpenRouter as example)
    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: 'openai/gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;

    res.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing AI request'
    });
  }
};