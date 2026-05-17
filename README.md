<div align="center">

<img src="https://img.shields.io/badge/Built%20on-Base-0052FF?style=for-the-badge&logo=coinbase&logoColor=white" />
<img src="https://img.shields.io/badge/Token-CWAR-c9a84c?style=for-the-badge" />
<img src="https://img.shields.io/badge/USDC-Payments-2775CA?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Live-27ae60?style=for-the-badge" />

#  ChessWar

**The on-chain chess battleground. Play. Stake. Conquer.**

[Play Now](https://chesswar.vercel.app) · [Smart Contracts](#smart-contracts) · [Tokenomics](#cwar-token) · [Roadmap](#roadmap)

</div>

---

## Overview

ChessWar is a chess mini-app built on **Base** that turns every game into a financial battle. Players compete in PvP matches, wager USDC, collect War NFTs for point multipliers, and earn **CWAR tokens** — rewarded to the warriors who dominate the leaderboard.

Every battle counts. Every point matters.

---

## How It Works

| Action | Reward |
|---|---|
| Play any game | +10 War Points |
| Win a bet battle | +USDC payout + 5× points |
| Hold a Soldier NFT | 2× all points |
| Hold a Knight NFT | 3× all points |
| Hold a Commander NFT | 4× all points |
| Hold a Warlord NFT | 5× all points |
| Refer a warrior | +1,000 War Points |
| Top leaderboard | CWAR token airdrop |

---

## Game Modes

** PvP Battle** — Challenge real opponents online. Standard chess rules, chess.com style timers.

** vs AI** — Four difficulty tiers: Recruit, Soldier, General, Warlord. Powered by minimax + alpha-beta pruning engine.

** Bet Battle** — Stake USDC against an opponent. Minimum 0.10 USDC, no maximum. Funds held in smart contract escrow. Winner receives 2× stake minus 2% platform fee. All bet games earn **5× war points**.

** Tournament** — 5 USDC entry fee. Bracket play with USDC prize pools. Top 3 warriors split the pot: 50% / 30% / 20%.

---

## War NFTs

Four tiers of on-chain NFTs minted on Base. Each tier unlocks a permanent point multiplier applied to every game you play.

| NFT | Multiplier | Mint Price |
|---|---|---|
| Soldier  | 2× | 0.005 ETH |
| Knight  | 3× | 0.010 ETH |
| Commander  | 4× | 0.025 ETH |
| Warlord  | 5× | 0.050 ETH |

Your highest-tier NFT determines your active boost. Boosts stack with bet game multipliers.

---

## CWAR Token

> **Total Supply: 1,000,000,000 CWAR**

| Allocation | Amount | Purpose |
|---|---|---|
| Airdrop | 400,000,000 | Top point earners at launch |
| Liquidity | 250,000,000 | Base DEX pool |
| Team | 200,000,000 | 2-year vesting |
| Ecosystem | 100,000,000 | Grants & partnerships |
| Tournaments | 50,000,000 | Prize pool reserve |

**Airdrop formula:** `(your points ÷ total points) × 400,000,000`

Points earned before the snapshot determine your allocation. Play now.

---

## Smart Contracts

All contracts deployed on Base. Audited before mainnet launch.

| Contract | Description |
|---|---|
| `ChessWarBet.sol` | USDC escrow · auto-payout · 2% fee · oracle-verified results |
| `ChessWarNFT.sol` | ERC-721 · 4 tiers · on-chain boost tracking |
| `CWARToken.sol` | ERC-20 · 1B supply · transfer lock until TGE · merkle airdrop |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Zustand, react-chessboard |
| Chess Engine | chess.js + custom minimax AI |
| Blockchain | Base (Coinbase L2), Ethers.js v6 |
| Payments | USDC (ERC-20) on Base |
| Contracts | Solidity 0.8.20 |
| Deployment | Vercel |

---

## Roadmap

- [x] Core chess engine with AI (4 difficulty levels)
- [x] USDC bet games with smart contract escrow
- [x] War NFT minting with point multipliers
- [x] Tournament system with prize pools
- [x] Referral & points system
- [ ] WebSocket real-time PvP matchmaking
- [ ] CWAR token launch on Base
- [ ] Mobile app (iOS & Android)
- [ ] Ranked leaderboard seasons
- [ ] DAO governance via CWAR

---

## Local Development

```bash
git clone https://github.com/ogharka/chesswar
cd chesswar
npm install
npm start
```

App runs at `http://localhost:3000` — connect MetaMask to Base Sepolia for testing.

---

## Security

- No private keys stored in code or repository
- USDC held in audited smart contract escrow, never in a hot wallet
- Oracle signature verification for bet game results
- All contracts to be audited before Base mainnet deployment

---

<div align="center">

Built by [@ogharka](https://github.com/ogharka) · [Twitter](https://x.com/mogharka)

**War never ends. **

</div>
