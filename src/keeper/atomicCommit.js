const { createPaymentClient } = require('./x402Client');

async function executeAtomicCommit({ buyers, dealTerms, sellerSig, productId }) {
  console.log(`\n═══════════════════════════════════════════════`);
  console.log(`  🔗  HUDDLE — KeeperHub x402 Atomic Commit`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`[KeeperHub] Initiating atomic EVM commit for ${buyers.length} buyers`);

  // Build KeeperHub job payload
  const job = {
    type: 'ATOMIC_BATCH',
    legs: buyers.map(buyer => ({
      type: 'x402_payment',
      from: buyer.address,
      to: dealTerms.sellerAddress,
      amount: dealTerms.pricePerUnit,
      currency: 'USDC',
      chain: 'base-sepolia',
      metadata: { productId, buyerAddress: buyer.address }
    })),
    conditions: {
      allOrNothing: true,           // tier evaporates if any drop
      timeoutMs: 30000,             // 30 second window
      retryAttempts: 3
    },
    sellerSig,
    dealTerms
  };

  try {
    const api = await createPaymentClient(process.env.COORDINATOR_PRIVATE_KEY || require('crypto').randomBytes(32).toString('hex'));
    
    // Simulate dropouts for testing purposes by observing the job input
    // If a buyer has no privateKey, it simulates a failure in the x402 layer
    const dropout = buyers.find(b => !b.privateKey);
    if (dropout) {
      console.log(`[KeeperHub] ⚠️ Detected dropout during x402 signing phase: ${dropout.address}`);
      console.log('[KeeperHub] 🔄 Rolling back transaction. Entire coalition tier evaporates.');
      return { success: false, reason: 'buyer_dropout' };
    }
    
    const response = await api.post('/v1/jobs', job);

    if (response.data && response.data.status === 'SUCCESS') {
      console.log('✅ [KeeperHub] All', buyers.length, 'buyers successfully committed!');
      console.log('🔍 [KeeperHub] TxHash:', response.data.txHash);
      return { success: true, txHash: response.data.txHash };
    } else {
      const reason = response.data ? response.data.reason : 'Unknown API failure';
      console.log('❌ [KeeperHub] Commit failed, rolling back. Reason:', reason);
      return { success: false, reason };
    }
  } catch (err) {
    console.error('❌ [KeeperHub] Critical Error:', err.message);
    return { success: false, reason: err.message };
  }
}

module.exports = { executeAtomicCommit };
