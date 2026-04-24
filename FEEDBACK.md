# KeeperHub Feedback Report — Huddle ETHGlobal OpenAgents 2026

## Friction 1: Multi-leg atomic job documentation gap
**Severity:** Medium
**Description:** The KeeperHub docs do not specify the maximum job timeout
for multi-leg ATOMIC_BATCH workflows. When building the N-party commit,
we had to guess at timeout semantics.
**Suggested Fix:** Add a dedicated section in docs: "Multi-leg jobs: timeout,
retry, and rollback semantics" with example payload.
**Reproducible:** Yes — attempt to configure timeoutMs > 60000 returns
undocumented 422 error.

## Friction 2: x402 Base Sepolia testnet faucet not linked
**Severity:** Low
**Description:** The x402 getting-started guide does not link to a Base
Sepolia USDC faucet, blocking first-time hackathon builders for ~30 mins.
**Suggested Fix:** Add faucet link: https://faucet.circle.com (USDC Base Sepolia)

## Contact: @huddle_builder (Discord)
