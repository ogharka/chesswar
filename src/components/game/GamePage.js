import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';

import toast from 'react-hot-toast';

/* ── Sound ── */
let actx = null;
const getCtx = () => { if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)(); return actx; };
const tone = (f, d = 0.08, t = 'sine', v = 0.15) => {
  try {
    const c = getCtx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.type = t; o.frequency.value = f;
    g.gain.setValueAtTime(v, c.currentTime); g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
    o.start(c.currentTime); o.stop(c.currentTime + d);
  } catch { /* blocked */ }
};
const SFX = {
  move:    () => tone(520, 0.06),
  capture: () => { tone(280, 0.08, 'sawtooth'); setTimeout(() => tone(220, 0.1), 50); },
  check:   () => { tone(660, 0.1, 'square'); setTimeout(() => tone(550, 0.1, 'square'), 120); },
  castle:  () => { tone(440, 0.07); setTimeout(() => tone(520, 0.07), 80); },
  win:     () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.2), i * 120)),
  loss:    () => [440, 370, 311].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'sine', 0.15), i * 150)),
};

/* ── Timer ── */
function Timer({ seconds, active, side, inc }) {
  const m = Math.floor(seconds / 60), s = seconds % 60;
  const low = seconds <= 30, crit = seconds <= 10;
  return (
    <div className={`timer timer-${side} ${active ? 'timer-on' : 'timer-off'} ${low ? 'timer-low' : ''} ${crit ? 'timer-crit' : ''}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
      {inc > 0 && <span className="timer-inc">+{inc}s</span>}
    </div>
  );
}

/* ── Move list ── */
function MoveList({ moves, onPGN }) {
  const ref = useRef(null);
  useEffect(() => { ref.current?.scrollIntoView({ behavior: 'smooth' }); }, [moves.length]);
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) pairs.push([moves[i], moves[i + 1]]);
  return (
    <div className="move-hist">
      <div className="mh-header">
        <span className="mh-title">Battle Log</span>
        {moves.length > 0 && <button className="mh-pgn-btn" onClick={onPGN}>PGN ↗</button>}
      </div>
      <div className="mh-body">
        {pairs.length === 0 && <p className="mh-empty">Awaiting first move…</p>}
        {pairs.map((p, i) => (
          <div key={i} className="mh-row">
            <span className="mh-num">{i + 1}.</span>
            <span className="mh-w">{p[0]?.san}</span>
            <span className="mh-b">{p[1]?.san || ''}</span>
          </div>
        ))}
        <div ref={ref} />
      </div>
    </div>
  );
}

/* ── Promotion picker ── */
function PromoPicker({ color, onSelect }) {
  const opts = [
    { t: 'q', s: color === 'w' ? '♕' : '♛', n: 'Queen'  },
    { t: 'r', s: color === 'w' ? '♖' : '♜', n: 'Rook'   },
    { t: 'b', s: color === 'w' ? '♗' : '♝', n: 'Bishop' },
    { t: 'n', s: color === 'w' ? '♘' : '♞', n: 'Knight' },
  ];
  return (
    <div className="promo-overlay">
      <div className="promo-modal">
        <p className="promo-title">Choose your weapon</p>
        <div className="promo-grid">
          {opts.map((o) => (
            <button key={o.t} className="promo-btn" onClick={() => onSelect(o.t)}>
              <span className="promo-piece">{o.s}</span>
              <span className="promo-label">{o.n}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Time controls ── */
const TIME_OPTS = [
  { label: '1 min',  base: 60,   inc: 0  },
  { label: '3 min',  base: 180,  inc: 2  },
  { label: '5 min',  base: 300,  inc: 0  },
  { label: '7 min',  base: 420,  inc: 0  },
  { label: '10 min', base: 600,  inc: 0  },
  { label: '30 min', base: 1800, inc: 0  },
];

const PSYMS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

export default function GamePage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { addPoints, updateProfile, profile, addGameResult, nftBoost } = useStore();

  const isBet = mode === 'bet';

  /* config */
  const [configured, setConfigured] = useState(false);
  const [timeOpt,   setTimeOpt]   = useState(TIME_OPTS[2]);

  const [betAmt,    setBetAmt]    = useState('0.10');
  const [betErr,    setBetErr]    = useState('');
  const [soundOn,   setSoundOn]   = useState(true);

  /* game */
  const chessRef  = useRef(new Chess());
  const timerRef  = useRef(null);
  const overRef   = useRef(false);
  const soundRef  = useRef(true);
  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

  const [fen,       setFen]      = useState(chessRef.current.fen());
  const [moves,     setMoves]    = useState([]);
  const [wTime,     setWTime]    = useState(300);
  const [bTime,     setBTime]    = useState(300);
  const [turn,      setTurn]     = useState('w');
  const [started,   setStarted]  = useState(false);
  const [over,      setOver]     = useState(null);
  const [selected,  setSelected] = useState(null);
  const [hilights,  setHilights] = useState({});

  const [flipped,   setFlipped]  = useState(false);
  const [capW,      setCapW]     = useState([]);
  const [capB,      setCapB]     = useState([]);
  const [promo,     setPromo]    = useState(null);
  const [drawOffer, setDrawOffer] = useState(false);  // draw offered to opponent
  const [shareMsg,  setShareMsg]  = useState(false);  // share link copied

  const sfx = useCallback((name) => { if (soundRef.current) SFX[name]?.(); }, []);

  /* end game */
  const endGame = useCallback((winner, reason) => {
    if (overRef.current) return;
    overRef.current = true;
    clearInterval(timerRef.current);
    const won = winner === 'w', draw = winner === 'd';
    const base = draw ? 5 : won ? 20 : 10;
    const earned = addPoints(base, `${mode} · ${reason}`, isBet);
    updateProfile({
      gamesPlayed: profile.gamesPlayed + 1,
      gamesWon:    won  ? profile.gamesWon  + 1 : profile.gamesWon,
      gamesLost:   (!won && !draw) ? profile.gamesLost + 1 : profile.gamesLost,
      gamesDraw:   draw ? profile.gamesDraw + 1 : profile.gamesDraw,
      ...(isBet && { betGamesPlayed: (profile.betGamesPlayed || 0) + 1 }),
    });
    addGameResult({ result: won ? 'win' : draw ? 'draw' : 'loss', mode, opponent: 'Opponent', pointsEarned: earned });
    setOver({ winner, reason, earned, isBet, betAmt: isBet ? betAmt : null });
    if (won) sfx('win'); else if (!draw) sfx('loss');
    toast(won ? 'Victory!' : draw ? 'Draw!' : 'Defeated!', { duration: 3000 });
  }, [addPoints, addGameResult, betAmt, isBet, mode, profile, sfx, updateProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  /* apply move */
  const applyMove = useCallback((mv) => {
    const chess = chessRef.current;
    const res = chess.move(mv);
    if (!res) return false;
    const inc = timeOpt.inc || 0;
    if (inc > 0) { if (res.color === 'w') setWTime((t) => t + inc); else setBTime((t) => t + inc); }
    if (res.captured) { if (res.color === 'w') setCapW((p) => [...p, res.captured]); else setCapB((p) => [...p, res.captured]); sfx('capture'); }
    else if (res.flags.includes('k') || res.flags.includes('q')) sfx('castle');
    else sfx('move');
    setFen(chess.fen()); setTurn(chess.turn()); setMoves((m) => [...m, res]);
    setHilights({ [res.from]: { background: 'rgba(201,168,76,0.5)' }, [res.to]: { background: 'rgba(201,168,76,0.5)' } });
    setSelected(null);
    if (chess.isCheckmate()) { endGame(chess.turn() === 'w' ? 'b' : 'w', 'checkmate'); return true; }
    if (chess.isDraw())      { endGame('d', 'draw'); return true; }
    if (chess.isCheck())     { sfx('check'); toast('⚠️ Check!', { duration: 1000 }); }
    return true;
  }, [endGame, sfx, timeOpt.inc]);

  /* timer */
  useEffect(() => {
    if (!started || over) return;
    timerRef.current = setInterval(() => {
      if (overRef.current) { clearInterval(timerRef.current); return; }
      if (chessRef.current.turn() === 'w') setWTime((t) => { if (t <= 1) { endGame('b', 'timeout'); return 0; } return t - 1; });
      else setBTime((t) => { if (t <= 1) { endGame('w', 'timeout'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, over, endGame]);

 // eslint-disable-line react-hooks/exhaustive-deps

  /* promotion */
  const isPromo = (from, to) => {
    const p = chessRef.current.get(from);
    return p?.type === 'p' && ((p.color === 'w' && to[1] === '8') || (p.color === 'b' && to[1] === '1'));
  };

  /* click */
  const onSquareClick = (sq) => {
    if (!started || over || promo) return;
    const chess = chessRef.current, piece = chess.get(sq);
    if (!selected) {
      if (piece && piece.color === chess.turn()) {
        setSelected(sq);
        const legal = chess.moves({ square: sq, verbose: true });
        const h = { [sq]: { background: 'rgba(201,168,76,0.5)' } };
        legal.forEach((m) => { h[m.to] = chess.get(m.to) ? { background: 'radial-gradient(circle, rgba(180,30,30,0.6) 55%, transparent 60%)' } : { background: 'radial-gradient(circle, rgba(201,168,76,0.3) 28%, transparent 32%)' }; });
        setHilights(h);
      }
      return;
    }
    if (isPromo(selected, sq)) {
      const legal = chess.moves({ square: selected, verbose: true }).map((m) => m.to);
      if (legal.includes(sq)) { setPromo({ from: selected, to: sq }); setSelected(null); setHilights({}); return; }
    }
    const moved = applyMove({ from: selected, to: sq, promotion: 'q' });
    if (!moved) {
      if (piece && piece.color === chess.turn()) {
        setSelected(sq);
        const legal = chess.moves({ square: sq, verbose: true });
        const h = { [sq]: { background: 'rgba(201,168,76,0.5)' } };
        legal.forEach((m) => { h[m.to] = { background: 'radial-gradient(circle, rgba(201,168,76,0.3) 28%, transparent 32%)' }; });
        setHilights(h);
      } else { setSelected(null); setHilights({}); }
    }
  };

  const onDrop = (from, to) => {
    if (!started || over) return false;
    if (isPromo(from, to)) { setPromo({ from, to }); return false; }
    return applyMove({ from, to, promotion: 'q' });
  };

  const onPromoSelect = (p) => { if (promo) { applyMove({ ...promo, promotion: p }); setPromo(null); } };

  const exportPGN = () => { navigator.clipboard.writeText(chessRef.current.pgn()); toast.success('PGN copied!'); };

  const reset = () => {
    chessRef.current.reset(); overRef.current = false;
    setFen(chessRef.current.fen()); setMoves([]); setWTime(timeOpt.base); setBTime(timeOpt.base);
    setTurn('w'); setOver(null); setSelected(null); setHilights({}); setCapW([]); setCapB([]);  setPromo(null);
  };

  const startGame = () => {
    if (isBet) { const n = parseFloat(betAmt); if (isNaN(n) || n < 0.1) { setBetErr('Minimum 0.10 USDC'); return; } setBetErr(''); }
    reset(); setConfigured(true); setStarted(true);
  };

  const rematch = () => { reset(); setStarted(true); };
  const resign = () => {
    if (!started || over) return;
    endGame('b', 'resignation');
  };

  const abort = () => {
    if (!started || over) return;
    if (moves.length > 1) { toast.error('Cannot abort after move 2'); return; }
    clearInterval(timerRef.current);
    overRef.current = true;
    setOver({ winner: null, reason: 'aborted', earned: 0 });
    toast('Game aborted');
  };

  const offerDraw = () => {
    if (!started || over) return;
    setDrawOffer(true);
    toast('Draw offered — waiting for opponent', { duration: 3000 });
    // In PvP this would send via WebSocket
    // vs bot — bot accepts/declines randomly

  };

  const shareGame = () => {
    const pgn = chessRef.current.pgn();
    navigator.clipboard.writeText(pgn);
    setShareMsg(true);
    toast.success('PGN copied to clipboard!');
    setTimeout(() => setShareMsg(false), 2000);
  };

  /* ── Config screen ── */
  if (!configured) {
    return (
      <div className="config-screen">
        <div className="config-card">
          <button className="config-back" onClick={() => navigate('/')}>← Back</button>
          <h2 className="config-title">
            Bet Battle
          </h2>



          <div className="config-group">
            <label>Battle Timer</label>
            <div className="tc-grid">
              {TIME_OPTS.map((t) => (
                <button key={t.label} className={`tc-btn ${timeOpt.label === t.label ? 'active' : ''}`} onClick={() => setTimeOpt(t)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="config-group config-inline">
            <label>Sound</label>
            <button className={`sound-toggle ${soundOn ? 'on' : 'off'}`} onClick={() => setSoundOn((s) => !s)}>
              {soundOn ? 'Sound On' : 'Sound Off'}
            </button>
          </div>

          {isBet && (
            <div className="config-group">
              <label>Wager Amount (USDC)</label>
              <div className="bet-quick">
                {[0.1, 0.5, 1, 5, 10, 50, 100].map((v) => (
                  <button key={v} className={`bq-btn ${parseFloat(betAmt) === v ? 'active' : ''}`}
                    onClick={() => { setBetAmt(v.toFixed(2)); setBetErr(''); }}>
                    {v}
                  </button>
                ))}
              </div>
              <div className="bet-custom-row">
                <span className="bet-cur">USDC</span>
                <input type="number" className="bet-input" value={betAmt} min="0.1" step="0.01"
                  onChange={(e) => { setBetAmt(e.target.value); setBetErr(''); }} />
              </div>
              {betErr && <p className="bet-error">{betErr}</p>}
              <div className="bet-summary">
                <div className="bs-row"><span>You wager</span><strong>{parseFloat(betAmt) || 0} USDC</strong></div>
                <div className="bs-row"><span>If you win</span><strong className="green">+{((parseFloat(betAmt) || 0) * 2 * 0.98).toFixed(2)} USDC</strong></div>
                <div className="bs-row"><span>Platform fee</span><strong>2%</strong></div>
                <div className="bs-row"><span>Point boost</span><strong className="fire">× 5× all points</strong></div>
              </div>
            </div>
          )}

          <button className="config-start-btn" onClick={startGame}>
            {isBet ? `Start Battle · ${parseFloat(betAmt) || 0} USDC` : 'Start Battle'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Game screen ── */
  return (
    <div className="cw-game">

      <div className="cw-main">
        {/* Board column */}
        <div className="cw-board-wrap">

          {/* Opponent row */}
          <div className="cw-player">
            <div className="cwp-left">
              <div className="cwp-avatar">'♟'</div>
              <div className="cwp-info">
                <span className="cwp-name">'Opponent'</span>
                
                <span className="cwp-caps">{capB.map((p,i) => <span key={i}>{PSYMS[p]}</span>)}</span>
              </div>
            </div>
            <Timer seconds={bTime} active={started && !over && turn === 'b'} side="black" inc={timeOpt.inc} />
          </div>

          {/* Board */}
          <Chessboard
            position={fen}
            onSquareClick={onSquareClick}
            onPieceDrop={onDrop}
            boardOrientation={flipped ? 'black' : 'white'}
            customSquareStyles={hilights}
            customBoardStyle={{ borderRadius: '3px', overflow: 'hidden' }}
            customDarkSquareStyle={{ backgroundColor: '#B58863' }}
            customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
            areArrowsAllowed
          />

          {/* Self row */}
          <div className="cw-player">
            <div className="cwp-left">
              <div className="cwp-avatar">♙</div>
              <div className="cwp-info">
                <span className="cwp-name">{profile?.username || 'You'}</span>
                <span className="cwp-sub">{nftBoost}× boost{isBet ? ' · 5× pts' : ''}</span>
                <span className="cwp-caps">{capW.map((p,i) => <span key={i}>{PSYMS[p]}</span>)}</span>
              </div>
            </div>
            <Timer seconds={wTime} active={started && !over && turn === 'w'} side="white" inc={timeOpt.inc} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="cw-sidebar">
          {isBet && (
            <div className="cw-bet-pill">
              <span className="cw-bet-amt">{betAmt} USDC</span>
              <span className="cw-bet-boost">5× pts</span>
            </div>
          )}

          <MoveList moves={moves} onPGN={exportPGN} />

          {/* Action buttons */}
          <div className="cw-actions">
            <button className="cwa-btn" onClick={() => setFlipped(f => !f)} title="Flip board">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              <span>Flip</span>
            </button>
            <button className={`cwa-btn ${!soundOn ? 'cwa-off' : ''}`} onClick={() => setSoundOn(s => !s)} title="Sound">
              {soundOn
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              }
              <span>{soundOn ? 'Sound' : 'Muted'}</span>
            </button>
            <button className="cwa-btn" onClick={shareGame} title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
              <span>{shareMsg ? 'Copied!' : 'Share'}</span>
            </button>
            {started && !over && !drawOffer && (
              <button className="cwa-btn cwa-draw" onClick={offerDraw} title="Offer draw">
                <span style={{fontSize:'15px',fontWeight:'800',lineHeight:1}}>½</span>
                <span>Draw</span>
              </button>
            )}
            {started && !over && moves.length <= 1 && (
              <button className="cwa-btn cwa-abort" onClick={abort} title="Abort">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                <span>Abort</span>
              </button>
            )}
            {started && !over && (
              <button className="cwa-btn cwa-resign" onClick={resign} title="Resign">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                <span>Resign</span>
              </button>
            )}
            <button className="cwa-btn cwa-home" onClick={() => navigate('/')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              <span>Home</span>
            </button>
          </div>
        </div>
      </div>

      {promo && <PromoPicker color={chessRef.current.turn()} onSelect={onPromoSelect} />}
    </div>

      {over && (
        <div className="game-over-overlay">
          <div className="go-modal">
            <div className={`go-banner ${over.winner === 'w' ? 'go-win' : over.winner === 'd' ? 'go-draw' : 'go-loss'}`}>
              <div className="go-title">
                {over.winner === 'w' ? 'Victory!' : over.winner === 'd' ? 'Draw' : 'Defeated'}
              </div>
              <div className="go-reason">
                {over.reason === 'checkmate'   && (over.winner === 'w' ? 'Checkmate' : 'Your king has fallen')}
                {over.reason === 'resignation' && (over.winner === 'w' ? 'Opponent resigned' : 'You resigned')}
                {over.reason === 'timeout'     && (over.winner === 'w' ? 'Opponent out of time' : 'Time expired')}
                {over.reason === 'draw'        && 'Game drawn by agreement'}
                {over.reason === 'aborted'     && 'Game aborted'}
              </div>
            </div>
            <div className="go-stats">
              <div className="go-row"><span>Points earned</span><strong className="gold">+{over.earned}</strong></div>
              <div className="go-row"><span>NFT boost</span><strong>{nftBoost}×</strong></div>
              {isBet && (
                <div className="go-row">
                  <span>Wager</span>
                  <strong className={over.winner === 'w' ? 'green' : 'red'}>
                    {over.winner === 'w' ? `+${(parseFloat(betAmt) * 2 * 0.98).toFixed(2)} USDC` : over.winner === 'd' ? 'Refunded' : `-${betAmt} USDC`}
                  </strong>
                </div>
              )}
            </div>
            <div className="go-actions">
              <button className="go-btn go-rematch" onClick={rematch}>Rematch</button>
              <button className="go-btn" onClick={exportPGN}>PGN</button>
              <button className="go-btn go-home" onClick={() => navigate('/')}>Home</button>
            </div>
          </div>
        </div>
      )}
  );
}
