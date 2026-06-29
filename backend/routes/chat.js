import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { authenticate, checkRequestLimit } from '../middleware/auth.js';
import { query } from '../models/db.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- Helper: call Groq (free tier) ---
async function callGroq(messages, stream = false) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages,
      stream,
      temperature: 0.7,
      max_tokens: 2048
    })
  });
  return response;
}

// --- Helper: pick AI model by plan ---
function getModelForPlan(plan) {
  if (plan === 'ultra') return 'gemini';  // could swap to paid GPT-4 later
  return 'groq'; // load balance free models
}

// Get all chats for user
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, created_at, updated_at FROM chats WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages in a chat
router.get('/:chatId/messages', authenticate, async (req, res) => {
  try {
    const chat = await query('SELECT * FROM chats WHERE id = $1 AND user_id = $2', [req.params.chatId, req.user.id]);
    if (!chat.rows.length) return res.status(404).json({ error: 'Chat not found' });

    const messages = await query(
      'SELECT role, content, created_at FROM messages WHERE chat_id = $1 ORDER BY created_at ASC',
      [req.params.chatId]
    );
    res.json({ chat: chat.rows[0], messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new chat
router.post('/new', authenticate, async (req, res) => {
  try {
    const { title = 'New chat' } = req.body;
    const result = await query(
      'INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING *',
      [req.user.id, title]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message (streaming)
router.post('/:chatId/send', authenticate, checkRequestLimit, async (req, res) => {
  const { message, mode = 'chat' } = req.body;  // mode: chat | code | qa
  const chatId = req.params.chatId;

  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    // Verify chat belongs to user
    const chatResult = await query('SELECT * FROM chats WHERE id = $1 AND user_id = $2', [chatId, req.user.id]);
    if (!chatResult.rows.length) return res.status(404).json({ error: 'Chat not found' });

    // Save user message
    await query('INSERT INTO messages (chat_id, role, content) VALUES ($1, $2, $3)', [chatId, 'user', message]);

    // Get conversation history (last 10 messages for context)
    const history = await query(
      'SELECT role, content FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 10',
      [chatId]
    );
    const historyMessages = history.rows.reverse();

    // System prompts by mode
    const systemPrompts = {
      chat: 'You are a helpful, friendly AI assistant. Be concise and clear.',
      code: 'You are an expert programmer. Write clean, well-commented code. Always specify the programming language in code blocks.',
      qa: 'You are a knowledgeable assistant. Give accurate, factual answers. If unsure, say so.'
    };

    const messagesForAI = [
      { role: 'system', content: systemPrompts[mode] || systemPrompts.chat },
      ...historyMessages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
    ];

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    const modelUsed = getModelForPlan(req.user.plan);

    try {
      if (modelUsed === 'groq') {
        // Groq streaming
        const groqRes = await callGroq(messagesForAI, true);
        const reader = groqRes.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                fullResponse += delta;
                res.write(`data: ${JSON.stringify({ delta })}\n\n`);
              }
            } catch {}
          }
        }
      } else {
        // Gemini streaming
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const geminiMessages = messagesForAI
          .filter(m => m.role !== 'system')
          .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));

        const result = await model.generateContentStream({ contents: geminiMessages });
        for await (const chunk of result.stream) {
          const delta = chunk.text();
          if (delta) {
            fullResponse += delta;
            res.write(`data: ${JSON.stringify({ delta })}\n\n`);
          }
        }
      }
    } catch (aiError) {
      console.error('AI error:', aiError);
      fullResponse = "Sorry, I'm having trouble connecting. Please try again.";
      res.write(`data: ${JSON.stringify({ delta: fullResponse })}\n\n`);
    }

    // Save assistant response
    await query(
      'INSERT INTO messages (chat_id, role, content, model_used) VALUES ($1, $2, $3, $4)',
      [chatId, 'assistant', fullResponse, modelUsed]
    );

    // Increment request counter
    await query('UPDATE users SET requests_used = requests_used + 1 WHERE id = $1', [req.user.id]);

    // Update chat title from first message if still default
    const chat = chatResult.rows[0];
    if (chat.title === 'New chat') {
      const title = message.slice(0, 50) + (message.length > 50 ? '...' : '');
      await query('UPDATE chats SET title = $1, updated_at = NOW() WHERE id = $2', [title, chatId]);
    } else {
      await query('UPDATE chats SET updated_at = NOW() WHERE id = $1', [chatId]);
    }

    res.write(`data: ${JSON.stringify({ done: true, model: modelUsed })}\n\n`);
    res.end();
  } catch (err) {
    console.error(err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// Delete chat
router.delete('/:chatId', authenticate, async (req, res) => {
  try {
    await query('DELETE FROM chats WHERE id = $1 AND user_id = $2', [req.params.chatId, req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
