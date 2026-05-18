// ── Tournament ────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useStore } from '../../store/useStore';
import { syncNFTBoost } from '../../utils/api';
import toast from 'react-hot-toast';

const NFT_ABI = [
  'function mint(uint8 tierIndex) payable',
  'function getBoostMultiplier(address) view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
];

// Tier index: 0=Soldier, 1=Knight, 2=Commander, 3=Warlord
const TIER_PRICES = {
  1: '0.005', // Soldier
  2: '0.01',  // Knight
  3: '0.025', // Commander
  4: '0.05',  // Warlord
};

const TOURS = [
  { id: 't1', name: 'Weekly War Open',    entry: 5, prize: 320,  players: 34,  max: 64,  format: 'Swiss 7R',   tc: '3+0', status: 'open', starts: '2h 14m', prizes: [160, 96, 64]   },
  { id: 't2', name: 'ChessWar Champions', entry: 5, prize: 1200, players: 128, max: 128, format: 'Knockout',   tc: '5+0', status: 'full', starts: '48m',    prizes: [600, 360, 240] },
  { id: 't3', name: 'Sunday Siege',       entry: 5, prize: 80,   players: 6,   max: 16,  format: 'Round Robin',tc: '10+0',status: 'open', starts: '23h',    prizes: [40, 24, 16]   },
  { id: 't4', name: 'Blitz Warfare',      entry: 5, prize: 500,  players: 48,  max: 128, format: 'Swiss 9R',   tc: '1+0', status: 'open', starts: '5h 30m', prizes: [250, 150, 100] },
];

