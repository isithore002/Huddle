// Simulate: 3 buyers commit, 1 drops → verify nobody pays
const { executeAtomicCommit } = require('../src/keeper/atomicCommit');
require('dotenv').config();
const crypto = require('crypto');

const generateKey = () => '0x' + crypto.randomBytes(32).toString('hex');
const generateAddr = () => '0x' + crypto.randomBytes(20).toString('hex');

const buyers = [
  { address: generateAddr(), privateKey: process.env.BUYER1_KEY || generateKey() },
  { address: generateAddr(), privateKey: process.env.BUYER2_KEY || generateKey() },
  { address: generateAddr() + '_DROPOUT', privateKey: null } // simulates dropout
];

async function run() {
  console.log("=== SCENARIO 1: ATOMIC COMMIT WITH DROPOUT ===");
  const result1 = await executeAtomicCommit({
    buyers,
    dealTerms: { pricePerUnit: 1520, sellerAddress: '0xSeller...' },
    sellerSig: '0xmockSignature000111',
    productId: 'LG-OLED-65'
  });
  console.log('Result 1:', result1);
  // Expected: { success: false, reason: 'buyer_dropout' }

  console.log("\n=== SCENARIO 2: SUCCESSFUL ATOMIC COMMIT ===");
  buyers[2].privateKey = generateKey(); // Fix the dropout
  const result2 = await executeAtomicCommit({
    buyers,
    dealTerms: { pricePerUnit: 1520, sellerAddress: '0xSeller...' },
    sellerSig: '0xmockSignature000111',
    productId: 'LG-OLED-65'
  });
  console.log('Result 2:', result2);
}

run().catch(console.error);
