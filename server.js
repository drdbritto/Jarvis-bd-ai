import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import { timingSafeEqual } from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 3000);
const apiKey = process.env.OPENAI_API_KEY;
const accessCode = process.env.APP_ACCESS_CODE;
const model = process.env.OPENAI_MODEL || 'gpt-5.5';
const allowedOrigins = (process.env.APP_ORIGINS || 'https://localhost,capacitor://localhost,http://localhost')
  .split(',').map(s => s.trim()).filter(Boolean);

if (!apiKey) throw new Error('Missing OPENAI_API_KEY environment variable.');
if (!accessCode || accessCode.length < 12) throw new Error('Set APP_ACCESS_CODE to a random value of at least 12 characters.');

const openai = new OpenAI({ apiKey });
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin(origin, callback) {
    // Native WebViews may omit Origin. The app-access-code check still applies.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'x-jarvis-access-code'],
  maxAge: 86400,
}));
app.use(express.json({ limit: '32kb' }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: 'draft-8', legacyHeaders: false }));

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function requireAppCode(req, res, next) {
  if (!safeEqual(req.get('x-jarvis-access-code'), accessCode)) {
    return res.status(401).json({ error: 'App Access Code সঠিক নয়। অ্যাপের সার্ভার সেটিংস পরীক্ষা করুন।' });
  }
  next();
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'JARVIS BD AI backend' }));

app.post('/api/chat', requireAppCode, async (req, res) => {
  try {
    const incoming = req.body?.messages;
    if (!Array.isArray(incoming) || incoming.length < 1 || incoming.length > 24) {
      return res.status(400).json({ error: '১ থেকে ২৪টি chat message পাঠাতে হবে।' });
    }
    const messages = [];
    for (const item of incoming) {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') continue;
      const content = item.content.trim().slice(0, 4000);
      if (content) messages.push({ role: item.role, content });
    }
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'শেষ message-টি user message হতে হবে।' });
    }

    const response = await openai.responses.create({
      model,
      instructions: [
        'You are JARVIS BD AI, a helpful personal assistant for a user in Bangladesh.',
        'Reply naturally in the language used by the user. If the user writes Bangla or Banglish, reply in clear, natural Bangla.',
        'Be friendly, practical, and concise. Explain technical steps simply.',
        'Do not claim to control the phone, access private data, or perform actions unless a connected tool actually did so.',
        'For medical, legal, or financial topics, provide careful general information and encourage qualified professional advice when appropriate.'
      ].join(' '),
      input: messages,
      max_output_tokens: 900,
      store: false,
    });
    return res.json({ answer: response.output_text || 'দুঃখিত, এবার উত্তর তৈরি করা যায়নি।' });
  } catch (error) {
    const status = Number(error?.status) || 502;
    // Do not return credentials, raw stack traces, or internal request details.
    console.error('OpenAI request failed:', status, error?.message || 'unknown error');
    if (status === 401) return res.status(502).json({ error: 'Backend-এর OpenAI API Key সঠিক নয় বা সক্রিয় নয়।' });
    if (status === 429) return res.status(429).json({ error: 'API rate limit বা billing limit হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।' });
    return res.status(502).json({ error: 'AI সার্ভারে সমস্যা হয়েছে। Backend log ও API billing পরীক্ষা করুন।' });
  }
});

app.use((err, _req, res, _next) => {
  if (err?.message === 'Origin not allowed by CORS') return res.status(403).json({ error: 'এই origin অনুমোদিত নয়।' });
  console.error('Request error:', err?.message || 'unknown');
  res.status(400).json({ error: 'অনুরোধটি গ্রহণ করা যায়নি।' });
});

app.listen(port, '0.0.0.0', () => console.log(`JARVIS BD AI backend listening on ${port}; model=${model}`));
