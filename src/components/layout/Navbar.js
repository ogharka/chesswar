import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import WalletModal from './WalletModal';

// SVG Tab Icons
const PlayIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <rect x="2" y="2" width="9" height="9" rx="2"/>
    <rect x="13" y="2" width="9" height="9" rx="2"/>
    <rect x="2" y="13" width="9" height="9" rx="2"/>
    <rect x="13" y="13" width="9" height="9" rx="2"/>
  </svg>
);
const CompeteIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <path d="M8 21h8M12 21v-4"/>
    <path d="M7 4H4v6a8 8 0 0 0 16 0V4h-3"/>
    <path d="M7 4h10"/>
  </svg>
);
const RanksIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
  </svg>
);
const MoreIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2}>
    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
  </svg>
);

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { points, nftBoost, profile } = useStore();
  const [showWallet, setShowWallet] = useState(false);

  const path = location.pathname;

  const tabs = [
    { path: '/',            label: 'Play',    Icon: PlayIcon    },
    { path: '/tournament',  label: 'Compete', Icon: CompeteIcon },
    { path: '/leaderboard', label: 'Ranks',   Icon: RanksIcon   },
    { path: '/profile',     label: 'More',    Icon: MoreIcon    },
  ];

  const initial = profile.username
    ? profile.username[0].toUpperCase()
    : '?';

  return (
    <>
      {/* Top bar */}
      <div className="top-bar">
        <div className="tb-brand">
          <div className="tb-logo">♟</div>
          <span className="tb-name">ChessWar</span>
        </div>
        <div className="tb-right">
          <button className="tb-chip tb-pts" onClick={() => navigate('/profile')}>
            <span>★</span>
            <span>{points.toLocaleString()}</span>
            <span className="tb-boost">{nftBoost}×</span>
          </button>
          <button className="tb-chip tb-wallet" onClick={() => setShowWallet(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="2" y="5" width="20" height="14" rx="2"/>
              <path d="M16 12h2"/>
            </svg>
            <span>Wallet</span>
          </button>
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="bottom-tabs">
        {tabs.map((t) => (
          <button
            key={t.path}
            className={`tab-btn ${path === t.path ? 'active' : ''}`}
            onClick={() => navigate(t.path)}
          >
            <t.Icon active={path === t.path} />
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
    </>
  );
}
