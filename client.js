const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const RELAY_URL = 'ws://localhost:8766'; // Update if port changed
const AUDIO_FILE = path.join(__dirname, 'test_audio.ulaw');
const NUM_CLIENTS = 3; // Number of simultaneous clients to simulate
const CHUNK_SIZE = 3200; // bytes per chunk
const CHUNK_INTERVAL_MS = 100; // interval between chunks

function createClient(id) {
  const ws = new WebSocket(RELAY_URL);

  ws.on('open', () => {
    console.log(`Client ${id} 📤 Connected to relay as Exotel simulator`);

    fs.readFile(AUDIO_FILE, (err, data) => {
      if (err) {
        console.error(`Client ${id} ❌ Could not read audio file:`, err.message);
        return;
      }
      console.log(`Client ${id} 🎧 Sending ${AUDIO_FILE} (${data.length} bytes)`);

      let offset = 0;
      const sendChunk = () => {
        if (offset >= data.length) {
          console.log(`Client ${id} ✅ Finished sending test audio`);
          return;
        }
        const end = Math.min(offset + CHUNK_SIZE, data.length);
        const chunk = data.slice(offset, end);
        ws.send(chunk);
        offset = end;
        setTimeout(sendChunk, CHUNK_INTERVAL_MS);
      };
      sendChunk();
    });
  });

  ws.on('message', (msg) => {
    console.log(`Client ${id} 📥 Received audio from ElevenLabs (${msg.length} bytes)`);
  });

  ws.on('error', (err) => {
    console.error(`Client ${id} ❌ WebSocket error:`, err.message);
  });

  ws.on('close', () => {
    console.log(`Client ${id} 🔌 Disconnected from relay`);
  });
}

for (let i = 1; i <= NUM_CLIENTS; i++) {
  createClient(i);
}
