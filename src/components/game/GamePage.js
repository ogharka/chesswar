import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { getBotMove, diffLabel } from '../../utils/chessBot';
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
  { label: '1+0',   base: 60,   inc: 0  },
  { label: '3+2',   base: 180,  inc: 2  },
  { label: '5+0',   base: 300,  inc: 0  },
  { label: '5+3',   base: 300,  inc: 3  },
  { label: '10+0',  base: 600,  inc: 0  },
  { label: '15+10', base: 900,  inc: 10 },
  { label: '30+0',  base: 1800, inc: 0  },
];
const BOT_DIFFS = ['easy', 'medium', 'hard', 'master'];
const PSYMS = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' };

export default function GamePage() {
  const { mode } = useParams();
  const navigate = useNavigate();
  const { addPoints, updateProfile, profile, addGameResult, nftBoost } = useStore();

  const isBet = mode === 'bet';
  const isBot = mode === 'bot';

  /* config */
  const [configured, setConfigured] = useState(false);
  const [timeOpt,   setTimeOpt]   = useState(TIME_OPTS[2]);
  const [botDiff,   setBotDiff]   = useState('medium');
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
  const [thinking,  setThinking] = useState(false);
  const [flipped,   setFlipped]  = useState(false);
  const [capW,      setCapW]     = useState([]);
  const [capB,      setCapB]     = useState([]);
  const [promo,     setPromo]    = useState(null);

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
    addGameResult({ result: won ? 'win' : draw ? 'draw' : 'loss', mode, opponent: isBot ? `AI (${botDiff})` : 'Opponent', pointsEarned: earned });
    setOver({ winner, reason, earned, isBet, betAmt: isBet ? betAmt : null });
    if (won) sfx('win'); else if (!draw) sfx('loss');
    toast(won ? '⚔️ Victory!' : draw ? '🤝 Draw!' : '💀 Defeated!', { duration: 3000 });
  }, [addPoints, addGameResult, betAmt, botDiff, isBet, isBot, mode, profile, sfx, updateProfile]);

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

  /* bot */
  useEffect(() => {
    if (!started || over || !isBot || chessRef.current.turn() !== 'b') return;
    setThinking(true);
    const delay = botDiff === 'easy' ? 300 : botDiff === 'medium' ? 600 : 1000;
    const tid = setTimeout(() => {
      const mv = getBotMove(chessRef.current.fen(), botDiff);
      if (mv) applyMove(mv);
      setThinking(false);
    }, delay + Math.random() * 300);
    return () => clearTimeout(tid);
  }, [fen, started, over, isBot, botDiff, applyMove]);

  /* promotion */
  const isPromo = (from, to) => {
    const p = chessRef.current.get(from);
    return p?.type === 'p' && ((p.color === 'w' && to[1] === '8') || (p.color === 'b' && to[1] === '1'));
  };

  /* click */
  const onSquareClick = (sq) => {
    if (!started || over || thinking || (isBot && chessRef.current.turn() === 'b') || promo) return;
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
    if (!started || over || thinking || (isBot && chessRef.current.turn() === 'b')) return false;
    if (isPromo(from, to)) { setPromo({ from, to }); return false; }
    return applyMove({ from, to, promotion: 'q' });
  };

  const onPromoSelect = (p) => { if (promo) { applyMove({ ...promo, promotion: p }); setPromo(null); } };

  const exportPGN = () => { navigator.clipboard.writeText(chessRef.current.pgn()); toast.success('PGN copied!'); };

  const reset = () => {
    chessRef.current.reset(); overRef.current = false;
    setFen(chessRef.current.fen()); setMoves([]); setWTime(timeOpt.base); setBTime(timeOpt.base);
    setTurn('w'); setOver(null); setSelected(null); setHilights({}); setCapW([]); setCapB([]); setThinking(false); setPromo(null);
  };

  const startGame = () => {
    if (isBet) { const n = parseFloat(betAmt); if (isNaN(n) || n < 0.1) { setBetErr('Minimum 0.10 USDC'); return; } setBetErr(''); }
    reset(); setConfigured(true); setStarted(true);
  };

  const rematch = () => { reset(); setStarted(true); };
  const resign  = () => { if (!started || over) return; if (window.confirm('Retreat from battle?')) endGame('b', 'resignation'); };

  /* ── Config screen ── */
  if (!configured) {
    return (
      <div className="config-screen">
        <div className="config-card">
          <button className="config-back" onClick={() => navigate('/')}>← Retreat</button>
          <h2 className="config-title">
            {isBot ? '🤖 Battle vs AI' : isBet ? '💰 Bet Battle' : '⚔️ PvP Battle'}
          </h2>

          {isBot && (
            <div className="config-group">
              <label>Enemy Strength</label>
              <div className="diff-grid">
                {BOT_DIFFS.map((d) => (
                  <button key={d} className={`diff-btn ${botDiff === d ? 'active' : ''}`} onClick={() => setBotDiff(d)}>
                    {diffLabel(d)}
                  </button>
                ))}
              </div>
            </div>
          )}

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
              {soundOn ? '🔊 On' : '🔇 Off'}
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
                <div className="bs-row"><span>Point boost</span><strong className="fire">🔥 5× all points</strong></div>
              </div>
            </div>
          )}

          <button className="config-start-btn" onClick={startGame}>
            {isBet ? `⚔️ Start Bet Battle · ${parseFloat(betAmt) || 0} USDC` : '⚔️ Enter Battle'}
          </button>
        </div>
      </div>
    );
  }

  /* ── Game screen ── */
  return (
    <div className="game-page">

      {/* Opponent */}
      <div className="player-row">
        <div className="player-info">
          <div className="pi-av">{isBot ? '🤖' : '👤'}</div>
          <div className="pi-det">
            <span className="pi-name">{isBot ? `AI · ${diffLabel(botDiff)}` : 'Opponent'}</span>
            {thinking && <span className="pi-thinking">calculating…</span>}
          </div>
          <div className="pi-caps">{capB.map((p, i) => <span key={i}>{PSYMS[p]}</span>)}</div>
        </div>
        <Timer seconds={bTime} active={started && !over && turn === 'b'} side="black" inc={timeOpt.inc} />
      </div>

      {/* Board + sidebar */}
      <div className="game-layout">
        <div className="board-col">
          <Chessboard
            position={fen}
            onSquareClick={onSquareClick}
            onPieceDrop={onDrop}
            boardOrientation={flipped ? 'black' : 'white'}
            customSquareStyles={hilights}
            customBoardStyle={{ borderRadius: '4px', boxShadow: '0 8px 40px rgba(0,0,0,0.8)' }}
            customDarkSquareStyle={{ backgroundColor: '#4a1a1a' }}
            customLightSquareStyle={{ backgroundColor: '#c9a84c' }}
            areArrowsAllowed
          />
        </div>

        <div className="game-sidebar">
          {isBet && (
            <div className="bet-active-pill">
              💰 {betAmt} USDC · <span className="bap-boost">🔥 5× War Points</span>
            </div>
          )}
          <MoveList moves={moves} onPGN={exportPGN} />
          <div className="sidebar-controls">
            <button className="sc-btn" onClick={() => setFlipped((f) => !f)}>⟳</button>
            <button className="sc-btn" onClick={() => setSoundOn((s) => !s)}>{soundOn ? '🔊' : '🔇'}</button>
            {started && !over && <button className="sc-btn sc-resign" onClick={resign}>🏳</button>}
            <button className="sc-btn" onClick={() => navigate('/')}>🏠</button>
          </div>
        </div>
      </div>

      {/* Self */}
      <div className="player-row">
        <Timer seconds={wTime} active={started && !over && turn === 'w'} side="white" inc={timeOpt.inc} />
        <div className="player-info">
          <div className="pi-caps">{capW.map((p, i) => <span key={i}>{PSYMS[p]}</span>)}</div>
          <div className="pi-det">
            <span className="pi-name">You (White)</span>
            <span className="pi-sub">{nftBoost}× boost{isBet ? ' · 🔥 5×Bet' : ''}</span>
          </div>
          <div className="pi-av">♙</div>
        </div>
      </div>

      {promo && <PromoPicker color={chessRef.current.turn()} onSelect={onPromoSelect} />}

      {/* Game over */}
      {over && (
        <div className="game-over-overlay">
          <div className="go-modal">
            <div className={`go-banner ${over.winner === 'w' ? 'go-win' : over.winner === 'd' ? 'go-draw' : 'go-loss'}`}>
              <div className="go-title">
                {over.winner === 'w' ? '⚔️ Victory!' : over.winner === 'd' ? '🤝 Draw' : '💀 Defeated'}
              </div>
              <div className="go-reason">
                {over.reason === 'checkmate'   && (over.winner === 'w' ? 'Checkmate — enemy king falls!' : 'Your king has fallen')}
                {over.reason === 'resignation' && (over.winner === 'w' ? 'Enemy retreated' : 'You retreated')}
                {over.reason === 'timeout'     && (over.winner === 'w' ? 'Enemy ran out of time' : 'Time expired')}
                {over.reason === 'draw'        && 'Battle drawn'}
              </div>
            </div>
            <div className="go-stats">
              <div className="go-row"><span>War points</span><strong className="gold">+{over.earned}</strong></div>
              <div className="go-row"><span>NFT boost</span><strong>{nftBoost}×</strong></div>
              {isBet && (
                <div className="go-row">
                  <span>Wager result</span>
                  <strong className={over.winner === 'w' ? 'green' : 'red'}>
                    {over.winner === 'w' ? `+${(parseFloat(betAmt) * 2 * 0.98).toFixed(2)} USDC` : over.winner === 'd' ? 'Refunded' : `-${betAmt} USDC`}
                  </strong>
                </div>
              )}
              {isBet && <div className="go-row"><span>Bet boost</span><strong className="fire">🔥 5× applied</strong></div>}
            </div>
            <div className="go-actions">
              <button className="go-btn go-rematch" onClick={rematch}>🔄 Rematch</button>
              <button className="go-btn" onClick={exportPGN}>📋 PGN</button>
              <button className="go-btn go-home" onClick={() => navigate('/')}>🏠 Home</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
