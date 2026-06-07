// ════════════════════════════════════════════════════════
// AppointmentIQ — Node.js Backend
// Handles Twilio WhatsApp sends (keys stay server-side)
// ════════════════════════════════════════════════════════
// Run: node server.js
// Requires: npm install express twilio cors dotenv

require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const twilio  = require('twilio');
const path    = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve the frontend from the same folder
app.use(express.static(__dirname));

// ── Twilio client ────────────────────────────────────────
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// ── POST /api/send-whatsapp ──────────────────────────────
// Body: { to: "+19155551234", body: "Your message text" }
app.post('/api/send-whatsapp', async (req, res) => {
  const { to, body } = req.body;

  if (!to || !body) {
    return res.status(400).json({ error: 'Missing "to" or "body"' });
  }

  // Normalise: strip any existing "whatsapp:" prefix then re-add
  const toFormatted   = 'whatsapp:' + to.replace(/^whatsapp:/, '');
  const fromFormatted = 'whatsapp:' + process.env.TWILIO_WHATSAPP_FROM.replace(/^whatsapp:/, '');

  try {
    const message = await client.messages.create({
      from: fromFormatted,
      to:   toFormatted,
      body,
    });

    console.log(`✅ WhatsApp sent → SID: ${message.sid}  to: ${to}`);
    res.json({ success: true, sid: message.sid });

  } catch (err) {
    console.error('❌ Twilio error:', err.message);
    res.status(500).json({ error: err.message, code: err.code });
  }
});

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 AppointmentIQ server running at http://localhost:${PORT}`);
  console.log(`   Twilio account: ${process.env.TWILIO_ACCOUNT_SID?.slice(0,10)}...`);
  console.log(`   WhatsApp from:  ${process.env.TWILIO_WHATSAPP_FROM}\n`);
});
