import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { connectWallet } from '../../utils/wallet';
import toast from 'react-hot-toast';

export default function ConnectPage() {
  const { setWallet, setProvider, initProfile, claimReferral } = useStore();
  const [loading, setLoading] = useState(false);
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref');
    if (r) setRefCode(r.toUpperCase());
  }, []);

  const connect = async () => {
    setLoading(true);
    try {
      const { provider, signer, address } = await connectWallet();
      setProvider(provider);
      setWallet({ address, signer });
      initProfile(address);
      if (refCode) {
        const ok = claimReferral(refCode);
        if (ok) toast.success('🎁 Referral bonus: +1,000 war points!');
      }
      toast.success('Welcome to ChessWar!');
    } catch (err) {
      toast.error(err.message || 'Connection failed');
    }
    setLoading(false);
  };

  const features = [
    { icon: '♜', title: 'Bet Battle',      sub: 'USDC wager · winner takes all' },
    { icon: '♛', title: 'Tournament',      sub: '5 USDC entry · prize pool'     },
    { icon: '★', title: 'Earn Points',     sub: '5× boost on every bet'         },
    { icon: '♝', title: 'War NFTs',        sub: 'Up to 5× point multiplier'     },
    { icon: '♞', title: 'Referrals',       sub: '+1,000 points per recruit'     },
    { icon: '♟', title: 'CWAR Airdrop',    sub: '1B tokens · top earners win'   },
  ];

  return (
    <div className="connect-page">
      <div className="connect-bg">
        {[...Array(64)].map((_, i) => (
          <div key={i} className={`bg-sq ${(Math.floor(i / 8) + i) % 2 === 0 ? 'sq-l' : 'sq-d'}`} />
        ))}
        <div className="connect-overlay" />
      </div>

      <div className="connect-card">
        <div className="connect-logo">
          <div className="connect-icon">♟♙</div>
          <h1>Chess<span>War</span></h1>
          <p>Dominate the board. Claim your rewards.</p>
        </div>

        {refCode ? (
          <div className="ref-applied">
            🎁 War code <strong>{refCode}</strong> applied — connect to claim 1,000 points!
          </div>
        ) : (
          <div className="ref-input-wrap">
            <input
              placeholder="War code (referral — optional)"
              value={refCode}
              onChange={(e) => setRefCode(e.target.value.toUpperCase())}
              className="ref-input"
              maxLength={12}
            />
          </div>
        )}

        <button className="connect-btn" onClick={connect} disabled={loading}>
          {loading ? 'Connecting…' : 'Enter ChessWar'}
        </button>
        <p className="connect-hint">MetaMask · Coinbase Wallet · Any EVM wallet · Base Network</p>

        <div className="feature-grid">
          {features.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="fc-icon">{f.icon}</span>
              <strong>{f.title}</strong>
              <span>{f.sub}</span>
            </div>
          ))}
        </div>

        <div className="connect-footer">
          <span>Built on</span><strong>Base Network</strong>
          <span>·</span><span>USDC on-chain</span>
        </div>
      </div>
    </div>
  );
}
