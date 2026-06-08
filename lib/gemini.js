const { GoogleGenerativeAI } = require('@google/generative-ai');

function buildPrompt(text) {
  return `Transform the following content into:
1. Instagram caption
2. LinkedIn post
3. Twitter thread
4. 3 Hook variations

Make them engaging, structured, and platform-specific.

Respond ONLY with valid JSON in this exact structure (no markdown, no code fences):
{
  "instagram": "caption text here",
  "linkedin": "post text here",
  "twitter": "thread text here",
  "hooks": ["hook 1", "hook 2", "hook 3"]
}

Content:
${text}`;
}

function parseResponse(raw) {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  return {
    instagram: parsed.instagram || '',
    linkedin: parsed.linkedin || '',
    twitter: parsed.twitter || '',
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks : []
  };
}

function filterByPlatform(result, platform) {
  if (!platform || platform === 'all') return result;

  return {
    instagram: platform === 'instagram' ? result.instagram : '',
    linkedin: platform === 'linkedin' ? result.linkedin : '',
    twitter: platform === 'twitter' ? result.twitter : '',
    hooks: result.hooks
  };
}

async function generateContent(text, platform = 'all') {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured. Set GEMINI_API_KEY in your .env file.');
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const result = await model.generateContent(buildPrompt(text));
  const response = result.response.text();

  try {
    return filterByPlatform(parseResponse(response), platform);
  } catch {
    const fallback = {
      instagram: response,
      linkedin: response,
      twitter: response,
      hooks: []
    };
    return filterByPlatform(fallback, platform);
  }
}

module.exports = { generateContent, buildPrompt, parseResponse };
