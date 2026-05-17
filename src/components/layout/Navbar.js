import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { shortAddr, explorerUrl, getUSDCBalance } from '../../utils/wallet';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { wallet, provider, disconnect, points, nftBoost, profile, claimReferral } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [playOpen, setPlayOpen] = useState(false);
  const [usdcBal, setUsdcBal]   = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  useEffect(() => {
    if (!wallet?.address || !provider) return;
    getUSDCBalance(wallet.address, provider).then(setUsdcBal);
  }, [wallet?.address, provider]);

  // Claim referral for already-connected users opening a ref link
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref && wallet?.address && ref !== profile.referralCode) {
      const ok = claimReferral(ref.toUpperCase());
      if (ok) {
        window.history.replaceState({}, '', window.location.pathname);
        toast.success('🎁 War code applied: +1,000 points!');
      }
    }
  }, [wallet?.address]); // eslint-disable-line react-hooks/exhaustive-deps

  const navLinks = [
    { path: '/',            label: 'Command'     },
    { path: '/tournament',  label: 'Tournaments' },
    { path: '/leaderboard', label: 'War Board'   },
    { path: '/profile',     label: 'Barracks'    },
  ];

  const battles = [
    { mode: 'bot', label: '◈ vs AI',      sub: 'Train against the machine'  },
    { mode: 'pvp', label: 'vs Player',  sub: 'Online PvP battle'          },
    { mode: 'bet', label: 'Bet Battle',  sub: 'USDC wager · 5× points'    },
  ];

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">♟♙</span>
          <span className="brand-text">Chess<span>War</span></span>
        </Link>

        <nav className="navbar-nav">
          {navLinks.map((n) => (
            <Link key={n.path} to={n.path} className={`nav-link ${location.pathname === n.path ? 'active' : ''}`}>
              {n.label}
            </Link>
          ))}
          <div className="nav-play-wrap">
            <button className="nav-battle-btn" onClick={() => setPlayOpen((p) => !p)}>
              Battle ▾
            </button>
            {playOpen && (
              <div className="nav-play-dropdown" onMouseLeave={() => setPlayOpen(false)}>
                {battles.map((b) => (
                  <button key={b.mode} className="play-dropdown-item"
                    onClick={() => { navigate(`/play/${b.mode}`); setPlayOpen(false); }}>
                    <span className="pdi-label">{b.label}</span>
                    <span className="pdi-sub">{b.sub}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="navbar-right">
          {usdcBal !== null && (
            <div className="usdc-chip">$ <span>{usdcBal}</span></div>
          )}
          <div className="points-chip">
            <span>★</span>
            <span className="pc-val">{points.toLocaleString()}</span>
            {nftBoost > 1 && <span className="pc-boost">{nftBoost}×</span>}
          </div>
          <div className="wallet-wrap" ref={menuRef}>
            <button className="wallet-chip" onClick={() => setMenuOpen((o) => !o)}>
              <span className="wc-dot" />
              <span>{profile.username || shortAddr(wallet?.address)}</span>
              <span>{menuOpen ? '▲' : '▼'}</span>
            </button>
            {menuOpen && (
              <div className="wallet-dropdown">
                <div className="wd-addr">{wallet?.address}</div>
                <div className="wd-div" />
                <a className="wd-item" href={explorerUrl(wallet?.address)} target="_blank" rel="noreferrer">
                  View on BaseScan ↗
                </a>
                <Link className="wd-item" to="/profile" onClick={() => setMenuOpen(false)}>Barracks</Link>
                <div className="wd-div" />
                <button className="wd-item wd-out" onClick={() => { disconnect(); setMenuOpen(false); }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
