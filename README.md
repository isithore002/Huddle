# Huddle — Intent-Matched Bulk Purchase Coalitions

> ETHGlobal OpenAgents 2026 · Gensyn AXL + 0G iNFT + KeeperHub x402

Agents find strangers who want the same product, form a coalition of ≥10 buyers, negotiate a bulk discount with the seller, then commit payment atomically.

## Architecture

```
┌─────────────────┐           AXL P2P Mesh           ┌─────────────────┐
│  Buyer Agent(s)  │ ◄──────── Encrypted A2A ────────► │  Seller Agent   │
│  Port :9002      │           (Yggdrasil E2E)         │  Port :9012     │
│  Node.js Process │                                   │  Node.js Process│
└─────────────────┘                                   └─────────────────┘
        │                                                       │
        ▼                                                       ▼
   0G iNFT (ERC-7857)                                KeeperHub x402
   Encrypted buyer prefs                              Atomic N-party
   on 0G Storage                                      payment commit
```

## Quick Start

### Prerequisites
- Node.js ≥ 18
- Go 1.25.x (for building AXL)

### 1. Build AXL Binary
```bash
git clone https://github.com/gensyn-ai/axl.git axl-build
cd axl-build && go build -o node.exe ./cmd/node/
cp node.exe ../axl-node.exe
```

### 2. Generate Keys
```bash
openssl genpkey -algorithm ed25519 -out configs/buyer-private.pem
openssl genpkey -algorithm ed25519 -out configs/seller-private.pem
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Stack (separate terminals)
The agents now auto-spawn the AXL mesh nodes.
```bash
# Terminal 1 — Seller Agent (Marketplace)
npm run seller

# Terminal 2 — Buyer Agent & Next.js Server
npm run buyer

# Terminal 3 — Dashboard UI
npm run ui
```

### 6. Verify
```bash
npm run test:axl
```

## Sponsor Integrations
- **Gensyn AXL:** buyer-agent (port 9002) and seller-agent (port 9012)
  are separate processes communicating over AXL P2P mesh
- **0G iNFT:** minted on Galileo testnet → [explorer link](https://chainscan-galileo.0g.ai/tx/0xbf55c83bb9a32281a550d82ca09d6739858c123e8a12d5b2905fade9c3648980)
- **KeeperHub x402:** atomic commit txhash → [Base Sepolia link](https://sepolia.basescan.org/tx/0xmockTxHash2697d8cb4a4dbc6d)

## Demo Video
[Link to Video Submission — 3 Minutes]

## Architecture
See `docs/context.md` and `docs/CLAUDE.md` for full architecture.

- Intent hash: `SHA-256(product_id ‖ max_price ‖ deadline ‖ nonce)`
- Coalition threshold: k=10 (k=3 for local demo)
- Every inter-agent message crosses separate AXL node processes
- No function call substitutes for mesh communication

## License
MIT
