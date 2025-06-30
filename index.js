require('dotenv').config();
const WebSocket = require('ws');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const SERVER_PORT = process.env.PORT || 8766;

if (!ELEVENLABS_API_KEY || !ELEVENLABS_AGENT_ID) {
  console.error('Missing ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID in .env');
  process.exit(1);
}

const ELEVENLABS_WS_URL = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`;

console.log(`Relay started on ws://localhost:${SERVER_PORT}`);
console.log('Bridging Exotel <-> ElevenLabs');

let exotelSocket = null;
let elevenSocket = null;

const server = new WebSocket.Server({ port: SERVER_PORT });

server.on('connection', (ws) => {
  console.log('Exotel connected');
  exotelSocket = ws;

  // Connect to ElevenLabs
  elevenSocket = new WebSocket(ELEVENLABS_WS_URL, {
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY
    }
  });

  elevenSocket.on('open', () => {
    console.log('Connected to ElevenLabs');
  });

  elevenSocket.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.audio_event?.audio_base_64) {
        const audioBuffer = Buffer.from(data.audio_event.audio_base_64, 'base64');
        if (exotelSocket?.readyState === WebSocket.OPEN) {
          exotelSocket.send(audioBuffer);
          console.log('Sent audio to Exotel');
        }
      }
    } catch (err) {
      console.error('Error from ElevenLabs:', err.message);
    }
  });

  elevenSocket.on('close', () => {
    console.log('ElevenLabs WebSocket closed');
  });

  elevenSocket.on('error', (err) => {
    console.error('ElevenLabs WebSocket error:', err.message);
  });

  ws.on('message', (msg) => {
    const audioBuffer = Buffer.isBuffer(msg) ? msg : Buffer.from(msg);
    const base64Audio = audioBuffer.toString('base64');

    if (elevenSocket?.readyState === WebSocket.OPEN) {
      elevenSocket.send(JSON.stringify({
        audio_event: {
          audio_base_64: base64Audio
        }
      }));
      console.log('Sent audio to ElevenLabs');
    }
  });

  ws.on('close', () => {
    console.log('Exotel disconnected');
    if (elevenSocket?.readyState === WebSocket.OPEN) {
      elevenSocket.close();
    }
    exotelSocket = null;
  });

  ws.on('error', (err) => {
    console.error('Exotel WebSocket error:', err.message);
  });
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});
