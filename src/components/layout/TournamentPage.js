import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const TOURNAMENTS = [
  {
    id: 'daily-blitz',
    name: 'Daily Blitz',
    subtitle: 'Fast & Furious · Every Day',
    entry: 5,
    maxPlayers: 8,
    timeControl: '3 min',
    format: 'Single Elimination',
    schedule: { hour: 20, minute: 0, days: 'every' },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #FFD700 100%)',
    accentColor: '#FF6B35',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="white" opacity="0.9"/>
      </svg>
    ),
    medal: '⚡',
  },
  {
    id: 'weekly-champion',
    name: 'Weekly Champion',
    subtitle: 'Prove Your Worth · Every Friday',
    entry: 5,
    maxPlayers: 16,
    timeControl: '5 min',
    format: 'Single Elimination',
    schedule: { hour: 18, minute: 0, days: 5 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #0A0F1E 0%, #0039B3 50%, #0052FF 100%)',
    accentColor: '#0052FF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path d="M8 21h8M12 21v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 4H4v6a8 8 0 0 0 16 0V4h-3" stroke="white" strokeWidth="2"/>
        <path d="M7 4h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    medal: '🏆',
  },
  {
    id: 'bet-masters',
    name: 'Bet Masters Cup',
    subtitle: 'High Stakes Glory · Every Sunday',
    entry: 5,
    maxPlayers: 32,
    timeControl: '5 min',
    format: 'Single Elimination',
    schedule: { hour: 16, minute: 0, days: 0 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #0A0F1E 0%, #7B4F00 50%, #C9A84C 100%)',
    accentColor: '#C9A84C',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="6" stroke="white" strokeWidth="2"/>
        <circle cx="12" cy="8" r="3" fill="rgba(255,215,0,0.8)"/>
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
    medal: '👑',
  },
  {
    id: 'rapid-weekend',
    name: 'Rapid Weekend',
    subtitle: 'Weekend Warriors · Every Saturday',
    entry: 5,
    maxPlayers: 16,
    timeControl: '10 min',
    format: 'Single Elimination',
    schedule: { hour: 14, minute: 0, days: 6 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #003D1F 0%, #05B169 70%, #00E5A0 100%)',
    accentColor: '#05B169',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
        <polyline points="12 6 12 12 16 14" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    ),
    medal: '⏱',
  },
];

function getNextOccurrence(schedule) {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(schedule.hour, schedule.minute, 0, 0);
  if (schedule.days === 'every') {
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  } else {
    const currentDay = now.getUTCDay();
    let daysUntil = (schedule.days - currentDay + 7) % 7;
    if (daysUntil === 0 && next <= now) daysUntil = 7;
    next.setUTCDate(next.getUTCDate() + daysUntil);
  }
  return next;
}

function getTournamentStatus(schedule) {
  const now = new Date();
  const start = getNextOccurrence(schedule);
  const regOpen = new Date(start.getTime() - 2 * 60 * 60 * 1000);
  const msUntilStart = start - now;
  const msUntilReg = regOpen - now;
  if (msUntilStart < 0) return { status: 'live', ms: 0, startDate: start };
  if (msUntilReg <= 0) return { status: 'open', ms: msUntilStart, startDate: start };
  return { status: 'upcoming', ms: msUntilReg, startMs: msUntilStart, startDate: start };
}

function CountdownDisplay({ ms, label }) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    setRemaining(ms);
    const iv = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(iv);
  }, [ms]);
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const s = Math.floor((remaining % 60000) / 1000);
  const box = { background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '5px 9px', fontFamily: 'monospace', fontSize: 19, fontWeight: 900, color: '#fff', minWidth: 38, textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' };
  const sep = { color: 'rgba(255,255,255,0.5)', fontWeight: 900, fontSize: 17, padding: '0 1px' };
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
        {h > 0 && <><div style={box}>{String(h).padStart(2,'0')}</div><span style={sep}>:</span></>}
        <div style={box}>{String(m).padStart(2,'0')}</div>
        <span style={sep}>:</span>
        <div style={box}>{String(s).padStart(2,'0')}</div>
      </div>
    </div>
  );
}

