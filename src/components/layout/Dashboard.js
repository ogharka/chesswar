import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { connectSocket, disconnectSocket } from '../../utils/socket';
import toast from 'react-hot-toast';

const TIME_OPTS = [
  { val: 1,  label: '1 min',  type: 'Bullet'  },
  { val: 3,  label: '3 min',  type: 'Blitz'   },
  { val: 5,  label: '5 min',  type: 'Blitz'   },
  { val: 10, label: '10 min', type: 'Rapid'   },
  { val: 15, label: '15 min', type: 'Rapid'   },
  { val: 30, label: '30 min', type: 'Classic' },
];

const BET_PRESETS = ['0.10', '0.50', '1.00', '5.00'];

export default function Dashboard() {
  const navigate = useNavigate();
  const { points, nftBoost, profile, gameHistory } = useStore();

  const [selTime,    setSelTime]    = useState(5);
  const [mode,       setMode]       = useState('bot'); // bot | bet | pvp
  const [betAmt,     setBetAmt]     = useState('0.10');
  const [searching,  setSearching]  = useState(false);

  const winRate = profile.gamesPlayed
    ? Math.round((profile.gamesWon / profile.gamesPlayed) * 100) : 0;

  const handlePlay = () => {
    if (mode === 'pvp-friend') {
      const link = window.location.origin + '?invite=' + Math.random().toString(36).slice(2,8).toUpperCase();
      navigator.clipboard.writeText(link);
      toast.success('Invite link copied! Share with your friend');
      return;
    }
    if (mode === 'pvp-match') {
      toast('Free PvP coming soon!', { icon: '⚔️' });
      return;
    }
    if (mode === 'bet') {
      setSearching(true);
      const socket = connectSocket();
      socket.off('game_found');
      socket.emit('join_queue', {
        betAmount: betAmt,
        username: profile.username || 'Anonymous',
        address: ''
      });
      socket.on('game_found', ({ gameId, color, opponent, betAmount: bAmt }) => {
        setSearching(false);
        toast.success('Opponent found! Starting game...');
        navigate('/play/bet', { state: { timeControl: selTime, betAmount: bAmt, gameId, color, opponent, online: true } });
      });
      return;
    }
    navigate('/play/' + mode, { state: { timeControl: selTime, betAmount: betAmt } });
  };

  const cancelSearch = () => {
    const socket = connectSocket();
    socket.emit('leave_queue');
    setSearching(false);
    toast('Search cancelled');
  };

  const recent = gameHistory.slice(0, 8);

  return (
    <div className="play-page">

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="sc-val blue">{points.toLocaleString()}</div>
          <div className="sc-label">War Points</div>
        </div>
        <div className="stat-card">
          <div className="sc-val">{profile.gamesPlayed || 0}</div>
          <div className="sc-label">Battles</div>
        </div>
        <div className="stat-card">
          <div className={`sc-val ${winRate > 50 ? 'green' : ''}`}>{winRate}%</div>
          <div className="sc-label">Win Rate</div>
        </div>
      </div>

      {/* Game mode */}
      <div>
        <div className="section-title">Mode</div>
        <div className="mode-grid">
          <div
            className={`mode-card bot ${mode === 'bot' ? 'active' : ''}`}
            onClick={() => setMode('bot')}
            style={mode === 'bot' ? { borderColor: 'var(--green)', background: 'linear-gradient(135deg,#fff 60%,#E6F9F1)' } : {}}
          >
            <div className="mc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={mode==='bot'?'var(--green)':'var(--t2)'} strokeWidth="2">
                <rect x="3" y="7" width="18" height="14" rx="2"/>
                <path d="M8 7V5a4 4 0 0 1 8 0v2"/>
                <circle cx="9" cy="13" r="1" fill={mode==='bot'?'var(--green)':'var(--t2)'}/>
                <circle cx="15" cy="13" r="1" fill={mode==='bot'?'var(--green)':'var(--t2)'}/>
              </svg>
            </div>
            <div className="mc-title">vs Computer</div>
            <div className="mc-sub">Practice & improve</div>
            <span className="mc-tag green">Free</span>
          </div>
          <div
            className={`mode-card bet ${mode === 'bet' ? 'active' : ''}`}
            onClick={() => setMode('bet')}
            style={mode === 'bet' ? { borderColor: 'var(--blue)', background: 'linear-gradient(135deg,#fff 60%,var(--blue-light))' } : {}}
          >
            <div className="mc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={mode==='bet'?'var(--blue)':'var(--t2)'} strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="mc-title">Bet Battle</div>
            <div className="mc-sub">Wager USDC, win more</div>
            <span className="mc-tag fire">5× Points</span>
          </div>
        </div>
      </div>

      {/* Bet amount (only for bet mode) */}
      {mode === 'bet' && (
        <div className="bet-row">
          <span className="bet-label">Wager</span>
          <input
            className="bet-input"
            type="number"
            min="0.10"
            step="0.10"
            value={betAmt}
            onChange={e => setBetAmt(e.target.value)}
          />
          <span className="bet-currency">USDC</span>
          <div className="bet-presets">
            {BET_PRESETS.map(p => (
              <button
                key={p}
                className={`bet-preset ${betAmt === p ? 'active' : ''}`}
                onClick={() => setBetAmt(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time control */}
      <div>
        <div className="section-title">Time Control</div>
        <div className="time-grid">
          {TIME_OPTS.map(t => (
            <div
              key={t.val}
              className={`time-card ${selTime === t.val ? 'active' : ''}`}
              onClick={() => setSelTime(t.val)}
            >
              <div className={`tc-time ${selTime === t.val ? 'active' : ''}`}>{t.val}</div>
              <div className="tc-label">{t.type}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Play button */}
      <button
        className={`find-btn ${searching ? 'searching' : ''}`}
        onClick={handlePlay}
        disabled={searching}
      >
        {searching ? (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{animation:'spin 1s linear infinite'}}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            Finding opponent...
          </>
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            {mode === 'bot' ? 'Play vs Computer' : mode === 'bet' ? `Bet ${betAmt} USDC` : 'Find Opponent'}
          </>
        )}
      </button>

      {/* Recent battles */}
      {recent.length > 0 && (
        <div>
          <div className="section-title">Recent Battles</div>
          <div className="battles-list">
            {recent.map((g, i) => {
              const won  = g.result === 'win';
              const draw = g.result === 'draw';
              return (
                <div key={i} className="battle-item">
                  <div className={`bi-result ${won ? 'win' : draw ? 'draw' : 'loss'}`}>
                    {won ? 'W' : draw ? 'D' : 'L'}
                  </div>
                  <div className="bi-info">
                    <div className="bi-opp">{g.opponent || 'Opponent'}</div>
                    <div className="bi-meta">{g.mode} · {new Date(g.id).toLocaleDateString()}</div>
                  </div>
                  <div className={`bi-pts ${g.pointsEarned > 0 ? 'pos' : g.pointsEarned < 0 ? 'neg' : 'zero'}`}>
                    {g.pointsEarned > 0 ? '+' : ''}{g.pointsEarned} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
