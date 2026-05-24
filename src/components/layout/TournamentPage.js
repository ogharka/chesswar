import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { connectSocket } from '../../utils/socket';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Icons = {
  Lightning: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="rgba(255,255,255,0.95)"/>
      <defs><linearGradient id="lg1" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#FFD700"/><stop offset="1" stopColor="#FFA500"/></linearGradient></defs>
    </svg>
  ),
  Trophy: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M8 21h8M12 21v-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 4H4v6a8 8 0 0016 0V4h-3" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2"/>
      <path d="M7 4h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="11" r="2.5" fill="#FFD700"/>
    </svg>
  ),
  Crown: () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M2 20h20M4 20l2-8 5 4 3-8 3 8 5-4 2 8" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="4" cy="12" r="1.5" fill="#FFD700"/>
      <circle cx="12" cy="8" r="1.5" fill="#FFD700"/>
      <circle cx="20" cy="12" r="1.5" fill="#FFD700"/>
    </svg>
  ),
};

// Blitz start time fixed when page loads
const BLITZ_START = Date.now() + 2 * 60 * 1000;

const TOURNAMENTS = [
  {
    id: 'blitz-4hr',
    name: 'Blitz Cup',
    subtitle: 'Quick Battles · Every 4 Hours',
    entry: 0.1,
    maxPlayers: 30,
    timeControl: '10 min',
    scheduleType: 'blitz',
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #003BBF 0%, #0052FF 60%, #1A6BFF 100%)',
    accentColor: '#0052FF',
    glowColor: 'rgba(0,82,255,0.4)',
    Icon: Icons.Lightning,
    medal: '⚡',
    tag: 'EVERY 4H',
    tagColor: '#60A5FA',
  },
  {
    id: 'daily-champ',
    name: 'Daily Champion',
    subtitle: 'Daily Glory · Every 24 Hours',
    entry: 10,
    maxPlayers: 30,
    timeControl: '10 min',
    scheduleType: 'daily',
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #1A0A4F 0%, #3B1FBF 55%, #6B4FFF 100%)',
    accentColor: '#7B61FF',
    glowColor: 'rgba(107,79,255,0.35)',
    Icon: Icons.Trophy,
    medal: '🏆',
    tag: 'DAILY',
    tagColor: '#A78BFA',
  },
  {
    id: 'weekly-grand',
    name: 'Weekly Grand Cup',
    subtitle: 'Ultimate Glory · Every Week',
    entry: 50,
    maxPlayers: 30,
    timeControl: '10 min',
    scheduleType: 'weekly',
    prizes: [60, 25, 7.5, 7.5],
    bg: 'linear-gradient(135deg, #1A0F00 0%, #7B4F00 50%, #C9A84C 100%)',
    accentColor: '#C9A84C',
    glowColor: 'rgba(201,168,76,0.35)',
    Icon: Icons.Crown,
    medal: '👑',
    tag: 'WEEKLY',
    tagColor: '#FCD34D',
  },
];

function getTournamentStatus(t) {
  const now = Date.now();
  if (t.scheduleType === 'blitz') {
    const ms = BLITZ_START - now;
    if (ms <= 0) return { status: 'starting', ms: 0, startDate: new Date(BLITZ_START) };
    return { status: 'open', ms, startDate: new Date(BLITZ_START) };
  }
  if (t.scheduleType === 'daily') {
    const next = new Date();
    next.setUTCHours(20, 0, 0, 0);
    if (next.getTime() <= now) next.setUTCDate(next.getUTCDate() + 1);
    const ms = next.getTime() - now;
    const regOpen = new Date(next.getTime() - 2 * 60 * 60 * 1000);
    if (ms <= 0) return { status: 'starting', ms: 0, startDate: next };
    if (regOpen.getTime() <= now) return { status: 'open', ms, startDate: next };
    return { status: 'upcoming', ms: regOpen.getTime() - now, startDate: next };
  }
  if (t.scheduleType === 'weekly') {
    const next = new Date();
    const day = next.getUTCDay();
    const daysUntilFri = (5 - day + 7) % 7 || 7;
    next.setUTCDate(next.getUTCDate() + daysUntilFri);
    next.setUTCHours(18, 0, 0, 0);
    const ms = next.getTime() - now;
    const regOpen = new Date(next.getTime() - 24 * 60 * 60 * 1000);
    if (ms <= 0) return { status: 'starting', ms: 0, startDate: next };
    if (regOpen.getTime() <= now) return { status: 'open', ms, startDate: next };
    return { status: 'upcoming', ms: regOpen.getTime() - now, startDate: next };
  }
  return { status: 'upcoming', ms: 0, startDate: new Date() };
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
  const box = { background:'rgba(0,0,0,0.4)', backdropFilter:'blur(8px)', borderRadius:8, padding:'5px 8px', fontFamily:'monospace', fontSize:19, fontWeight:900, color:'#fff', minWidth:36, textAlign:'center', border:'1px solid rgba(255,255,255,0.2)' };
  const sep = { color:'rgba(255,255,255,0.4)', fontWeight:900, fontSize:16 };
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontSize:9, color:'rgba(255,255,255,0.55)', textTransform:'uppercase', letterSpacing:2, marginBottom:5 }}>{label}</div>
      <div style={{ display:'flex', alignItems:'center', gap:3 }}>
        {h > 0 && <><div style={box}>{String(h).padStart(2,'0')}</div><span style={sep}>:</span></>}
        <div style={box}>{String(m).padStart(2,'0')}</div>
        <span style={sep}>:</span>
        <div style={box}>{String(s).padStart(2,'0')}</div>
      </div>
    </div>
  );
}