function formatDate(date) {
  return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC', timeZoneName: 'short' });
}

export default function TournamentPage() {
  const { joinedTournaments, joinTournament, wallet } = useStore();
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(null);

  useEffect(() => {
    const update = () => {
      const s = {};
      TOURNAMENTS.forEach(t => { s[t.id] = getTournamentStatus(t.schedule); });
      setStatuses(s);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, []);

  const join = async (t) => {
    const ts = statuses[t.id];
    if (ts?.status === 'upcoming') { toast.error('Registration not open yet'); return; }
    if (ts?.status === 'live') { toast.error('Tournament already started'); return; }
    if (joinedTournaments.find(j => j.id === t.id)) { toast('Already registered!'); return; }
    if (!wallet?.address) { toast.error('Connect wallet first'); return; }
    setLoading(t.id);
    try {
      const res = await fetch(`https://ws.chesswar.xyz/balance/${wallet.address}`);
      const bal = await res.json();
      if (parseFloat(bal.usdc_balance) < t.entry) {
        toast.error(`Need ${t.entry} USDC in-app balance. Deposit first.`);
        setLoading(null); return;
      }
      await fetch('https://ws.chesswar.xyz/deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: wallet.address, amount: -t.entry })
      });
      joinTournament(t.id);
      toast.success(`Registered for ${t.name}! ${t.entry} USDC deducted.`);
    } catch { toast.error('Failed to join. Try again.'); }
    setLoading(null);
  };

  const prizePool = (t) => (t.entry * t.maxPlayers * 0.9).toFixed(0);
  const totalPrize = TOURNAMENTS.reduce((a, t) => a + parseInt(prizePool(t)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#0A0F1E,#0A1628)', borderRadius: 24, padding: '28px 20px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,82,255,0.3),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(201,168,76,0.2),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 52, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>War Tournaments</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20 }}>Compete · Win USDC · Earn 5× Points</div>
        <div style={{ display: 'flex', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: '12px 0', border: '1px solid rgba(255,255,255,0.08)' }}>
          {[{ val: `$${totalPrize}`, label: 'Weekly Prizes' }, { val: '4', label: 'Tournaments' }, { val: '5 USDC', label: 'Entry Fee' }, { val: '5×', label: 'Points Boost' }].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none', padding: '0 8px' }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: i === 3 ? '#FFD700' : '#fff' }}>{s.val}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      {TOURNAMENTS.map(t => {
        const ts = statuses[t.id];
        const joined = joinedTournaments.find(j => j.id === t.id);
        const pool = prizePool(t);
        const isOpen = ts?.status === 'open';
        const isLive = ts?.status === 'live';
        const isLoading = loading === t.id;

        return (
          <div key={t.id} style={{ borderRadius: 20, overflow: 'hidden', boxShadow: joined ? `0 8px 32px ${t.accentColor}30` : '0 4px 20px rgba(0,0,0,0.1)', border: joined ? `2px solid ${t.accentColor}` : '1.5px solid #E3E7EF', background: '#fff' }}>

            {/* Header */}
            <div style={{ background: t.bg, padding: '20px 20px 18px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.1),transparent 50%)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)', flexShrink: 0 }}>
                  {t.icon}
                </div>
                <div>
                  {isLive && (
                    <div style={{ background: 'rgba(255,68,68,0.9)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }} /> LIVE NOW
                    </div>
                  )}
                  {isOpen && <CountdownDisplay ms={ts.ms} label="Starts in" />}
                  {ts?.status === 'upcoming' && <CountdownDisplay ms={ts.ms} label="Opens in" />}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 22 }}>{t.medal}</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: -0.3 }}>{t.name}</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', paddingLeft: 30 }}>{t.subtitle}</div>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 18px' }}>

              {/* Start time */}
              {ts?.startDate && (
                <div style={{ background: '#F8F9FF', borderRadius: 10, padding: '8px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E8ECFF' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize: 12, color: '#0052FF', fontWeight: 600 }}>{isOpen ? 'Starts' : 'Next'}: {formatDate(ts.startDate)}</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Time', val: t.timeControl },
                  { label: 'Players', val: t.maxPlayers },
                  { label: 'Prize Pool', val: `$${pool}` },
                ].map((s, i) => (
                  <div key={i} style={{ background: '#F8F9FA', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: t.accentColor }}>{s.val}</div>
                    <div style={{ fontSize: 10, color: '#9EA6B3', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Prize breakdown */}
              <div style={{ background: '#FFFBEB', borderRadius: 12, padding: '12px 14px', marginBottom: 12, border: '1px solid #FDE68A' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>💰 Prize Breakdown</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[{ place: '🥇 1st', pct: t.prizes[0], color: '#D97706' }, { place: '🥈 2nd', pct: t.prizes[1], color: '#6B7280' }, { place: '🥉 3rd', pct: t.prizes[2], color: '#92400E' }].map((p, i) => (
                    <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '6px 4px', textAlign: 'center', border: `1px solid ${p.color}30` }}>
                      <div style={{ fontSize: 12 }}>{p.place}</div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: p.color }}>{p.pct}%</div>
                      <div style={{ fontSize: 10, color: '#9EA6B3' }}>${(pool * p.pct / 100).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5x badge */}
              <div style={{ background: 'linear-gradient(135deg,#EBF0FF,#F5F3FF)', borderRadius: 10, padding: '8px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,82,255,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span style={{ fontSize: 12, color: '#5B21B6', fontWeight: 700 }}>5× Point Boost · Placement bonus: 1st=500pts, 2nd=200pts, 3rd=100pts</span>
              </div>

              {/* Button */}
              <button
                onClick={() => join(t)}
                disabled={!!joined || isLive || isLoading}
                style={{ width: '100%', padding: '15px', borderRadius: 14, fontSize: 15, fontWeight: 800, transition: 'all .15s', border: 'none', cursor: joined || isLive ? 'not-allowed' : 'pointer', background: joined ? '#E6F9F1' : ts?.status === 'upcoming' ? '#F5F7FA' : isLive ? '#FEF2F2' : t.bg, color: joined ? '#05B169' : ts?.status === 'upcoming' ? '#9EA6B3' : isLive ? '#EF4444' : '#fff', boxShadow: joined || ts?.status !== 'open' ? 'none' : `0 6px 20px ${t.accentColor}50` }}
              >
                {isLoading ? '⏳ Processing...' :
                 joined ? '✓ Registered — Await tournament start' :
                 isLive ? '🔴 Tournament In Progress' :
                 ts?.status === 'upcoming' ? '⏳ Registration Not Open Yet' :
                 `Register Now · ${t.entry} USDC`}
              </button>

              {joined && <div style={{ textAlign: 'center', fontSize: 12, color: t.accentColor, marginTop: 8, fontWeight: 600 }}>You're in! Be ready when the tournament starts.</div>}
              {isOpen && !joined && <div style={{ textAlign: 'center', fontSize: 11, color: '#9EA6B3', marginTop: 6 }}>Full refund if fewer than 4 players join</div>}
            </div>
          </div>
        );
      })}

      {/* Rules */}
      <div style={{ background: 'linear-gradient(135deg,#0A0F1E,#0A1628)', borderRadius: 20, padding: '20px 18px', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Tournament Rules
        </div>
        {[['🔑','Registration opens 2 hours before start time'],['⚡','Bracket generated automatically at start time'],['🎮','Each round is a real chess game — winner advances'],['⭐','5× point boost on every tournament game played'],['💰','Prize paid instantly to your in-app balance'],['↩️','Full refund if fewer than 4 players register'],['⏱','No-show = forfeit — be ready when your game starts'],['🏅','Placement bonus: 1st=500pts, 2nd=200pts, 3rd=100pts']].map(([icon, text], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5 }}>{text}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