export function TournamentPage() {
  const { joinedTournaments, joinTournament } = useStore();
  const [joining,   setJoining]   = useState(null);
  const [confirmT,  setConfirmT]  = useState(null); // tournament pending confirmation

  const handleEnlist = (t) => {
    if (t.status === 'full') { toast.error('Tournament is full!'); return; }
    if (joinedTournaments.find((j) => j.id === t.id)) { toast('Already registered!'); return; }
    setConfirmT(t); // show confirmation modal
  };

  const confirmJoin = async () => {
    const t = confirmT;
    setConfirmT(null);
    setJoining(t.id);
    // Simulate tx delay — replace with real USDC contract call on deployment
    await new Promise((r) => setTimeout(r, 1800));
    joinTournament(t.id);
    toast.success(`Registered for "${t.name}" — 5 USDC entry confirmed!`);
    setJoining(null);
  };

  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>War Tournaments</h1>
        <p>Entry: <strong>5 USDC</strong> · All prizes in USDC · Smart contract escrow</p>
      </div>
      <div className="tourney-grid">
        {TOURS.map((t) => {
          const joined = !!joinedTournaments.find((j) => j.id === t.id);
          const pct = Math.round((t.players / t.max) * 100);
          return (
            <div key={t.id} className={`tourney-card ${joined ? 'tc-joined' : ''}`}>
              <div className="tc-top">
                <div>
                  <h3 className="tc-name">{t.name}</h3>
                  <span className={`tc-status ${t.status}`}>{t.status === 'full' ? 'Full' : 'Open'}</span>
                </div>
                <div className="tc-prize-badge">{t.prize} USDC</div>
              </div>
              <div className="tc-details">
                <div className="tc-detail"><span>Format</span><strong>{t.format}</strong></div>
                <div className="tc-detail"><span>Time</span><strong>{t.tc}</strong></div>
                <div className="tc-detail"><span>Warriors</span><strong>{t.players}/{t.max}</strong></div>
                <div className="tc-detail"><span>Starts</span><strong>{t.starts}</strong></div>
              </div>
              <div className="tc-bar-wrap">
                <div className="tc-bar"><div className="tc-fill" style={{ width: `${pct}%` }} /></div>
                <span className="tc-pct">{pct}%</span>
              </div>
              <div className="tc-prizes">🥇 {t.prizes[0]} · 🥈 {t.prizes[1]} · 🥉 {t.prizes[2]} USDC</div>
              <div className="tc-foot">
                {joined ? (
                  <div className="tc-joined-badge">✓ Enlisted</div>
                ) : (
                  <button className={`tc-join-btn ${t.status === 'full' ? 'tc-full' : ''}`}
                    onClick={() => handleEnlist(t)} disabled={joining === t.id || t.status === 'full'}>
                    {joining === t.id ? 'Processing…' : t.status === 'full' ? 'Full' : 'Register · 5 USDC'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tourney-rules">
        <h3>Rules</h3>
        <ul>
          <li>5 USDC entry locked in Base smart contract</li>
          <li>Prize: 50% · 30% · 20% to top 3 players</li>
          <li>2% platform fee from prize pool</li>
          <li>No-shows forfeit entry — no refund</li>
          <li>All games earn war points × your NFT boost</li>
        </ul>
      </div>

      {/* Confirmation modal */}
      {confirmT && (
        <div className="modal-overlay" onClick={() => setConfirmT(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Registration</h3>
            <p>You are about to register for:</p>
            <div className="confirm-tour-name">{confirmT.name}</div>
            <div className="confirm-details">
              <div className="cd-row"><span>Entry fee</span><strong>5 USDC</strong></div>
              <div className="cd-row"><span>Prize pool</span><strong>{confirmT.prize} USDC</strong></div>
              <div className="cd-row"><span>Format</span><strong>{confirmT.format}</strong></div>
              <div className="cd-row"><span>Time control</span><strong>{confirmT.tc}</strong></div>
              <div className="cd-row"><span>Starts in</span><strong>{confirmT.starts}</strong></div>
            </div>
            <p className="confirm-note">
              5 USDC will be deducted from your in-app balance and locked in the smart contract until the tournament ends.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setConfirmT(null)}>Cancel</button>
              <button className="confirm-ok" onClick={confirmJoin}>Confirm · 5 USDC</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Leaderboard ───────────────────────────────────────────────────────────
const MOCK_LEADERS = [
  { rank: 1, name: 'WarLord_X',    addr: '0xf3a2…9b1c', pts: 94200, games: 412, wr: 74, boost: '5×' },
  { rank: 2, name: 'BaseGeneral',  addr: '0x7b1e…3a9f', pts: 81700, games: 389, wr: 70, boost: '4×' },
  { rank: 3, name: 'CryptoKing',   addr: '0x2d9c…f55e', pts: 76300, games: 301, wr: 68, boost: '4×' },
  { rank: 4, name: 'OnchainBlade', addr: '0xa4f7…18bc', pts: 58900, games: 278, wr: 65, boost: '3×' },
  { rank: 5, name: 'SiegeBreaker', addr: '0x9d5a…c21e', pts: 52100, games: 245, wr: 63, boost: '3×' },
  { rank: 6, name: 'ETHKnight',    addr: '0x61c4…90a3', pts: 44800, games: 198, wr: 61, boost: '2×' },
  { rank: 7, name: 'DeFiWarlord',  addr: '0x8b92…4dc1', pts: 37200, games: 176, wr: 58, boost: '2×' },
  { rank: 8, name: 'ChainRaider',  addr: '0x3a1f…7e04', pts: 31500, games: 154, wr: 56, boost: '1×' },
  { rank: 9, name: 'BlockSlayer',  addr: '0xd7e9…2b67', pts: 26800, games: 132, wr: 54, boost: '1×' },
  { rank: 10,name: 'BaseWarrior',  addr: '0x1a2b…9c34', pts: 21400, games: 109, wr: 51, boost: '1×' },
];

export function LeaderboardPage() {
  const { points, profile, nftBoost } = useStore();
  return (
    <div className="page-wrap">
      <div className="page-header">
        <h1>Leaderboard</h1>
        <p>Top warriors earn the biggest <strong>CWAR token airdrop</strong></p>
      </div>
      <div className="airdrop-banner">
        <div className="ab-left">
          <span className="ab-icon">♟</span>
          <div>
            <strong>CWAR Token Launch · 1,000,000,000 Supply</strong>
            <p>Points you earn now = your airdrop allocation. Keep fighting.</p>
          </div>
        </div>
        <div className="ab-right">
          <div className="ab-supply">1B CWAR</div>
          <div className="ab-sub">Total Supply</div>
        </div>
      </div>
      <div className="your-pos-card">
        <div className="ypc-rank">#{MOCK_LEADERS.length + 1}+</div>
        <div className="ypc-info">
          <strong>{profile.username || 'You'}</strong>
          <span>{points.toLocaleString()} pts · {nftBoost}× boost</span>
        </div>
        <div className="ypc-gap">
          {MOCK_LEADERS[MOCK_LEADERS.length - 1].pts - points > 0
            ? `${(MOCK_LEADERS[MOCK_LEADERS.length - 1].pts - points).toLocaleString()} pts to top 10`
            : '🎉 You\'re in the top 10!'}
        </div>
      </div>
      <table className="lb-table">
        <thead>
          <tr><th>Rank</th><th>Warrior</th><th>War Points</th><th>Battles</th><th>Win %</th><th>Boost</th></tr>
        </thead>
        <tbody>
          {MOCK_LEADERS.map((p) => (
            <tr key={p.rank} className={`lb-row lb-rank-${Math.min(p.rank, 4)}`}>
              <td className="lb-rank">{p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`}</td>
              <td><div className="lb-player"><strong>{p.name}</strong><span>{p.addr}</span></div></td>
              <td className="lb-pts">{p.pts.toLocaleString()}</td>
              <td>{p.games}</td>
              <td>{p.wr}%</td>
              <td className="lb-boost">{p.boost}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────
const NFT_TIERS = [
  { tier: 1, name: 'Soldier',   rarity: 'Common',    price: '0.005 ETH', boost: '2×', color: '#0052FF', bg: '#0A0F1E',
    svg: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="sg" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#1a3a6e"/><stop offset="100%" stop-color="#050a14"/></radialGradient></defs><rect width="300" height="300" fill="#0A0F1E"/><rect width="300" height="300" fill="url(#sg)" opacity="0.6"/><rect x="90" y="240" width="120" height="14" rx="4" fill="#0052FF" opacity="0.9"/><rect x="100" y="228" width="100" height="14" rx="3" fill="#0052FF" opacity="0.8"/><rect x="128" y="180" width="44" height="52" rx="4" fill="#0052FF" opacity="0.85"/><rect x="118" y="170" width="64" height="16" rx="4" fill="#1a6bff" opacity="0.9"/><circle cx="150" cy="140" r="36" fill="#0052FF"/><circle cx="150" cy="140" r="28" fill="#1a6bff"/><circle cx="150" cy="140" r="18" fill="#4D8BFF"/><circle cx="140" cy="130" r="7" fill="#fff" opacity="0.15"/><circle cx="150" cy="140" r="44" fill="none" stroke="#0052FF" stroke-width="1" opacity="0.4"/><rect x="110" y="58" width="80" height="26" rx="6" fill="#0039B3" opacity="0.9"/><text x="150" y="76" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#7DB8FF">SOLDIER</text><rect x="116" y="258" width="68" height="20" rx="10" fill="#0039B3"/><text x="150" y="272" text-anchor="middle" font-family="system-ui" font-size="11" fill="#7DB8FF">2x BOOST</text></svg>` },
  { tier: 2, name: 'Knight',    rarity: 'Uncommon',  price: '0.01 ETH',  boost: '3×', color: '#05B169', bg: '#0A1A0A',
    svg: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="kg" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#0d3d0d"/><stop offset="100%" stop-color="#030a03"/></radialGradient></defs><rect width="300" height="300" fill="#0A1A0A"/><rect width="300" height="300" fill="url(#kg)" opacity="0.6"/><rect x="80" y="238" width="140" height="14" rx="4" fill="#05B169" opacity="0.9"/><rect x="95" y="226" width="110" height="14" rx="3" fill="#05B169" opacity="0.8"/><rect x="130" y="185" width="50" height="45" rx="4" fill="#05B169" opacity="0.85"/><path d="M118 185 Q108 165 112 145 Q115 125 130 118 Q145 112 165 118 Q185 125 188 148 Q190 168 178 182 Q168 192 155 194 Q138 196 118 185Z" fill="#05B169"/><path d="M108 165 Q95 168 92 178 Q90 188 100 192 Q112 196 122 188 Q130 182 128 170 Q120 162 108 165Z" fill="#049A5C"/><circle cx="162" cy="145" r="8" fill="#0A1A0A"/><circle cx="164" cy="143" r="3" fill="#049A5C"/><path d="M165 118 Q175 100 172 80 Q169 62 160 55 Q148 50 138 58 Q128 68 130 85 Q132 100 130 118" fill="#049A5C" opacity="0.8"/><rect x="106" y="50" width="88" height="26" rx="6" fill="#033d1f" opacity="0.9"/><text x="150" y="68" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#4DEBA0">KNIGHT</text><rect x="112" y="256" width="76" height="20" rx="10" fill="#033d1f"/><text x="150" y="270" text-anchor="middle" font-family="system-ui" font-size="11" fill="#4DEBA0">3x BOOST</text></svg>` },
  { tier: 3, name: 'Commander', rarity: 'Rare',       price: '0.025 ETH', boost: '4×', color: '#8B5CF6', bg: '#160A1A',
    svg: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="cg" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#3d0d4a"/><stop offset="100%" stop-color="#0a030d"/></radialGradient></defs><rect width="300" height="300" fill="#160A1A"/><rect width="300" height="300" fill="url(#cg)" opacity="0.7"/><path d="M150 58 L218 88 L218 165 Q218 210 150 248 Q82 210 82 165 L82 88 Z" fill="#8B5CF6" opacity="0.9"/><path d="M150 72 L206 98 L206 163 Q206 202 150 236 Q94 202 94 163 L94 98 Z" fill="#7C3AED"/><path d="M150 86 L194 108 L194 161 Q194 194 150 224 Q106 194 106 161 L106 108 Z" fill="#6D28D9"/><rect x="140" y="108" width="20" height="90" rx="3" fill="#C4B5FD" opacity="0.9"/><rect x="115" y="145" width="70" height="20" rx="3" fill="#C4B5FD" opacity="0.9"/><rect x="85" y="248" width="130" height="14" rx="4" fill="#8B5CF6" opacity="0.85"/><rect x="88" y="46" width="124" height="26" rx="6" fill="#3B0764" opacity="0.9"/><text x="150" y="64" text-anchor="middle" font-family="system-ui" font-size="11" font-weight="600" fill="#C4B5FD">COMMANDER</text><rect x="110" y="266" width="80" height="20" rx="10" fill="#3B0764"/><text x="150" y="280" text-anchor="middle" font-family="system-ui" font-size="11" fill="#C4B5FD">4x BOOST</text></svg>` },
  { tier: 4, name: 'Warlord',   rarity: 'Legendary',  price: '0.05 ETH',  boost: '5×', color: '#C9A84C', bg: '#0F0A00',
    svg: `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="wg" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#2a1a00"/><stop offset="100%" stop-color="#0a0500"/></radialGradient></defs><rect width="300" height="300" fill="#0F0A00"/><rect width="300" height="300" fill="url(#wg)" opacity="0.8"/><path d="M90 210 Q150 240 210 210 L210 190 Q150 220 90 190 Z" fill="#C9A84C"/><rect x="90" y="175" width="120" height="18" rx="2" fill="#C9A84C"/><rect x="90" y="130" width="120" height="50" fill="#C9A84C"/><polygon points="90,130 90,80 115,115" fill="#B8922A"/><polygon points="115,130 115,95 138,118" fill="#C9A84C"/><polygon points="138,130 138,70 162,70 162,130" fill="#D4B555"/><polygon points="162,130 162,95 185,118" fill="#C9A84C"/><polygon points="185,130 185,80 210,130" fill="#B8922A"/><circle cx="90" cy="80" r="8" fill="#0052FF"/><circle cx="90" cy="80" r="4" fill="#7DB8FF" opacity="0.8"/><circle cx="150" cy="66" r="10" fill="#EF4444"/><circle cx="150" cy="66" r="5" fill="#FCA5A5" opacity="0.8"/><circle cx="210" cy="80" r="8" fill="#0052FF"/><circle cx="210" cy="80" r="4" fill="#7DB8FF" opacity="0.8"/><circle cx="150" cy="152" r="6" fill="#EF4444"/><rect x="80" y="228" width="140" height="14" rx="4" fill="#C9A84C" opacity="0.9"/><rect x="96" y="42" width="108" height="26" rx="6" fill="#1a1000" opacity="0.9"/><text x="150" y="60" text-anchor="middle" font-family="system-ui" font-size="12" font-weight="600" fill="#F5D87A">WARLORD</text><rect x="110" y="246" width="80" height="20" rx="10" fill="#1a1000"/><text x="150" y="260" text-anchor="middle" font-family="system-ui" font-size="11" fill="#F5D87A">5x BOOST</text></svg>` },
];

export function ProfilePage() {
  const { wallet, profile, updateProfile, nfts, mintNFT, points, nftBoost, pointsLog } = useStore();
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(profile.username || '');
  const [minting, setMinting] = useState(null);

  const saveName = () => {
    if (nameVal.trim().length < 2) { toast.error('Name too short'); return; }
    updateProfile({ username: nameVal.trim() });
    setEditing(false);
    toast.success('Callsign updated!');
  };

  const handleMint = async (tier) => {
    const nftAddress = process.env.REACT_APP_NFT_ADDRESS;
    if (!nftAddress) { toast.error('NFT contract not configured'); return; }
    if (!wallet?.signer) { toast.error('Connect your wallet first'); return; }

    setMinting(tier);
    try {
      const contract  = new ethers.Contract(nftAddress, NFT_ABI, wallet.signer);
      const tierIndex = tier - 1; // contract uses 0-indexed tiers
      const price     = ethers.parseEther(TIER_PRICES[tier]);

      toast('Confirm transaction in MetaMask…', { duration: 5000 });
      const tx = await contract.mint(tierIndex, { value: price });
      toast('Transaction submitted — waiting for confirmation…', { duration: 8000 });
      await tx.wait();

      // Sync boost from chain to backend
      try {
        const result = await syncNFTBoost();
        // Update local store too
        mintNFT(tier);
        toast.success(`NFT minted! Boost updated to ${result.boost}×`);
      } catch {
        mintNFT(tier); // update local at least
        toast.success('NFT minted successfully!');
      }
    } catch (err) {
      if (err.code === 4001) {
        toast.error('Transaction rejected');
      } else {
        toast.error(err.message?.slice(0, 60) || 'Mint failed');
      }
    }
    setMinting(null);
  };

  const refLink = `${window.location.origin}?ref=${profile.referralCode}`;
  const copyRef = () => { navigator.clipboard.writeText(refLink); toast.success('War code copied!'); };
  const winRate = profile.gamesPlayed ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;
  const AVATARS = ['♔', '♕', '♖', '♗', '♘', '♙'];

  return (
    <div className="page-wrap">
      <div className="profile-header">
        <div className="ph-avatar-row">
          {AVATARS.map((a, i) => (
            <button key={i} className={`ph-av-opt ${profile.avatar === i ? 'selected' : ''}`}
              onClick={() => updateProfile({ avatar: i })}>{a}</button>
          ))}
        </div>
        <div className="ph-big-av">{AVATARS[profile.avatar || 0]}</div>
        {editing ? (
          <div className="ph-name-edit">
            <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} className="ph-name-input"
              maxLength={20} autoFocus onKeyDown={(e) => e.key === 'Enter' && saveName()} placeholder="Your callsign" />
            <button onClick={saveName} className="ph-save">Save</button>
            <button onClick={() => setEditing(false)} className="ph-cancel">Cancel</button>
          </div>
        ) : (
          <div className="ph-name-row">
            <h1>{profile.username || 'Unknown Warrior'}</h1>
            <button className="ph-edit-btn" onClick={() => setEditing(true)}>✏️</button>
          </div>
        )}
        <p className="ph-addr">{wallet?.address}</p>
        <p className="ph-joined">Enlisted: {profile.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : 'Today'}</p>
      </div>

      <div className="stat-grid-6">
        {[
          { label: 'War Points', val: points.toLocaleString(), cls: 'gold'  },
          { label: 'NFT Boost',  val: `${nftBoost}×`,          cls: 'red'   },
          { label: 'Battles',    val: profile.gamesPlayed,      cls: ''      },
          { label: 'Victories',  val: profile.gamesWon,         cls: 'green' },
          { label: 'Win Rate',   val: `${winRate}%`,            cls: ''      },
          { label: 'Recruits',   val: profile.referralCount,    cls: ''      },
        ].map((s) => (
          <div key={s.label} className="sg-item">
            <span className={`sg-val ${s.cls}`}>{s.val}</span>
            <span className="sg-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* NFT Minting */}
      <section className="profile-section">
        <div className="ps-head">
          <h2>Mint War NFTs</h2>
          <p>Higher rank = higher point multiplier. Best NFT determines your boost.</p>
        </div>
        <div className="nft-mint-grid">
          {NFT_TIERS.map((t) => {
            const owned = nfts.filter((n) => n.tier === t.tier).length;
            const active = nftBoost === t.tier + 1;
            return (
              <div key={t.tier} className={`nft-card ${active ? 'nft-active' : ''}`} style={{ '--nft-color': t.color }}>
                <div className="nc-sym">{t.sym}</div>
                <h3 className="nc-name">{t.name}</h3>
                <p className="nc-rarity" style={{color: t.color}}>{t.rarity}</p>
                <div className="nc-boost">{t.boost} Multiplier</div>
                <div className="nc-price">{t.price}</div>
                {owned > 0 && <div className="nc-owned">Owned: {owned}</div>}
                {active && <div className="nc-current">✅ Active</div>}
                <button className="nc-mint-btn" onClick={() => handleMint(t.tier)}
                  disabled={minting === t.tier} style={{ background: t.color }}>
                  {minting === t.tier ? 'Minting…' : `Mint · ${t.price}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Referral */}
      <section className="profile-section">
        <div className="ps-head">
          <h2>Recruit Warriors</h2>
          <p>Earn <strong>1,000 war points</strong> for every recruit!</p>
        </div>
        <div className="ref-code-big">War Code: <strong>{profile.referralCode}</strong></div>
        <div className="ref-link-row-big">
          <input readOnly value={refLink} className="ref-link-input-big" />
          <button onClick={copyRef} className="ref-copy-big">Copy</button>
        </div>
        <div className="ref-share-row">
          {[
            { id: 'twitter',  label: '𝕏 Twitter',  bg: '#000'    },
            { id: 'telegram', label: '✈ Telegram', bg: '#229ED9' },
            { id: 'warpcast', label: '🟣 Warpcast', bg: '#7c3aed' },
          ].map((s) => (
            <button key={s.id} className="ref-share-btn" style={{ background: s.bg }}
              onClick={() => {
                const text = 'Join me on ChessWar — chess + USDC on Base!';
                const urls = {
                  twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(refLink)}`,
                  telegram: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`,
                  warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + refLink)}`,
                };
                window.open(urls[s.id], '_blank');
              }}>{s.label}</button>
          ))}
        </div>
        <div className="ref-stats-row">
          <div className="rsr-item"><strong>{profile.referralCount}</strong><span>Recruits</span></div>
          <div className="rsr-item"><strong>{(profile.referralCount * 1000).toLocaleString()}</strong><span>Points earned</span></div>
        </div>
      </section>

      {/* Points log */}
      <section className="profile-section">
        <div className="ps-head"><h2>Points Log</h2></div>
        {pointsLog.length === 0 ? (
          <p className="empty-msg">No battles yet — enter the war!</p>
        ) : (
          <div className="pts-log">
            {pointsLog.slice(0, 30).map((e) => (
              <div key={e.id} className="pl-row">
                <div className="pl-left">
                  <span className="pl-reason">{e.reason}</span>
                  <span className="pl-time">{new Date(e.ts).toLocaleString()}</span>
                </div>
                <div className="pl-right">
                  <span className="pl-amount">+{e.amount}</span>
                  {e.nftBoost > 1 && <span className="pl-tag green">{e.nftBoost}×NFT</span>}
                  {e.isBet && <span className="pl-tag fire">5×Bet</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
