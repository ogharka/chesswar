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
  const copyRef = () => { navigator.clipboard.writeText(refLink); toast.success('Referral link copied!'); };

  const share = (platform) => {
    const text = `Play chess, earn USDC and CWAR tokens on Base — ChessWar:`;
    const urls = {
      twitter:  `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(refLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(text)}`,
      warpcast: `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + refLink)}`,
    };
    window.open(urls[platform], '_blank');
  };

  const BATTLE_MODES = [
    {
      mode: 'pvp',
      cls: 'bc-pvp',
      piece: '♟',
      title: 'Play Online',
      sub: 'Challenge a real player',
      tag: '+10 pts',
      tagCls: '',
    },
    {
      mode: 'bot',
      cls: 'bc-bot',
      piece: '♙',
      title: 'Play vs Computer',
      sub: 'Beginner · Intermediate · Hard · Very Hard',
      tag: '+10 pts',
      tagCls: '',
    },
    {
      mode: 'bet',
      cls: 'bc-bet',
      piece: '♜',
      title: 'Play & Earn',
      sub: 'Wager USDC — winner takes all',
      tag: '5× Points',
      tagCls: 'fire',
    },
    {
      mode: '/tournament',
      cls: 'bc-tour',
      piece: '♛',
      title: 'Tournament',
      sub: '5 USDC entry · USDC prizes',
      tag: 'Prize Pool',
      tagCls: 'blue',
    },
  ];

  return (
    <div className="dashboard">

      {/* Stats strip */}
      <div className="stats-strip">
        {[
          { label: 'Points',    val: points.toLocaleString(), cls: 'gold'  },
          { label: 'NFT Boost', val: `${nftBoost}×`,          cls: 'blue'  },
          { label: 'Battles',   val: profile.gamesPlayed,      cls: ''      },
          { label: 'Victories', val: profile.gamesWon,         cls: 'green' },
          { label: 'Win Rate',  val: `${winRate}%`,            cls: ''      },
          { label: 'Referrals', val: profile.referralCount,    cls: ''      },
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

          {/* Battle modes — no heading, just cards */}
          <div className="battle-grid">
            {BATTLE_MODES.map((m) => (
              <button
                key={m.mode}
                className={`battle-card ${m.cls}`}
                onClick={() => m.mode.startsWith('/') ? navigate(m.mode) : navigate(`/play/${m.mode}`)}
              >
                <span className="bc-piece">{m.piece}</span>
                <div className="bc-body">
                  <strong className="bc-title">{m.title}</strong>
                  <span className="bc-sub">{m.sub}</span>
                  <span className={`bc-tag ${m.tagCls}`}>{m.tag}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Battle log */}
          <section className="panel">
            <div className="panel-head">
              <h2>Recent Battles</h2>
              {gameHistory.length > 0 && (
                <span className="panel-sub-right">{profile.gamesPlayed} total</span>
              )}
            </div>
            {gameHistory.length === 0 ? (
              <div className="empty-state">
                <span className="empty-piece">♟</span>
                <p>No battles yet</p>
                <span>Start playing to build your record</span>
              </div>
            ) : (
              <div className="game-hist">
                {gameHistory.slice(0, 8).map((g) => (
                  <div key={g.id} className={`gh-row ${g.result}`}>
                    <span className="gh-result-badge">{g.result === 'win' ? 'W' : g.result === 'draw' ? 'D' : 'L'}</span>
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
            <div className="ap-badge">COMING SOON</div>
            <h3>CWAR Token Airdrop</h3>
            <p><strong>1,000,000,000 CWAR</strong> launching on Base. Your points determine your share.</p>
            <div className="ap-bar-row">
              <span>Your points</span>
              <strong className="gold">{points.toLocaleString()}</strong>
            </div>
            <div className="ap-bar">
              <div className="ap-fill" style={{ width: `${Math.min((points / 100000) * 100, 100)}%` }} />
            </div>
            <p className="ap-hint">Top earners receive the largest allocation</p>
          </section>

          {/* Multipliers */}
          <section className="panel">
            <div className="panel-head"><h2>Point Multipliers</h2></div>
            <div className="mult-list">
              {[
                { piece: '♟', label: 'Any battle',          val: '+10 pts',         cls: ''     },
                { piece: '♜', label: 'Bet battle',           val: '5× boost',        cls: 'fire' },
                { piece: '♝', label: `NFT boost (${nfts.length} owned)`, val: `${nftBoost}× all`, cls: 'blue' },
                { piece: '♞', label: 'Each referral',        val: '+1,000 pts',      cls: 'green'},
              ].map((m) => (
                <div key={m.label} className="mult-row">
                  <span className="mult-piece">{m.piece}</span>
                  <span className="mr-label">{m.label}</span>
                  <span className={`mr-val ${m.cls}`}>{m.val}</span>
                </div>
              ))}
            </div>
          </section>

          {/* NFT boosts */}
          <section className="panel">
            <div className="panel-head">
              <h2>NFT Boosts</h2>
              <button className="panel-action" onClick={() => navigate('/profile')}>Mint →</button>
            </div>
            <div className="boost-table">
              {[
                { label: 'No NFT',        piece: '—',  boost: '1×', active: nftBoost === 1 },
                { label: 'Soldier',       piece: '♙',  boost: '2×', active: nftBoost === 2 },
                { label: 'Knight',        piece: '♞',  boost: '3×', active: nftBoost === 3 },
                { label: 'Commander',     piece: '♝',  boost: '4×', active: nftBoost === 4 },
                { label: 'Warlord',       piece: '♛',  boost: '5×', active: nftBoost === 5 },
              ].map((b) => (
                <div key={b.label} className={`bt-row ${b.active ? 'bt-active' : ''}`}>
                  <span className="bt-piece">{b.piece}</span>
                  <span className="bt-label">{b.label}</span>
                  <span className="bt-boost">{b.boost}</span>
                  {b.active && <span className="bt-you">active</span>}
                </div>
              ))}
            </div>
          </section>

          {/* Referral */}
          <section className="panel">
            <div className="panel-head"><h2>Refer & Earn</h2></div>
            <p className="ref-desc">Share your link — earn <strong>1,000 points</strong> per referral.</p>
            <div className="ref-link-row">
              <input readOnly value={refLink} className="ref-link-input" />
              <button onClick={copyRef} className="ref-copy-btn">Copy</button>
            </div>
            <div className="ref-share-btns">
              <button className="rsb twitter"  onClick={() => share('twitter')}>X (Twitter)</button>
              <button className="rsb telegram" onClick={() => share('telegram')}>Telegram</button>
              <button className="rsb warpcast" onClick={() => share('warpcast')}>Warpcast</button>
            </div>
            <p className="ref-code-line">
              Code: <strong>{profile.referralCode}</strong>
              &nbsp;·&nbsp;
              Referrals: <strong>{profile.referralCount}</strong>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