function formatDate(date) {
  return date.toLocaleString('en-US', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', timeZone:'UTC', timeZoneName:'short' });
}

export default function TournamentPage() {
  const { joinedTournaments, joinTournament, wallet, profile } = useStore();
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(null);
  const [playerCounts, setPlayerCounts] = useState({ 'blitz-4hr': 0, 'daily-champ': 0, 'weekly-grand': 0 });

  useEffect(() => {
    const update = () => {
      const s = {};
      TOURNAMENTS.forEach(t => {
        const ts = getTournamentStatus(t);
        s[t.id] = ts;
        if (ts.status === 'starting' && joinedTournaments.find(j => j.id === t.id) && wallet?.address) {
          fetch('https://ws.chesswar.xyz/tournament/start', {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ tournamentId: t.id })
          }).catch(() => {});
        }
      });
      setStatuses(s);
    };
    update();
    const iv = setInterval(update, 1000);
    return () => clearInterval(iv);
  }, [joinedTournaments, wallet]);

  // Fetch real player counts from server
  useEffect(() => {
    const fetchCounts = () => {
      TOURNAMENTS.forEach(t => {
        fetch(`https://ws.chesswar.xyz/tournament/${t.id}`)
          .then(r => r.json())
          .then(data => {
            if (data?.players !== undefined) {
              setPlayerCounts(prev => ({ ...prev, [t.id]: data.players }));
            }
          }).catch(() => {});
      });
    };
    fetchCounts();
    const iv = setInterval(fetchCounts, 5000);
    return () => clearInterval(iv);
  }, []);

  const join = async (t) => {
    const ts = statuses[t.id];
    if (ts?.status === 'upcoming') { toast.error('Registration not open yet'); return; }
    if (ts?.status === 'starting') { toast.error('Tournament already started'); return; }
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
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ address: wallet.address, amount: -t.entry })
      });
      joinTournament(t.id);

      // Connect to tournament WebSocket room
      const socket = connectSocket();
      socket.emit('tournament_join', {
        tournamentId: t.id,
        address: wallet.address,
        username: profile.username || 'Anonymous'
      });
      socket.on('tournament_update', ({ players }) => {
        setPlayerCounts(prev => ({ ...prev, [t.id]: players }));
      });
      socket.on('game_found', ({ gameId, color, opponent, tournament }) => {
        if (tournament) {
          toast.success('Tournament match found! Starting game...');
          navigate('/play/pvp', { state: { gameId, color, opponent, online: true, tournament: true, timeControl: 10 } });
        }
      });

      toast.success(`Registered for ${t.name}! ${t.entry} USDC deducted.`);
    } catch { toast.error('Failed to join. Try again.'); }
    setLoading(null);
  };

  const prizePool = (t) => (t.entry * t.maxPlayers * 0.9).toFixed(0);
  const totalPrize = TOURNAMENTS.reduce((a, t) => a + parseInt(prizePool(t)), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14, paddingBottom:24 }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(160deg,#0A0F1E,#001466)', borderRadius:24, padding:'26px 20px 22px', textAlign:'center', position:'relative', overflow:'hidden', boxShadow:'0 16px 48px rgba(0,20,102,0.6)', border:'1px solid rgba(0,82,255,0.2)' }}>
        <div style={{ position:'absolute', top:-60, right:-40, width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle,rgba(0,82,255,0.4),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-50, left:-40, width:160, height:160, borderRadius:'50%', background:'radial-gradient(circle,rgba(107,79,255,0.3),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ fontSize:52, marginBottom:8 }}>🏆</div>
        <div style={{ fontSize:24, fontWeight:900, color:'#fff', marginBottom:4 }}>War Tournaments</div>
        <div style={{ fontSize:13, color:'rgba(255,255,255,0.55)', marginBottom:20 }}>Compete · Win USDC · Earn 5× Points</div>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', overflow:'hidden' }}>
          {[{ val:`$${totalPrize}`, label:'Total Prizes', color:'#60A5FA' }, { val:'3', label:'Tournaments', color:'#fff' }, { val:'0.1-50', label:'Entry Fee', color:'#fff' }, { val:'5×', label:'Pts Boost', color:'#FFD700' }].map((s, i) => (
            <div key={i} style={{ flex:1, textAlign:'center', borderRight: i<3 ? '1px solid rgba(255,255,255,0.07)' : 'none', padding:'10px 6px' }}>
              <div style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:0.5, marginTop:2 }}>{s.label}</div>
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
        const isLive = ts?.status === 'starting';
        const isUpcoming = ts?.status === 'upcoming';
        const isLoading = loading === t.id;
        const registeredCount = playerCounts[t.id] || 0;

        return (
          <div key={t.id} style={{ borderRadius:22, overflow:'hidden', boxShadow: joined ? `0 12px 40px ${t.glowColor}` : isOpen ? `0 6px 24px ${t.glowColor}` : '0 4px 16px rgba(0,0,0,0.08)', border: joined ? `2px solid ${t.accentColor}` : isOpen ? `1.5px solid ${t.accentColor}60` : '1.5px solid #E3E7EF', background:'#fff' }}>

            {/* Header */}
            <div style={{ background:t.bg, padding:'20px 18px 16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(255,255,255,0.12),transparent 40%)', pointerEvents:'none' }}/>
              <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.06) 1px,transparent 1px)', backgroundSize:'20px 20px', pointerEvents:'none' }}/>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14, position:'relative' }}>
                <div style={{ position:'relative' }}>
                  <div style={{ width:60, height:60, borderRadius:20, background:'rgba(0,0,0,0.35)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center', justifyContent:'center', border:'1.5px solid rgba(255,255,255,0.25)', boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
                    <t.Icon />
                  </div>
                  <div style={{ position:'absolute', top:-6, right:-8, background:t.tagColor, color:'#000', fontSize:7, fontWeight:900, borderRadius:6, padding:'2px 5px', letterSpacing:0.5 }}>{t.tag}</div>
                </div>
                <div style={{ flexShrink:0 }}>
                  {isLive && <div style={{ background:'rgba(239,68,68,0.85)', borderRadius:20, padding:'6px 12px', fontSize:11, fontWeight:800, color:'#fff', display:'flex', alignItems:'center', gap:6 }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#fff', display:'inline-block' }}/> LIVE</div>}
                  {isOpen && <CountdownDisplay ms={ts.ms} label="Starts in" />}
                  {isUpcoming && <CountdownDisplay ms={ts.ms} label="Opens in" />}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                <span style={{ fontSize:20 }}>{t.medal}</span>
                <span style={{ fontSize:19, fontWeight:900, color:'#fff', letterSpacing:-0.4 }}>{t.name}</span>
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.6)', paddingLeft:28 }}>{t.subtitle}</div>
            </div>

            {/* Body */}
            <div style={{ padding:'14px 16px' }}>

              {/* Start time */}
              {ts?.startDate && (
                <div style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius:10, padding:'8px 12px', marginBottom:12, display:'flex', alignItems:'center', gap:8, border:`1px solid ${t.accentColor}20` }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.accentColor} strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span style={{ fontSize:11, color:t.accentColor, fontWeight:700 }}>{isOpen ? '🟢 Starts' : '📅 Next'}: {formatDate(ts.startDate)}</span>
                </div>
              )}

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, marginBottom:12 }}>
                {[
                  { label:'Time', val:t.timeControl },
                  { label:'Max', val:t.maxPlayers },
                  { label:'Registered', val:`${registeredCount}/${t.maxPlayers}` },
                  { label:'Prize', val:`$${pool}` },
                ].map((s, i) => (
                  <div key={i} style={{ background:'#F8FAFC', borderRadius:10, padding:'8px 4px', textAlign:'center', border:'1px solid #EEF2F6' }}>
                    <div style={{ fontSize:13, fontWeight:900, color: i===2 && registeredCount > 0 ? t.accentColor : t.accentColor }}>{s.val}</div>
                    <div style={{ fontSize:9, color:'#94A3B8', fontWeight:600, textTransform:'uppercase', letterSpacing:0.3 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Prize breakdown */}
              <div style={{ background:'linear-gradient(135deg,#FFFBEB,#FEF3C7)', borderRadius:14, padding:'10px 12px', marginBottom:12, border:'1px solid #FDE68A' }}>
                <div style={{ fontSize:10, fontWeight:800, color:'#92400E', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>💰 Prize Pool · ${pool}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {[{place:'🥇 1st',pct:t.prizes[0],color:'#D97706'},{place:'🥈 2nd',pct:t.prizes[1],color:'#6B7280'},{place:'🥉 3rd',pct:t.prizes[2],color:'#92400E'}].map((p,i) => (
                    <div key={i} style={{ flex:1, background:'rgba(255,255,255,0.7)', borderRadius:8, padding:'6px 4px', textAlign:'center' }}>
                      <div style={{ fontSize:12 }}>{p.place}</div>
                      <div style={{ fontSize:12, fontWeight:800, color:p.color }}>${(pool*p.pct/100).toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 5x badge */}
              <div style={{ background:'linear-gradient(135deg,#EEF2FF,#EDE9FE)', borderRadius:12, padding:'8px 12px', marginBottom:14, display:'flex', alignItems:'center', gap:10, border:'1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:800, color:'#4338CA' }}>5× Point Boost on all games</div>
                  <div style={{ fontSize:10, color:'#6366F1' }}>1st +500pts · 2nd +200pts · 3rd +100pts</div>
                </div>
              </div>

              {/* Button */}
              <button onClick={() => join(t)} disabled={!!joined || isLive || isLoading}
                style={{ width:'100%', padding:'15px', borderRadius:14, fontSize:15, fontWeight:800, border:'none', cursor: joined||isLive ? 'not-allowed' : 'pointer', background: joined ? '#E6F9F1' : isUpcoming ? '#F1F5F9' : isLive ? '#FEF2F2' : `linear-gradient(135deg,${t.accentColor},${t.accentColor}CC)`, color: joined ? '#059669' : isUpcoming ? '#94A3B8' : isLive ? '#DC2626' : '#fff', boxShadow: joined||isUpcoming||isLive ? 'none' : `0 6px 20px ${t.glowColor}` }}>
                {isLoading ? '⏳ Processing...' : joined ? `✓ Registered (${registeredCount}/${t.maxPlayers} players)` : isLive ? 'Tournament In Progress' : isUpcoming ? 'Registration Not Open Yet' : `Register Now · ${t.entry} USDC`}
              </button>

              {isOpen && !joined && <div style={{ textAlign:'center', fontSize:10, color:'#94A3B8', marginTop:6 }}>Full refund if fewer than 4 players register</div>}
            </div>
          </div>
        );
      })}

      {/* Rules */}
      <div style={{ background:'linear-gradient(160deg,#0A0F1E,#0A1628)', borderRadius:20, padding:'20px 18px', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'rgba(255,215,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,215,0,0.3)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          How It Works
        </div>
        {[['01','Register','Pay entry fee during registration window. Funds locked until tournament ends.'],['02','Bracket','Players paired randomly at start time. Your match begins automatically.'],['03','Play','Real chess game against your opponent. Winner advances each round.'],['04','Win','Champion takes 60% of prize pool. Prizes paid instantly to in-app balance.'],['05','Refund','Full refund if fewer than 4 players register before start.']].map(([num,title,desc],i) => (
          <div key={i} style={{ display:'flex', gap:12, paddingBottom: i<4?14:0, marginBottom: i<4?14:0, borderBottom: i<4?'1px solid rgba(255,255,255,0.05)':'none' }}>
            <div style={{ width:30, height:30, borderRadius:9, background:'rgba(0,82,255,0.2)', border:'1px solid rgba(0,82,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:900, color:'#60A5FA', fontFamily:'monospace' }}>{num}</span>
            </div>
            <div>
              <div style={{ fontSize:12, fontWeight:800, color:'#fff', marginBottom:2 }}>{title}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.5 }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
