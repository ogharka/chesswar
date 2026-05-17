import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const navigate = useNavigate();
  const { points, nftBoost, profile, nfts, gameHistory } = useStore();

  const winRate = profile.gamesPlayed
    ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  const refLink = `${window.location.origin}?ref=${profile.referralCode}`;

  const copyRef = () => { navigator.clipboard.writeText(refLink); toast.success('War code copied!'); };

  const share = (platform) => {
    const text = `I'm battling on ChessWar — chess + USDC on Base! Join the war:`;
    const urls = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(refLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`,
      warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + refLink)}`,
    };
    window.open(urls[platform], '_blank');
  };

  return (
    <div className="dashboard">

      {/* Stats strip */}
      <div className="stats-strip">
        {[
          { label: 'War Points', val: points.toLocaleString(), cls: 'gold'  },
          { label: 'NFT Boost',  val: `${nftBoost}×`,          cls: 'red'   },
          { label: 'Battles',    val: profile.gamesPlayed,      cls: ''      },
          { label: 'Victories',  val: profile.gamesWon,         cls: 'green' },
          { label: 'Win Rate',   val: `${winRate}%`,            cls: ''      },
          { label: 'Recruits',   val: profile.referralCount,    cls: ''      },
        ].map((s, i, arr) => (
          <React.Fragment key={s.label}>
            <div className="ss-item">
              <span className="ss-label">{s.label}</span>
              <span className={`ss-val ${s.cls}`}>{s.val}</span>
            </div>
            {i < arr.length - 1 && <div className="ss-div" />}
          </React.Fragment>
        ))}
      </div>

      <div className="dash-grid">
        <div className="dash-left">

          {/* Battle modes */}
          <section className="panel">
            <div className="panel-head"><h2>⚔️ Enter Battle</h2></div>
            <div className="battle-grid">
              <button className="battle-card bc-pvp" onClick={() => navigate('/play/pvp')}>
                <span className="bc-icon">⚔️</span>
                <strong>PvP Battle</strong>
                <span>Fight a real opponent</span>
                <div className="bc-pts">+10 pts</div>
              </button>
              <button className="battle-card bc-bot" onClick={() => navigate('/play/bot')}>
                <span className="bc-icon">🤖</span>
                <strong>vs AI</strong>
                <span>Train your strategy</span>
                <div className="bc-pts">+10 pts</div>
              </button>
              <button className="battle-card bc-bet" onClick={() => navigate('/play/bet')}>
                <span className="bc-icon">💰</span>
                <strong>Bet Battle</strong>
                <span>USDC wager · Winner takes all</span>
                <div className="bc-pts fire">🔥 5× pts</div>
              </button>
              <button className="battle-card bc-tour" onClick={() => navigate('/tournament')}>
                <span className="bc-icon">🏆</span>
                <strong>Tournament</strong>
                <span>5 USDC entry · Prize pool</span>
                <div className="bc-pts">Glory</div>
              </button>
            </div>
          </section>

          {/* Battle history */}
          <section className="panel">
            <div className="panel-head"><h2>⚔️ Battle Log</h2></div>
            {gameHistory.length === 0 ? (
              <p className="empty-msg">No battles yet — enter the war!</p>
            ) : (
              <div className="game-hist">
                {gameHistory.slice(0, 8).map((g) => (
                  <div key={g.id} className={`gh-row ${g.result}`}>
                    <span className="gh-icon">{g.result === 'win' ? '⚔️' : g.result === 'draw' ? '🤝' : '💀'}</span>
                    <span className="gh-opp">{g.opponent || 'Unknown'}</span>
                    <span className="gh-mode">{g.mode}</span>
                    <span className="gh-pts">+{g.pointsEarned} pts</span>
                    <span className="gh-date">{new Date(g.id).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="dash-right">

          {/* Airdrop */}
          <section className="panel airdrop-panel">
            <div className="ap-badge">INCOMING</div>
            <h3>CWAR Token Airdrop 🪂</h3>
            <p><strong>1,000,000,000 CWAR</strong> tokens launching on Base. Your points = your share.</p>
            <div className="ap-bar-row">
              <span>Your points</span><strong className="gold">{points.toLocaleString()}</strong>
            </div>
            <div className="ap-bar"><div className="ap-fill" style={{ width: `${Math.min((points / 100000) * 100, 100)}%` }} /></div>
            <p className="ap-hint">Top warriors get the biggest airdrop</p>
          </section>

          {/* Point multipliers */}
          <section className="panel">
            <div className="panel-head"><h2>⚡ Multipliers</h2></div>
            <div className="mult-list">
              {[
                { icon: '🎮', label: 'Per battle',        val: '+10 pts',       cls: ''      },
                { icon: '💰', label: 'Bet battle',        val: '5× boost',      cls: 'fire'  },
                { icon: '🛡️', label: `NFT (${nfts.length} owned)`, val: `${nftBoost}× all`, cls: 'gold'  },
                { icon: '👥', label: 'Each recruit',      val: '+1,000 pts',    cls: 'blue'  },
              ].map((m) => (
                <div key={m.label} className="mult-row">
                  <span>{m.icon}</span>
                  <span className="mr-label">{m.label}</span>
                  <span className={`mr-val ${m.cls}`}>{m.val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* NFT boosts */}
          <section className="panel">
            <div className="panel-head">
              <h2>🛡️ War NFTs</h2>
              <button className="panel-action" onClick={() => navigate('/profile')}>Mint →</button>
            </div>
            <div className="boost-table">
              {[
                { label: 'No NFT',           boost: '1×', active: nftBoost === 1 },
                { label: 'Soldier NFT',      boost: '2×', active: nftBoost === 2 },
                { label: 'Knight NFT',       boost: '3×', active: nftBoost === 3 },
                { label: 'Commander NFT',    boost: '4×', active: nftBoost === 4 },
                { label: 'Warlord NFT',      boost: '5×', active: nftBoost === 5 },
              ].map((b) => (
                <div key={b.label} className={`bt-row ${b.active ? 'bt-active' : ''}`}>
                  <span>{b.label}</span>
                  <span className="bt-boost">{b.boost}</span>
                  {b.active && <span className="bt-you">← you</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Referral */}
          <section className="panel">
            <div className="panel-head"><h2>👥 Recruit & Earn</h2></div>
            <p className="ref-desc">Earn <strong>1,000 war points</strong> for every recruit!</p>
            <div className="ref-link-row">
              <input readOnly value={refLink} className="ref-link-input" />
              <button onClick={copyRef} className="ref-copy-btn">Copy</button>
            </div>
            <div className="ref-share-btns">
              <button className="rsb twitter"  onClick={() => share('twitter')}>𝕏 Twitter</button>
              <button className="rsb telegram" onClick={() => share('telegram')}>✈ Telegram</button>
              <button className="rsb warpcast" onClick={() => share('warpcast')}>🟣 Warpcast</button>
            </div>
            <p className="ref-code-line">Code: <strong>{profile.referralCode}</strong> · Recruits: <strong>{profile.referralCount}</strong></p>
          </section>

        </div>
      </div>
    </div>
  );
}
