/**
 * Buyer Agent — Huddle
 * 
 * Phase 2: Intent Hashing & Gossip Matching
 */

const AXLClient = require('../axl/client');
const { hashIntent, makeNonce } = require('../intent/intentHash');

const BUYER_API_PORT = 9002;
const axl = new AXLClient(BUYER_API_PORT);

const CHANNEL = 'huddle-intents';
const K_THRESHOLD = 3; // 3 for local demo
const hashMap = new Map(); // hash -> {count, peers}

async function submitIntent(productId, maxPrice, daysToWait) {
  const nonce = makeNonce();
  const deadline = Math.floor(Date.now() / 1000) + (daysToWait * 86400);
  const hash = hashIntent({ productId, maxPrice, deadline, nonce });

  const rawIntent = { productId, maxPrice, deadline, nonce };
  
  // Also track our own intent!
  const topo = await axl.getTopology();
  const myPeerId = topo.our_public_key;
  
  hashMap.set(hash, { count: 1, peers: [myPeerId] });

  console.log('[BuyerAgent] 📤 Broadcasting hash:', hash.slice(0, 16) + '...');
  require('fs').writeFileSync('.current-hash', hash);
  
  // We send from matching the expected format
  await axl.broadcast(CHANNEL, { type: 'INTENT_HASH', hash, from: myPeerId });
  return { hash, rawIntent };
}

const { electCoordinator } = require('../coordinator/election');
const { runNegotiation } = require('../coordinator/negotiate');

// Hardcoded seller identity for Phase 3 demo (normally discovered via mesh)
const SELLER_PEER_ID = 'b6efb8d06611be4f3cfa78404d5413870c43646b0cce00268118a695263b0e7b';

function pollForCoalition(myHash, myRawIntent) {
  console.log('[BuyerAgent] 👂 Polling for coalition matching hash:', myHash.slice(0, 16) + '...');
  let coalitionFormed = false;

  axl.startPolling(async (msg) => {
    const parsed = AXLClient.parseMessage(msg.body);
    
    if (parsed.type === 'COALITION_OFFER') {
      console.log('\n[BuyerAgent] 📝 Received finalized COALITION OFFER from Coordinator!');
      console.log(`[BuyerAgent]    Product: ${parsed.productId}`);
      console.log(`[BuyerAgent]    Final Price: $${parsed.finalPrice} (Saved $${1800 - parsed.finalPrice})`);
      console.log(`[BuyerAgent]    Seller Signature: ${parsed.sellerSig.slice(0, 30)}...`);
      
      const readline = require('readline').createInterface({ input: process.stdin, output: process.stdout });
      readline.question(`[BuyerAgent] OFFER: $${parsed.finalPrice} ← $1800. Save $${1800 - parsed.finalPrice}. Accept? [Y] > `, (ans) => {
        console.log(`\n[BuyerAgent] ⏳ Triggering Phase 5 KeeperHub x402 commit...`);
        readline.close();
      });
    }

    // Process intent hashes
    if (parsed.type === 'INTENT_HASH' && parsed.hash === myHash && !coalitionFormed) {
      const sender = parsed.from || msg.fromPeerId;
      const existing = hashMap.get(myHash) || { count: 0, peers: [] };
      
      if (!existing.peers.includes(sender)) {
        existing.count++;
        existing.peers.push(sender);
        hashMap.set(myHash, existing);
        
        console.log(`[BuyerAgent] 🔍 Match found! Coalition size: ${existing.count}`);

        if (existing.count >= K_THRESHOLD) {
          coalitionFormed = true;
          console.log('[BuyerAgent] 🎉 k threshold met — revealing intent to cluster');
          await revealToCluster(existing.peers, myRawIntent, myHash);

          // Phase 3: Elect coordinator
          const coordinatorId = electCoordinator(existing.peers);
          const topo = await axl.getTopology();
          
          if (coordinatorId === topo.our_public_key) {
            console.log('\n[BuyerAgent] 👑 I WAS ELECTED COORDINATOR! Initiating seller negotiation...');
            const coalitionInfo = {
              members: existing.peers,
              productId: myRawIntent.productId,
              targetPrice: myRawIntent.maxPrice
            };
            
            try {
              await runNegotiation(axl, coalitionInfo, SELLER_PEER_ID);
            } catch (err) {
              console.error('[BuyerAgent] ❌ Negotiation failed:', err.message);
            }
          } else {
            console.log(`\n[BuyerAgent] 🤝 Peer ${coordinatorId.slice(0, 16)} was elected coordinator.`);
            console.log('[BuyerAgent] Waiting for final offer from coordinator...');
          }
        }
      }
    }
    
  }, 1000);
}

async function revealToCluster(peers, rawIntent, hash) {
  const topo = await axl.getTopology();
  const myPeerId = topo.our_public_key;

  for (const peerId of peers) {
    if (peerId !== myPeerId) {
      console.log(`[BuyerAgent] 🔐 Sending A2A reveal to peer ${peerId.slice(0, 16)}...`);
      try {
        await axl.sendDirect(peerId, {
          type: 'INTENT_REVEAL',
          hash,
          rawIntent
        });
        console.log(`[BuyerAgent] ✅ A2A reveal sent successfully to ${peerId.slice(0, 16)}...`);
      } catch (err) {
        console.error(`[BuyerAgent] ❌ Failed to send reveal to ${peerId.slice(0, 16)}: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  🛒  HUDDLE — Buyer Agent (Phase 2)');
  console.log('═══════════════════════════════════════════════');

  const ready = await axl.waitForReady(60, 1000);
  if (!ready) {
    console.error('[Buyer] ❌ AXL node not reachable on port', BUYER_API_PORT);
    process.exit(1);
  }

  const { hash, rawIntent } = await submitIntent('LG-OLED-65', 1800, 5);
  pollForCoalition(hash, rawIntent);
}

// Ensure the functions can be required by tests, but also run if invoked directly
if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

// ─── Graceful Shutdown ───────────────────────────────────────
process.on('uncaughtException', (err) => {
  console.error('\n[BuyerAgent] ❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n[BuyerAgent] ❌ Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('\n[BuyerAgent] Shutting down...');
  process.exit(0);
});
