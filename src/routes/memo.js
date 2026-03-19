import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { buildMemoGeneratorPrompt } from '../prompts/memo-generator.js';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const {
    company,
    description,
    sector,
    stage,
    founders,
    marketSize,
    traction,
    competition,
    fundThesis,
    matchScore,
    geography,
    askAmount,
    businessModel,
  } = req.body;

  if (!company || !description) {
    return res.status(400).json({ error: 'company and description are required' });
  }

  const prompt = buildMemoGeneratorPrompt({
    company,
    description,
    sector: sector || 'Not specified',
    stage: stage || 'Not specified',
    founders: founders || 'Not specified',
    marketSize: marketSize || 'Not specified',
    traction: traction || 'Not specified',
    competition: competition || 'Not specified',
    fundThesis: fundThesis || {},
    matchScore: matchScore || null,
    geography: geography || 'Not specified',
    askAmount: askAmount || 'Not specified',
    businessModel: businessModel || 'Not specified',
  });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const memo = message.content[0].text.trim();
    res.json({ memo });
  } catch (err) {
    console.error('Memo route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
