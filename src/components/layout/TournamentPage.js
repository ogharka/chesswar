import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

// Premium SVG Icons
const Icons = {
  Lightning: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255,255,255,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.5"/>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="url(#lg1)"/>
      <defs><linearGradient id="lg1" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
    </svg>
  ),
  Trophy: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 21v-4" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 4H4v6a8 8 0 0016 0V4h-3" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
      <path d="M7 4h10" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="11" r="2.5" fill="#FFD700"/>
      <path d="M10 9l1.5 1.5L14 8" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Crown: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M2 20h20M4 20l2-8 5 4 3-8 3 8 5-4 2 8" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="4" cy="12" r="1.5" fill="#FFD700"/>
      <circle cx="12" cy="8" r="1.5" fill="#FFD700"/>
      <circle cx="20" cy="12" r="1.5" fill="#FFD700"/>
      <rect x="2" y="20" width="20" height="2" rx="1" fill="rgba(255,255,255,0.5)"/>
    </svg>
  ),
  Clock: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.9)" strokeWidth="2"/>
      <circle cx="12" cy="12" r="6" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5"/>
      <polyline points="12 7 12 12 15.5 14.5" stroke="rgba(255,255,255,0.95)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="1.5" fill="#fff"/>
      <line x1="12" y1="3.5" x2="12" y2="5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="19" x2="12" y2="20.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="3.5" y1="12" x2="5" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="19" y1="12" x2="20.5" y2="12" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

