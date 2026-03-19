import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { buildThesisScorerPrompt } from '../prompts/thesis-scorer.js';

const router = express.Router();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/', async (req, res) => {
  const { company, description, sector, stage, geography, askAmount, fundThesis } = req.body;

  if (!company || !description) {
    return res.status(400).json({ error: 'company and description are required' });
  }

  const prompt = buildThesisScorerPrompt({
    company,
    description,
    sector: sector || 'Not specified',
    stage: stage || 'Not specified',
    geography: geography || 'Not specified',
    askAmount: askAmount || 'Not specified',
    fundThesis: fundThesis || {},
  });

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content[0].text.trim();

    // Strip markdown code fences if Claude wraps the JSON
    const jsonStr = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      return res.status(502).json({
        error: 'Failed to parse scoring response from AI',
        raw,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Score route error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
