/**
 * AXL HTTP Client Wrapper
 * 
 * Wraps the AXL node's local HTTP API for cross-node communication.
 * 
 * Real AXL API endpoints (from docs.gensyn.ai):
 *   GET  /topology          → { our_public_key, our_ipv6, peers: [...] }
 *   POST /send              → Send direct message (X-Destination-Peer-Id header)
 *   GET  /recv              → Receive queued messages
 */

const axios = require('axios');
const EventEmitter = require('events');

class AXLClient extends EventEmitter {
  /**
   * @param {number} apiPort - The AXL node's HTTP API port (e.g. 9002 for buyer, 9012 for seller)
   * @param {string} [bindAddr='127.0.0.1'] - The AXL node's bridge_addr
   */
  constructor(apiPort, bindAddr = '127.0.0.1') {
    super();
    this.base = `http://${bindAddr}:${apiPort}`;
    this.apiPort = apiPort;
    this.pollIntervalMs = 1000;
    this._polling = false;
    this._pollTimer = null;
  }

  // ─── Identity ──────────────────────────────────────────────

  /**
   * Get this node's topology info (public key, IPv6, peers).
   * @returns {Promise<{our_public_key: string, our_ipv6: string, peers: Array}>}
   */
  async getTopology() {
    const res = await axios.get(`${this.base}/topology`);
    return res.data;
  }

  /**
   * Get this node's public key (identity).
   * @returns {Promise<string>}
   */
  async getIdentity() {
    const topo = await this.getTopology();
    return topo.our_public_key;
  }

  // ─── Broadcast ─────────────────────────────────────────────

  /**
   * Broadcast a message to all known peers in the topology.
   * Emulates GossipSub broadcast using A2A direct messaging.
   */
  async broadcast(channel, message) {
    const topo = await this.getTopology();
    const allPeers = new Set();
    
    if (topo.peers) {
      topo.peers.forEach(p => { if (p.public_key) allPeers.add(p.public_key); });
    }
    if (topo.tree) {
      topo.tree.forEach(node => {
        if (node.public_key !== topo.our_public_key) allPeers.add(node.public_key);
      });
    }

    const payload = { _channel: channel, ...message };

    for (const peer of allPeers) {
      try {
        await this.sendDirect(peer, payload);
      } catch (err) {
        // ignore individual peer send errors in broadcast
      }
    }
  }

  // ─── Send ──────────────────────────────────────────────────

  /**
   * Send a direct encrypted message to a specific peer by their public key.
   * This is A2A-level communication — only the target peer can decrypt.
   * 
   * @param {string} peerPublicKey - The destination peer's public key
   * @param {string|object} message - Message payload (objects are JSON-stringified)
   */
  async sendDirect(peerPublicKey, message) {
    const payload = typeof message === 'object' ? JSON.stringify(message) : String(message);
    
    await axios.post(`${this.base}/send`, payload, {
      headers: {
        'X-Destination-Peer-Id': peerPublicKey,
        'Content-Type': 'application/json',
      },
    });
  }

  // ─── Receive ───────────────────────────────────────────────

  /**
   * Receive a single queued message (blocking-ish: AXL may hold the connection).
   * Returns the message body + sender's public key from X-From-Peer-Id header.
   * 
   * @returns {Promise<{body: string, fromPeerId: string}|null>}
   */
  async receiveOne() {
    try {
      const res = await axios.get(`${this.base}/recv`, {
        timeout: 10000,
        responseType: 'text', // AXL returns application/octet-stream
        validateStatus: (s) => s < 500,
      });

      // No message queued — AXL may return 204, 404, or empty body
      if (res.status === 204 || res.status === 404 || !res.data) {
        return null;
      }

      return {
        body: String(res.data),
        fromPeerId: res.headers['x-from-peer-id'] || 'unknown',
      };
    } catch (err) {
      // Timeout = no message available (long-poll expired)
      if (err.code === 'ECONNABORTED' || err.code === 'ERR_CANCELED') return null;
      throw err;
    }
  }

  /**
   * Parse a received message body as JSON, with safe fallback.
   * @param {string} body 
   * @returns {object|string}
   */
  static parseMessage(body) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  // ─── Polling ───────────────────────────────────────────────

  /**
   * Start polling for incoming messages. Calls onMessage(msg) for each received message.
   * 
   * @param {function({body: string, fromPeerId: string}): void} onMessage - Message handler
   * @param {number} [intervalMs=1000] - Poll interval in milliseconds
   */
  startPolling(onMessage, intervalMs = 1000) {
    if (this._polling) return;
    this._polling = true;
    this.pollIntervalMs = intervalMs;

    const poll = async () => {
      if (!this._polling) return;

      try {
        const msg = await this.receiveOne();
        if (msg) {
          if (onMessage) onMessage(msg);
          this.emit('message', msg);
          
          // If we got a message, immediately poll again (there may be more)
          if (this._polling) {
            setImmediate(poll);
            return;
          }
        }
      } catch (err) {
        // Connection refused = node not ready yet, silently retry
        if (err.code !== 'ECONNREFUSED') {
          console.error(`[AXL:${this.apiPort}] Poll error:`, err.message);
        }
      }

      if (this._polling) {
        this._pollTimer = setTimeout(poll, this.pollIntervalMs);
      }
    };

    poll();
  }

  /**
   * Stop the polling loop.
   */
  stopPolling() {
    this._polling = false;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  // ─── Health ────────────────────────────────────────────────

  /**
   * Check if the AXL node is reachable.
   * @returns {Promise<boolean>}
   */
  async isHealthy() {
    try {
      await this.getTopology();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Wait for the AXL node to become reachable, with retries.
   * @param {number} [maxRetries=30] - Max number of retries
   * @param {number} [intervalMs=1000] - Retry interval
   * @returns {Promise<boolean>}
   */
  async waitForReady(maxRetries = 30, intervalMs = 1000) {
    for (let i = 0; i < maxRetries; i++) {
      if (await this.isHealthy()) return true;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    return false;
  }
}

module.exports = AXLClient;