const TOURNAMENTS = [
  {
    id: 'daily-blitz',
    name: 'Daily Blitz',
    subtitle: 'Fast & Furious · Every Day 8 PM UTC',
    entry: 5,
    maxPlayers: 8,
    timeControl: '3 min',
    schedule: { hour: 20, minute: 0, days: 'every', forceOpen: true },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #003BBF 0%, #0052FF 60%, #1A6BFF 100%)',
    accentColor: '#0052FF',
    glowColor: 'rgba(0,82,255,0.4)',
    Icon: Icons.Lightning,
    medal: '⚡',
    tag: 'DAILY',
    tagColor: '#60A5FA',
  },
  {
    id: 'weekly-champion',
    name: 'Weekly Champion',
    subtitle: 'Prove Your Worth · Every Friday 6 PM UTC',
    entry: 5,
    maxPlayers: 16,
    timeControl: '5 min',
    schedule: { hour: 18, minute: 0, days: 5 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #1A0A4F 0%, #3B1FBF 55%, #6B4FFF 100%)',
    accentColor: '#7B61FF',
    glowColor: 'rgba(107,79,255,0.35)',
    Icon: Icons.Trophy,
    medal: '🏆',
    tag: 'WEEKLY',
    tagColor: '#A78BFA',
  },
  {
    id: 'bet-masters',
    name: 'Bet Masters Cup',
    subtitle: 'High Stakes Glory · Every Sunday 4 PM UTC',
    entry: 5,
    maxPlayers: 32,
    timeControl: '5 min',
    schedule: { hour: 16, minute: 0, days: 0 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #1A0F00 0%, #7B4F00 50%, #C9A84C 100%)',
    accentColor: '#C9A84C',
    glowColor: 'rgba(201,168,76,0.35)',
    Icon: Icons.Crown,
    medal: '👑',
    tag: 'WEEKLY',
    tagColor: '#FCD34D',
  },
  {
    id: 'rapid-weekend',
    name: 'Rapid Weekend',
    subtitle: 'Weekend Warriors · Every Saturday 2 PM UTC',
    entry: 5,
    maxPlayers: 16,
    timeControl: '10 min',
    schedule: { hour: 14, minute: 0, days: 6 },
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #003040 0%, #005F8A 50%, #0096C7 100%)',
    accentColor: '#0096C7',
    glowColor: 'rgba(0,150,199,0.35)',
    Icon: Icons.Clock,
    medal: '⏱',
    tag: 'WEEKEND',
    tagColor: '#67E8F9',
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
  if (schedule.forceOpen) {
    const start = new Date(now.getTime() + 58 * 60 * 1000);
    return { status: 'open', ms: 58 * 60 * 1000, startDate: start };
  }
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
  const box = {
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)',
    borderRadius: 8, padding: '5px 8px', fontFamily: 'monospace',
    fontSize: 20, fontWeight: 900, color: '#fff', minWidth: 36,
    textAlign: 'center', border: '1px solid rgba(255,255,255,0.2)',
    letterSpacing: 1, lineHeight: 1,
  };
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {h > 0 && <><div style={box}>{String(h).padStart(2,'0')}</div><span style={{ color:'rgba(255,255,255,0.4)',fontWeight:900,fontSize:16 }}>:</span></>}
        <div style={box}>{String(m).padStart(2,'0')}</div>
        <span style={{ color:'rgba(255,255,255,0.4)',fontWeight:900,fontSize:16 }}>:</span>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 24 }}>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(160deg, #0A0F1E 0%, #001466 50%, #0A0F1E 100%)',
        borderRadius: 24, padding: '26px 20px 22px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,20,102,0.6)',
        border: '1px solid rgba(0,82,255,0.2)',
      }}>
        {/* Glow orbs */}
        <div style={{ position:'absolute', top:-60, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,82,255,0.4) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle, rgba(107,79,255,0.3) 0%, transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(0,82,255,0.08) 0%, transparent 70%)', pointerEvents:'none' }}/>

        {/* Trophy icon */}
        <div style={{ position:'relative', display:'inline-block', marginBottom:10 }}>
          <div style={{ fontSize:54, filter:'drop-shadow(0 0 20px rgba(0,82,255,0.8)) drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }}>🏆</div>
          <div style={{ position:'absolute', top:-4, right:-4, width:20, height:20, borderRadius:'50%', background:'#0052FF', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
        </div>

        <div style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:4, letterSpacing:-0.5 }}>War Tournaments</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', marginBottom:20, letterSpacing:0.3 }}>
          Compete · Win USDC · Earn 5× Points
        </div>

        {/* Stats bar */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
          {[{ val:`$${totalPrize}`, label:'Weekly Prizes', color:'#60A5FA' }, { val:'4', label:'Tournaments', color:'#fff' }, { val:'5 USDC', label:'Entry Fee', color:'#fff' }, { val:'5×', label:'Pts Boost', color:'#FFD700' }].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:'center', borderRight: i<3 ? '1px solid rgba(255,255,255,0.07)' : 'none', padding:'10px 6px' }}>
              <div style={{ fontSize:16, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tournament Cards */}
      {TOURNAMENTS.map(t => {
        const ts = statuses[t.id];
        const joined = joinedTournaments.find(j => j.id === t.id);
        const pool = prizePool(t);
        const isOpen = ts?.status === 'open';
        const isLive = ts?.status === 'live';
        const isUpcoming = ts?.status === 'upcoming';
        const isLoading = loading === t.id;

        return (
          <div key={t.id} style={{
            borderRadius: 22, overflow: 'hidden',
            boxShadow: joined ? `0 12px 40px ${t.glowColor}` : isOpen ? `0 6px 24px ${t.glowColor}` : '0 4px 16px rgba(0,0,0,0.08)',
            border: joined ? `2px solid ${t.accentColor}` : isOpen ? `1.5px solid ${t.accentColor}60` : '1.5px solid #E3E7EF',
            background: '#fff',
            transition: 'all 0.2s ease',
          }}>
            {/* Gradient Header */}
            <div style={{ background: t.bg, padding:'20px 18px 16px', position:'relative', overflow:'hidden' }}>
              {/* Shimmer overlay */}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%, rgba(255,255,255,0.04) 100%)', pointerEvents:'none' }}/>
              {/* Dot pattern */}
              <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize:'20px 20px', pointerEvents:'none' }}/>

              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, position:'relative' }}>
                {/* Premium icon container */}
                <div style={{ position:'relative' }}>
                  <div style={{
                    width:60, height:60, borderRadius:20,
                    background:'rgba(0,0,0,0.35)', backdropFilter:'blur(16px)',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    border:'1.5px solid rgba(255,255,255,0.25)',
                    boxShadow:`0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)`,
                  }}>
                    <t.Icon />
                  </div>
                  {/* Tag */}
                  <div style={{ position:'absolute', top:-6, right:-8, background:t.tagColor, color:'#000', fontSize:8, fontWeight:900, borderRadius:6, padding:'2px 6px', letterSpacing:1 }}>{t.tag}</div>
                </div>

                {/* Status */}
                <div style={{ flexShrink:0 }}>
                  {isLive && (
                    <div style={{ background:'rgba(239,68,68,0.85)', backdropFilter:'blur(8px)', borderRadius:20, padding:'6px 12px', fontSize:11, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:6, border:'1px solid rgba(255,255,255,0.2)' }}>
                      <span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block', boxShadow:'0 0 6px #fff' }}/> LIVE NOW
                    </div>
                  )}
                  {isOpen && <CountdownDisplay ms={ts.ms} label="Starts in" />}
                  {isUpcoming && <CountdownDisplay ms={ts.ms} label="Opens in" />}
                </div>
              </div>

              {/* Title */}
              <div style={{ position:'relative' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span style={{ fontSize:20 }}>{t.medal}</span>
                  <span style={{ fontSize:19, fontWeight:900, color:'#fff', letterSpacing:-0.4, textShadow:'0 2px 8px rgba(0,0,0,0.3)' }}>{t.name}</span>
                </div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', paddingLeft:28, letterSpacing:0.3 }}>{t.subtitle}</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding:'14px 16px' }}>

              {/* Start time chip */}
              {ts?.startDate && (
                <div style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius:10, padding:'8px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:8, border:`1px solid ${t.accentColor}20` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.accentColor} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize:11, color:t.accentColor, fontWeight:700 }}>
                    {isOpen ? '🟢 Starts' : '📅 Next'}: {formatDate(ts.startDate)}
                  </span>
                </div>
              )}

              {/* Stats grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                {[
                  { label:'⚡ Time', val:t.timeControl },
                  { label:'👥 Players', val:t.maxPlayers },
                  { label:'💰 Prize', val:`$${pool}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:'#F8FAFC', borderRadius:12, padding:'10px 6px', textAlign:'center', border:'1px solid #EEF2F6' }}>
                    <div style={{ fontSize:14, fontWeight:900, color:t.accentColor, marginBottom:2 }}>{s.val}</div>
                    <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Prize breakdown */}
              <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius:14, padding:'12px 13px', marginBottom:12, border:'1px solid #FDE68A' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:1.5, marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#D97706"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  Prize Distribution
                </div>
                <div style={{ display:'flex', gap:6 }}>
                  {[
                    { place:'🥇', rank:'1st', pct:t.prizes[0], color:'#D97706', bg:'rgba(251,191,36,0.15)' },
                    { place:'🥈', rank:'2nd', pct:t.prizes[1], color:'#64748B', bg:'rgba(100,116,139,0.1)' },
                    { place:'🥉', rank:'3rd', pct:t.prizes[2], color:'#92400E', bg:'rgba(146,64,14,0.1)' },
                  ].map((p, i) => (
                    <div key={i} style={{ flex:1, background:p.bg, borderRadius:10, padding:'8px 4px', textAlign:'center', border:`1px solid ${p.color}25` }}>
                      <div style={{ fontSize:18, marginBottom:2 }}>{p.place}</div>
                      <div style={{ fontSize:11, fontWeight:900, color:p.color }}>{p.pct}%</div>
                      <div style={{ fontSize:10, color:'#94A3B8', fontWeight:600 }}>${(pool * p.pct / 100).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Points boost badge */}
              <div style={{ background:'linear-gradient(135deg,#EEF2FF,#EDE9FE)', borderRadius:12, padding:'9px 13px', marginBottom:14, display:'flex', alignItems:'center', gap:10, border:'1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 8px rgba(99,102,241,0.3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:12, fontWeight:800, color:'#4338CA' }}>5× Point Boost</div>
                  <div style={{ fontSize:10, color:'#6366F1' }}>1st +500pts · 2nd +200pts · 3rd +100pts</div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => join(t)}
                disabled={!!joined || isLive || isLoading}
                style={{
                  width:'100%', padding:'15px', borderRadius:14,
                  fontSize:15, fontWeight:800, border:'none',
                  cursor: joined || isLive ? 'not-allowed' : 'pointer',
                  background: joined ? '#E6F9F1' : isUpcoming ? '#F1F5F9' : isLive ? '#FEF2F2' :
                    `linear-gradient(135deg, ${t.accentColor}, ${t.accentColor}CC)`,
                  color: joined ? '#059669' : isUpcoming ? '#94A3B8' : isLive ? '#DC2626' : '#fff',
                  boxShadow: joined || isUpcoming || isLive ? 'none' : `0 6px 20px ${t.glowColor}`,
                  transition: 'all 0.15s ease',
                  letterSpacing: 0.3,
                }}
              >
                {isLoading ? '⏳ Processing...' :
                 joined ? '✓ Registered — Await Tournament Start' :
                 isLive ? '🔴 Tournament In Progress' :
                 isUpcoming ? '🔒 Registration Not Open Yet' :
                 `🎮 Register Now · ${t.entry} USDC Entry`}
              </button>

              {joined && (
                <div style={{ textAlign:'center', fontSize:11, color:t.accentColor, marginTop:8, fontWeight:700, letterSpacing:0.3 }}>
                  ✓ You're in! Be ready when the tournament starts.
                </div>
              )}
              {isOpen && !joined && (
                <div style={{ textAlign:'center', fontSize:10, color:'#94A3B8', marginTop:6 }}>
                  Full refund if fewer than 4 players register
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Rules Card */}
      <div style={{ background:'linear-gradient(160deg,#0A0F1E,#0A1628)', borderRadius:20, padding:'20px 18px', border:'1px solid rgba(255,255,255,0.06)', boxShadow:'0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,215,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,215,0,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          How It Works
        </div>
        {[
          ['🔑','Registration opens 2 hours before each tournament'],
          ['⚡','Bracket auto-generated at start — matches assigned instantly'],
          ['🎮','Play real chess games — winner advances each round'],
          ['⭐','5× point boost on every tournament game you play'],
          ['💰','Prizes paid instantly to your in-app USDC balance'],
          ['↩️','Full refund if fewer than 4 players register'],
          ['⏱','No-show = auto forfeit — be ready when game starts'],
          ['🏅','Placement bonus points awarded at tournament end'],
        ].map(([icon, text], i) => (
          <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:i < 7 ? 10 : 0 }}>
            <span style={{ fontSize:15, flexShrink:0 }}>{icon}</span>
            <span style={{ fontSize:12, color:'rgba(255,255,255,0.55)', lineHeight:1.5 }}>{text}</span>
          </div>
        ))}
      </div>

    </div>
  );
}
