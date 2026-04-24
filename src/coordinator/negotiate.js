const AXLClient = require('../axl/client');

async function runNegotiation(axl, coalition, sellerPeerId) {
  const { members, productId, targetPrice } = coalition;

  // Step 1: Send offer to seller via A2A
  console.log('[Coordinator] Sending offer to seller...');
  const topo = await axl.getTopology();
  const ourPeerId = topo.our_public_key;

  await axl.sendDirect(sellerPeerId, {
    type: 'BULK_OFFER',
    coalitionSize: members.length,
    productId,
    offerPrice: targetPrice,
    from: ourPeerId,
    validUntil: Math.floor(Date.now() / 1000) + 1800 // 30 min window
  });

  // Step 2: Wait for seller response
  const response = await waitForMessage(axl, sellerPeerId, 'OFFER_RESPONSE', 30000);
  if (!response) throw new Error('Seller did not respond in time');

  if (response.status === 'ACCEPTED') {
    console.log('[Coordinator] Seller accepted at', response.finalPrice);
    // Step 3: Broadcast signed offer to coalition
    for (const memberId of members) {
      if (memberId !== ourPeerId) {
        try {
          await axl.sendDirect(memberId, {
            type: 'COALITION_OFFER',
            finalPrice: response.finalPrice,
            sellerSig: response.signature,
            productId,
            validUntil: response.validUntil
          });
        } catch(err) {
           console.log(`[Coordinator] Could not forward offer to ${memberId.slice(0, 16)}`);
        }
      } else {
        // Log it locally for the coordinator
        console.log(`[Coordinator] 🌟 Final Deal Secured for ourselves! Amount: $${response.finalPrice}. Waiting for KeeperHub x402 commit.`);
      }
    }
    return response;
  } else if(response.status === 'COUNTER') {
    // Counter-offer handling
    console.log('[Coordinator] Seller countered at', response.counterPrice);
    coalition.targetPrice = response.counterPrice;
    return runNegotiation(axl, coalition, sellerPeerId); // retry once
  }
}

async function waitForMessage(axl, fromPeerId, type, timeoutMs) {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      axl.removeListener('message', listener);
      resolve(null);
    }, timeoutMs);

    const listener = (msg) => {
      if(msg.fromPeerId === fromPeerId) {
        const parsed = AXLClient.parseMessage(msg.body);
        if(parsed.type === type) {
          clearTimeout(timeout);
          axl.removeListener('message', listener);
          resolve(parsed);
        }
      }
    };
    
    axl.on('message', listener);
  });
}

module.exports = { runNegotiation };
