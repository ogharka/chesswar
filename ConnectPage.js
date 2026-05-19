import React, { useState } from 'react';
import { connectWallet } from '../../utils/wallet';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

export default function ConnectPage() {
  const { setWallet, setProvider, initProfile } = useStore();
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState('');

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { provider, signer, address } = await connectWallet();
      setProvider(provider);
      setWallet({ address, signer });
      initProfile(address);
      toast.success('Wallet connected!');
    } catch (err) {
      toast.error(err.message || 'Connection failed');
    }
    setLoading(false);
  };

  return (
    <div className="connect-page">
      <div className="connect-card">

        <div className="cc-logo">♟</div>
        <h1 className="cc-title">ChessWar</h1>
        <p className="cc-sub">Play chess. Earn USDC. Dominate the board.</p>

        <div className="cc-features">
          {[
            { icon: '⚔️', title: 'Bet Battle',    sub: 'USDC wager · winner takes all' },
            { icon: '🏆', title: 'Tournaments',   sub: '5 USDC entry · prize pool'     },
            { icon: '★',  title: 'Earn Points',   sub: '5× boost on bet games'         },
            { icon: '◈',  title: 'War NFTs',      sub: 'Up to 5× point multiplier'     },
            { icon: '♙',  title: 'vs Computer',   sub: 'Beginner to Very Hard'         },
            { icon: '🪂', title: 'CWAR Airdrop',  sub: '1B tokens · top earners win'   },
          ].map((f, i) => (
            <div key={i} className="cc-feat">
              <div className="cc-feat-icon">{f.icon}</div>
              <div className="cc-feat-info">
                <div className="cc-feat-title">{f.title}</div>
                <div className="cc-feat-sub">{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="cc-connect" onClick={handleConnect} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          {loading ? 'Connecting...' : 'Connect Wallet'}
        </button>

        <p className="cc-base">MetaMask · Coinbase Wallet · Base Network</p>

      </div>
    </div>
  );
}
