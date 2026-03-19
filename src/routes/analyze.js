import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { buildDeckParserPrompt } from '../prompts/deck-parser.js';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { deckText } = req.body;

  if (!deckText || deckText.trim().length < 20) {
    return res.status(400).json({ error: 'deckText must contain meaningful content' });
  }

  const prompt = buildDeckParserPrompt(deckText);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return res.status(502).json({
        error: 'Failed to parse deck analysis response from AI',
        raw,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Analyze route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
