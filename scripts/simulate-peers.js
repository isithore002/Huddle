/**
 * simulate-peers.js
 * 
 * Simulates multiple AXL peers broadcasting the same intent hash to trigger a coalition.
 * Usage: node scripts/simulate-peers.js --product "LG-OLED-65" --price 1800 --peers 3
 */

const AXLClient = require('../src/axl/client');

// Use the seller port just to act as another connected agent
const SELLER_API_PORT = 9012;
const axl = new AXLClient(SELLER_API_PORT);
const CHANNEL = 'huddle-intents';

const args = process.argv.slice(2);
let numPeers = 3;
let targetHash = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--peers') numPeers = parseInt(args[i+1]);
  if (args[i] === '--hash') targetHash = args[i+1];
}

async function runTest() {
  console.log(`[SimulatePeers] Starting simulation for ${numPeers} peers...`);
  
  if (!targetHash) {
    console.error('[SimulatePeers] Please provide --hash <hash> argument!');
    process.exit(1);
  }

  const ready = await axl.waitForReady(30);
  if (!ready) {
    console.error('[SimulatePeers] AXL node not ready on port 9012.');
    process.exit(1);
  }

  console.log(`[SimulatePeers] 📤 Simulating ${numPeers} additional peers broadcasting hash: ${targetHash.slice(0, 16)}...`);
  
  const topo = await axl.getTopology();
  const myRealPeerId = topo.our_public_key;

  for (let i = 0; i < numPeers - 1; i++) { // -1 because buyer is already 1
    const crypto = require('crypto');
    const fakePeerId = i === 0 ? myRealPeerId : crypto.randomBytes(32).toString('hex');
    
    await axl.broadcast(CHANNEL, {
      type: 'INTENT_HASH',
      hash: targetHash,
      from: fakePeerId
    });
    
    console.log(`[SimulatePeers]    Sent broadcast from ${fakePeerId.slice(0, 16)}`);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[SimulatePeers] ✅ All simulated hashes broadcasted.');
  console.log('[SimulatePeers] The seller-agent will receive any A2A reveals meant for the real peer ID.');
  process.exit(0);
}

runTest();
