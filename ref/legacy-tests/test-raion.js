import { spawn } from 'child_process';

// Start the MCP server
const server = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Handle server output
let responseBuffer = '';

server.stdout.on('data', (data) => {
  responseBuffer += data.toString();

  // Try to parse complete JSON-RPC messages
  const lines = responseBuffer.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (line) {
      try {
        const msg = JSON.parse(line);
        console.log('Server response:', JSON.stringify(msg, null, 2));

        // If this is the tool list response, send the search request
        if (msg.result && msg.result.tools) {
          console.log('\nSending search request for "Raion"...\n');
          sendSearchRequest();
        }

        // If this is the search result, display it and exit
        if (msg.result && msg.result.content) {
          console.log('\nSearch Results:');
          const content = msg.result.content[0].text;
          const results = JSON.parse(content);
          console.log(JSON.stringify(results, null, 2));

          // Clean exit
          setTimeout(() => {
            server.kill();
            process.exit(0);
          }, 100);
        }
      } catch (e) {
        // Not a complete JSON message yet
      }
    }
  }
  responseBuffer = lines[lines.length - 1];
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

// Send initialization
console.log('Initializing MCP server...\n');
server.stdin.write(JSON.stringify({
  jsonrpc: '2.0',
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0'
    }
  },
  id: 1
}) + '\n');

// Send list tools request after a short delay
setTimeout(() => {
  console.log('Requesting tool list...\n');
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/list',
    params: {},
    id: 2
  }) + '\n');
}, 100);

// Function to send search request
function sendSearchRequest() {
  server.stdin.write(JSON.stringify({
    jsonrpc: '2.0',
    method: 'tools/call',
    params: {
      name: 'search_company',
      arguments: {
        query: 'Raion'
      }
    },
    id: 3
  }) + '\n');
}

// Handle termination
process.on('SIGINT', () => {
  server.kill();
  process.exit();
});