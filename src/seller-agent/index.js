/**
 * Seller Agent — Huddle
 * 
 * Phase 3: Coordinator Negotiation
 */

const AXLClient = require('../axl/client');
const { ethers } = require('ethers');
const crypto = require('crypto');

const SELLER_API_PORT = 9012;
const axl = new AXLClient(SELLER_API_PORT);

// We generate an ephemeral wallet representing the seller for testing locally
// In production, this would come from process.env.SELLER_PRIVATE_KEY
const SELLER_PRIVATE_KEY = process.env.SELLER_PRIVATE_KEY || '0x' + crypto.randomBytes(32).toString('hex');
const sellerWallet = new ethers.Wallet(SELLER_PRIVATE_KEY);

const BULK_TIERS = {
  3: 0.10,  // 10% discount for 3+ buyers (adjusted for local demo k=3)
  5: 0.15,  // 15% for 5+
  10: 0.20  // 20% for 10+
};

const RETAIL_PRICES = {
  'LG-OLED-65': 1800
};

async function listenForOffers() {
  console.log('═══════════════════════════════════════════════');
  console.log('  🏪  HUDDLE — Seller Agent (Phase 3)');
  console.log('═══════════════════════════════════════════════');
  
  const ready = await axl.waitForReady(60, 1000);
  if (!ready) {
    console.error('[SellerAgent] ❌ AXL node not reachable on port', SELLER_API_PORT);
    process.exit(1);
  }

  const topo = await axl.getTopology();
  console.log('[SellerAgent] ✅ AXL node online');
  console.log('[SellerAgent] Seller Public Key:', topo.our_public_key);
  console.log('[SellerAgent] Wallet Address:', sellerWallet.address);
  console.log('\n[SellerAgent] 👂 Listening for incoming BULK_OFFER messages on AXL...\n');

  axl.startPolling(async (msg) => {
    const parsed = AXLClient.parseMessage(msg.body);
    
    if (parsed.type === 'BULK_OFFER') {
      const fromPeerId = parsed.from || msg.fromPeerId;
      console.log(`[SellerAgent] 📥 ═══ RECEIVED BULK OFFER ═══`);
      console.log(`[SellerAgent]    From Coordinator: ${fromPeerId.slice(0, 16)}...`);
      console.log(`[SellerAgent]    Product: ${parsed.productId}`);
      console.log(`[SellerAgent]    Coalition Size: ${parsed.coalitionSize}`);
      console.log(`[SellerAgent]    Requested Price: $${parsed.offerPrice}`);
      
      await handleOffer(parsed, fromPeerId);
    }
  }, 1000);
}

async function handleOffer(offer, fromPeerId) {
  const retail = RETAIL_PRICES[offer.productId] || 1800;
  
  // Find applicable discount tier
  let discount = 0;
  for (const threshold of Object.keys(BULK_TIERS).map(Number).sort((a,b) => b-a)) {
    if (offer.coalitionSize >= threshold) {
      discount = BULK_TIERS[threshold];
      break;
    }
  }

  const calculatedFinalPrice = Math.round(retail * (1 - discount));
  
  // Accept if requested price is >= our calculated discounted price, otherwise counter
  const accepted = offer.offerPrice >= calculatedFinalPrice;
  const finalPrice = accepted ? Number(offer.offerPrice) : calculatedFinalPrice;

  if (accepted) {
    console.log(`[SellerAgent] ✅ Accepted offer for $${finalPrice} (Discount applied: ${discount*100}%)`);
  } else {
    console.log(`[SellerAgent] 🔄 Countering with $${finalPrice} (Requested $${offer.offerPrice} too low)`);
  }

  // Sign the acceptance to form an EIP-712-style agreement
  const msgHash = ethers.utils.solidityKeccak256(
    ['string', 'uint256', 'uint256'],
    [offer.productId, finalPrice, offer.validUntil]
  );
  const signature = await sellerWallet.signMessage(ethers.utils.arrayify(msgHash));

  console.log(`[SellerAgent] 📤 Sending response to Coordinator via A2A...`);

  await axl.sendDirect(fromPeerId, {
    type: 'OFFER_RESPONSE',
    status: accepted ? 'ACCEPTED' : 'COUNTER',
    finalPrice,
    counterPrice: finalPrice,
    signature,
    validUntil: offer.validUntil
  });
  
  console.log(`[SellerAgent] ✅ Response sent!\n`);
}

// ─── Graceful Shutdown ───────────────────────────────────────
process.on('SIGINT', () => {
  console.log('\n[SellerAgent] Shutting down...');
  process.exit(0);
});

listenForOffers();
