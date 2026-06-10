const Groq = require('groq-sdk');

function buildPrompt(text) {
  return `Transform the following content into:
1. Instagram caption
2. LinkedIn post
3. Twitter thread (separate tweets with double newlines)
4. YouTube caption (engaging, with timestamps placeholder if needed)
5. TikTok script/caption (short, punchy)
6. Facebook post (friendly, community-focused)
7. 3 Hook variations

Make them engaging, structured, and platform-specific.

Respond ONLY with valid JSON in this exact structure (no markdown, no code fences, no preamble):
{
  "instagram": "caption text here",
  "linkedin": "post text here",
  "twitter": "thread text here",
  "youtube": "caption text here",
  "tiktok": "caption/script here",
  "facebook": "post text here",
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

  // Some LLMs might still add preamble even if told not to
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  const parsed = JSON.parse(cleaned);

  const formatField = (field) => {
    if (!field) return '';
    if (typeof field === 'string') return field;
    if (Array.isArray(field)) return field.join('\n\n');
    if (typeof field === 'object') {
      const values = Object.values(field);
      if (values.length === 1 && Array.isArray(values[0])) {
        return values[0].join('\n\n');
      }
      return JSON.stringify(field, null, 2);
    }
    return String(field);
  };

  return {
    instagram: formatField(parsed.instagram),
    linkedin: formatField(parsed.linkedin),
    twitter: formatField(parsed.twitter),
    youtube: formatField(parsed.youtube),
    tiktok: formatField(parsed.tiktok),
    facebook: formatField(parsed.facebook),
    hooks: Array.isArray(parsed.hooks) ? parsed.hooks : []
  };
}

function filterByPlatform(result, platform) {
  if (!platform || platform === 'all') return result;

  const filtered = {
    instagram: platform === 'instagram' ? result.instagram : '',
    linkedin: platform === 'linkedin' ? result.linkedin : '',
    twitter: platform === 'twitter' ? result.twitter : '',
    youtube: platform === 'youtube' ? result.youtube : '',
    tiktok: platform === 'tiktok' ? result.tiktok : '',
    facebook: platform === 'facebook' ? result.facebook : '',
    hooks: result.hooks
  };
  return filtered;
}

async function generateContent(text, platform = 'all') {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('Groq API key not configured. Set GROQ_API_KEY in your .env file.');
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a content strategist and copywriter. You respond only with valid JSON.'
        },
        {
          role: 'user',
          content: buildPrompt(text)
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' }
    });

    const response = completion.choices[0].message.content;

    try {
      return filterByPlatform(parseResponse(response), platform);
    } catch (parseErr) {
      console.warn('Failed to parse Groq JSON response, using fallback:', parseErr.message);
      const fallback = {
        instagram: response,
        linkedin: response,
        twitter: response,
        hooks: []
      };
      return filterByPlatform(fallback, platform);
    }
  } catch (apiErr) {
    console.error('Groq API Error:', apiErr.message);
    throw apiErr;
  }
}

module.exports = { generateContent, buildPrompt, parseResponse };
