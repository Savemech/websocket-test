const WebSocket = require('ws');
const crypto = require('crypto');

// Connect to your Cloudflare Worker WebSocket endpoint
const ws = new WebSocket('wss://shrill-water-9c29.svx-cf.workers.dev/');

// Define the initial n value
let n = 3;
let step = 0;
const totalSteps = 100;

// Function to compute SHA-512 hash
function computeHash(input) {
  return crypto.createHash('sha512').update(input.toString()).digest('hex');
}

// Once the WebSocket connection is open
ws.on('open', function open() {
  console.log('WebSocket connection opened');
  // Start with the first challenge
  sendResponse();
});

// Listen for messages from the server
ws.on('message', function message(data) {
  console.log(`Received from server: ${data}`);

  if (data.includes('failed')) {
    console.log('Test failed. Closing connection.');
    ws.close();
  } else if (data.includes('accepted')) {
    // Proceed to the next step
    step++;
    if (step < totalSteps) {
      // Increment n and send the next correct hash
      n += 1;
      sendResponse();
    }
  } else if (data.includes('good job')) {
    console.log('Challenge completed successfully!');
    ws.close();
  }
});

// Function to send the correct hash response based on n
function sendResponse() {
  const nextNumber = (n + 1) ** n;
  const hash = computeHash(nextNumber);

  // Print both the original number and the hash
  console.log(`Step ${step + 1}:`);
  console.log(`Original number (n+1)^n: ${nextNumber}`);
  console.log(`Hashed value (SHA-512): ${hash}`);

  // Send the hash to the WebSocket server
  ws.send(hash);
}
