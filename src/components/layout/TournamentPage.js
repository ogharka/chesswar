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

function getTournamentStatus(t, serverTimes) {
  if (serverTimes === null) return { status: 'loading', ms: 0, startDate: new Date() };
  const now = Date.now();
  if (t.scheduleType === 'blitz') {
    const ms = BLITZ_START - now;
    if (ms <= 0) return { status: 'starting', ms: 0, startDate: new Date(BLITZ_START) };
    return { status: 'open', ms, startDate: new Date(BLITZ_START) };
  }
  if (t.scheduleType === 'daily') {
    const startTs = serverTimes['daily-champ'] || (() => { const n=new Date(); n.setUTCHours(20,0,0,0); if(n.getTime()<=now) n.setUTCDate(n.getUTCDate()+1); return n.getTime(); })();
    const ms = startTs - now;
    if (ms <= -5*60*1000) return { status: 'expired', ms: 0, startDate: new Date(startTs) };
    if (ms <= 0) return { status: 'enter_now', ms: 5*60*1000+ms, startDate: new Date(startTs) };
    if (ms <= 30*60*1000) return { status: 'reg_closed', ms, startDate: new Date(startTs) };
    return { status: 'open', ms, startDate: new Date(startTs) };
  }
  if (t.scheduleType === 'weekly') {
    const startTs = serverTimes['weekly-grand'] || (() => { const n=new Date(); const d=(5-n.getUTCDay()+7)%7||7; n.setUTCDate(n.getUTCDate()+d); n.setUTCHours(18,0,0,0); return n.getTime(); })();
    const ms = startTs - now;
    if (ms <= -5*60*1000) return { status: 'expired', ms: 0, startDate: new Date(startTs) };
    if (ms <= 0) return { status: 'enter_now', ms: 5*60*1000+ms, startDate: new Date(startTs) };
    if (ms <= 60*60*1000) return { status: 'reg_closed', ms, startDate: new Date(startTs) };
    return { status: 'open', ms, startDate: new Date(startTs) };
  }
  return { status: 'upcoming', ms: 0, startDate: new Date() };
}

function CountdownDisplay({ ms, label }) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    setRemaining(ms);
    const iv = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'60vh', gap:24, padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:72, filter:'drop-shadow(0 0 20px rgba(0,82,255,0.4))' }}>🏆</div>
      <div>
        <div style={{ fontSize:24, fontWeight:900, color:'var(--t1)', marginBottom:8 }}>Tournaments</div>
        <div style={{ fontSize:14, color:'var(--t3)', lineHeight:1.6, maxWidth:280 }}>
          Compete with players worldwide, win USDC prizes and earn 5× points boost.
        </div>
      </div>
      <div style={{ background:'linear-gradient(135deg,#0A0F1E,#001466)', borderRadius:20, padding:'20px 32px', border:'1px solid rgba(0,82,255,0.3)' }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#60A5FA', letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Coming Soon</div>
        <div style={{ fontSize:12, color:'rgba(255,255,255,0.5)' }}>Launching with the token</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10, width:'100%', maxWidth:300 }}>
        {[
          { icon:'⚡', text:'Blitz Cup — Every 4 Hours' },
          { icon:'🏆', text:'Daily Champion — Every 24 Hours' },
          { icon:'👑', text:'Weekly Grand Cup — Every Week' },
        ].map((item, i) => (
          <div key={i} style={{ background:'var(--card)', borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', gap:12, border:'1px solid var(--border)' }}>
            <span style={{ fontSize:20 }}>{item.icon}</span>
            <span style={{ fontSize:13, color:'var(--t2)', fontWeight:600 }}>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
