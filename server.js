require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript');
const { generateContent } = require('./lib/gemini');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'www')));

function extractVideoId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) return match[1];
  }
  return null;
}

app.post('/api/transcript', async (req, res) => {
  try {
    const { url } = req.body;
    const videoId = extractVideoId(url);

    if (!videoId) {
      return res.status(400).json({ error: 'Invalid YouTube URL. Please check the link and try again.' });
    }

    const segments = await YoutubeTranscript.fetchTranscript(videoId);
    const text = segments.map((s) => s.text).join(' ').trim();

    if (!text) {
      return res.status(404).json({ error: 'Transcript not available for this video' });
    }

    res.json({ text, videoId });
  } catch (err) {
    console.error('Transcript error:', err.message);
    res.status(404).json({ error: 'Transcript not available for this video' });
  }
});

async function handleGenerate(req, res) {
  try {
    const { text, platform } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No content provided. Paste text or a YouTube link first.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'Gemini API key not configured. Set GEMINI_API_KEY in your .env file.'
      });
    }

    const result = await generateContent(text.trim(), platform || 'all');
    res.json(result);
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({
      error: err.message || 'Failed to generate content. Please try again.'
    });
  }
}

app.post('/api/generate', handleGenerate);
app.post('/generate', handleGenerate);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'www', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ContentFloss running at http://localhost:${PORT}`);
});
