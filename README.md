# ⚔️ ChessWar

> Chess battles on Base. USDC stakes. War NFTs. CWAR token airdrop.

**ChessWar** is a full chess mini-app built on Base where every battle earns war points toward the CWAR token airdrop.

## Features

- ⚔️ PvP battles online + vs AI (Recruit → Warlord difficulty)
- 💰 USDC wagers — min 0.10, no max — smart contract escrow
- ⭐ War points — 10/game, 5× on bet battles, NFT multiplier
- 🛡️ War NFTs — Soldier/Knight/Commander/Warlord (2×–5× boost)
- 🏆 Tournaments — 5 USDC entry, USDC prize pools
- 🪂 1B CWAR token launch — top point earners get the airdrop
- 👥 Recruit & earn — 1,000 pts per referral

## Deploy (5 minutes)

```bash
npm install
npm run build
```

Deploy to Vercel — connect GitHub repo, auto-detects settings.

## Smart Contracts (Base)

- `ChessWarBet.sol` — USDC escrow, auto-payout, 2% fee
- `ChessWarNFT.sol` — ERC-721 war NFTs with on-chain boost
- `CWARToken.sol` — 1B supply + merkle airdrop claim

Deploy via [Remix IDE](https://remix.ethereum.org) on Base Sepolia first.

## Built by [@ogharka](https://github.com/ogharka)

Built on Base · USDC payments · War never ends ⚔️
