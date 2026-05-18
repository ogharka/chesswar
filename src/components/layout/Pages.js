// ── Tournament ────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

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
  { tier: 1, name: 'Soldier',   sym: '♙',  price: '0.005 ETH', boost: '2×', color: '#81b64c', desc: 'Entry rank. Start your conquest.' },
  { tier: 2, name: 'Knight',    sym: '♞',  price: '0.01 ETH',  boost: '3×', color: '#4a9eff', desc: 'Proven warrior. Strong multiplier.' },
  { tier: 3, name: 'Commander', sym: '♝',  price: '0.025 ETH', boost: '4×', color: '#c97af0', desc: 'Battle-hardened. Dominate ranks.' },
  { tier: 4, name: 'Warlord',   sym: '♛',  price: '0.05 ETH',  boost: '5×', color: '#c9a84c', desc: 'Supreme rank. Maximum airdrop share.' },
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
    setMinting(tier);
    await new Promise((r) => setTimeout(r, 2000));
    const nft = mintNFT(tier);
    toast.success(`${nft.sym} ${nft.name} NFT minted! Boost → ${nft.boost}`);
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
                <p className="nc-desc">{t.desc}</p>
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
