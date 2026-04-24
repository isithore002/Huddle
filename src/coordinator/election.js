function electCoordinator(peerIds) {
  // Round-robin: sort peer IDs lexicographically, pick index 0
  const sorted = [...peerIds].sort();
  return sorted[0];
}

module.exports = { electCoordinator };
