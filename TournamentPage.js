import React from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const TOURNAMENTS = [
  { id: 1, name: 'Daily Blitz',      entry: 5,  prize: 45,  players: 8,  max: 16, status: 'open',   icon: '⚡' },
  { id: 2, name: 'Weekly Champion',  entry: 5,  prize: 120, players: 24, max: 32, status: 'open',   icon: '🏆' },
  { id: 3, name: 'Bet Masters Cup',  entry: 5,  prize: 200, players: 32, max: 64, status: 'open',   icon: '👑' },
  { id: 4, name: 'Rapid Weekend',    entry: 5,  prize: 80,  players: 16, max: 16, status: 'full',   icon: '⏱' },
];

export default function TournamentPage() {
  const { joinedTournaments, joinTournament, points } = useStore();

  const join = (t) => {
    if (t.status === 'full') { toast.error('Tournament is full'); return; }
    if (joinedTournaments.find(j => j.id === t.id)) { toast('Already registered'); return; }
    joinTournament(t.id);
    toast.success(`Joined ${t.name}! 5 USDC entry fee will be deducted.`);
  };

  return (
    <div className="compete-page">

      {/* Hero */}
      <div className="tourney-hero">
        <div className="th-icon">🏆</div>
        <div className="th-stats">
          <div className="ths-item"><div className="ths-val">$450</div><div className="ths-lbl">Prize Pool</div></div>
          <div className="ths-item"><div className="ths-val">4</div><div className="ths-lbl">Active</div></div>
          <div className="ths-item"><div className="ths-val">5</div><div className="ths-lbl">USDC Entry</div></div>
        </div>
        <div className="th-title">War Tournaments</div>
        <div className="th-sub">Compete against the best. Win USDC prizes.</div>
      </div>

      {/* Tournament list */}
      <div className="tourney-list">
        {TOURNAMENTS.map(t => {
          const joined = joinedTournaments.find(j => j.id === t.id);
          return (
            <div key={t.id} className="tourney-card">
              <div className="tc-icon">{t.icon}</div>
              <div className="tc-info">
                <div className="tc-name">{t.name}</div>
                <div className="tc-meta">{t.players}/{t.max} players · 5 USDC entry</div>
                <div className="tc-prize">Prize Pool: ${t.prize} USDC</div>
              </div>
              <button
                className={`tc-join ${joined ? 'joined' : t.status === 'full' ? 'full' : ''}`}
                onClick={() => join(t)}
              >
                {joined ? 'Joined ✓' : t.status === 'full' ? 'Full' : 'Join'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Points note */}
      <div style={{textAlign:'center',fontSize:'13px',color:'var(--t3)',padding:'8px'}}>
        Tournament wins earn <strong style={{color:'var(--blue)'}}>5× War Points</strong> — boost your airdrop share
      </div>

    </div>
  );
}
