const crypto = require('crypto');

function hashIntent({ productId, maxPrice, deadline, nonce }) {
  const raw = `${productId}||${maxPrice}||${deadline}||${nonce}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function makeNonce() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { hashIntent, makeNonce };
