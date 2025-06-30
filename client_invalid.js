const WebSocket = require('ws');

const RELAY_URL = 'ws://localhost:8766';

const ws = new WebSocket(RELAY_URL);

ws.on('open', () => {
  console.log('Connected to relay, sending invalid data...');
  ws.send('INVALID_DATA'); // Send malformed data
});

ws.on('message', (msg) => {
  console.log('Received message:', msg);
});

ws.on('error', (err) => {
  console.error('WebSocket error:', err.message);
});

ws.on('close', () => {
  console.log('Disconnected from relay');
});
