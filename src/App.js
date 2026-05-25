import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { connectWallet } from './utils/wallet';
import { loginWithWallet, getProfile, syncNFTBoost } from './utils/api';
import Navbar         from './components/layout/Navbar';
import ConnectPage    from './components/layout/ConnectPage';
import UsernameSetup  from './components/layout/UsernameSetup';
import Dashboard      from './components/layout/Dashboard';
import GamePage       from './components/game/GamePage';
import TournamentPage from './components/layout/TournamentPage';
import LeaderboardPage from './components/layout/LeaderboardPage';
import ProfilePage    from './components/layout/ProfilePage';
import './styles/global.css';

// Detect Farcaster specifically (not Base App)
function isFarcasterFrame() {
  try {
    return window.self !== window.top && !!window.ReactNativeWebView === false
      && navigator.userAgent.includes('Farcaster');
  } catch { return false; }
}

// Detect Base App (Coinbase Wallet webview)
function isBaseApp() {
  try {
    return navigator.userAgent.includes('CoinbaseWallet') ||
           navigator.userAgent.includes('Coinbase') ||
           !!window.ethereum?.isCoinbaseWallet;
  } catch { return false; }
}

async function loadUserData(address, { setPoints, setNftBoost, updateProfile }) {
  try {
    const res = await fetch(`https://ws.chesswar.xyz/user/${address}`);
    const user = await res.json();
    if (user?.username && user.username !== 'Anonymous') {
      updateProfile({ username: user.username });
      if (user.points) setPoints(user.points);
      if (user.nft_boost) setNftBoost(user.nft_boost);
    }
  } catch {}
}

export default function App() {
  const { wallet, setWallet, setProvider, initProfile, updateProfile,
          profile, setPoints, setNftBoost } = useStore();
  const [booting, setBooting] = useState(true);
  const [showUsername, setShowUsername] = useState(false);

  useEffect(() => {
    const boot = async () => {
      // Check if user manually disconnected
      const justDisconnected = (() => { try { return localStorage.getItem('cw_just_disconnected'); } catch { return null; } })();
      if (justDisconnected) {
        try { localStorage.removeItem('cw_just_disconnected'); } catch {}
        setBooting(false);
        return;
      }

      // Try Farcaster SDK first (with short timeout)
      const farcasterTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000));
      try {
        await Promise.race([
          (async () => {
            const { sdk } = await import('@farcaster/frame-sdk');
            await sdk.actions.ready();
          })(),
          farcasterTimeout
        ]);
      } catch {}

      // Try to auto-connect wallet
      try {
        const { provider, signer, address } = await connectWallet();
        setProvider(provider);
        setWallet({ address, signer });
        initProfile(address);
        await loginWithWallet(signer);
        await loadUserData(address, { setPoints, setNftBoost, updateProfile });
      } catch {
        // Can't auto-connect — show connect page
      }

      setBooting(false);
    };

    boot();
  }, []); // eslint-disable-line

  // Auto-switch to Base mainnet for regular browser
  useEffect(() => {
    if (!window.ethereum) return;
    const switchToBase = async () => {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (chainId !== '0x2105') {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }],
          });
        }
      } catch (e) {
        if (e.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{ chainId: '0x2105', chainName: 'Base',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['https://mainnet.base.org'],
                blockExplorerUrls: ['https://basescan.org'] }],
            });
          } catch {}
        }
      }
    };
    switchToBase();
    window.ethereum.on('chainChanged', switchToBase);
    return () => window.ethereum.removeListener('chainChanged', switchToBase);
  }, []);

  useEffect(() => {
    if (wallet && !profile.username && !(() => { try { return localStorage.getItem('cw_username_skipped'); } catch { return null; } })()) {
      fetch(`https://ws.chesswar.xyz/user/${wallet.address}`)
        .then(r => r.json())
        .then(user => {
          if (user?.username && user.username !== 'Anonymous') {
            updateProfile({ username: user.username });
            if (user.points) setPoints(user.points);
          } else {
            setShowUsername(true);
          }
        })
        .catch(() => setShowUsername(true));
    }
  }, [wallet, profile.username]); // eslint-disable-line

  if (booting) return (
    <div className="boot-screen">
      <div className="boot-inner">
        <img src="/logo192.png" alt="ChessWar" className="boot-logo" style={{width:80,height:80,borderRadius:18,marginBottom:16}} />
        <h1>ChessWar</h1>
        <p>Dominate. Earn. Conquer.</p>
        <div className="boot-bar"><div className="boot-fill" /></div>
      </div>
    </div>
  );

  if (!wallet) return <ConnectPage />;

  return (
    <BrowserRouter>
      <div className="app-shell">
        {showUsername && <UsernameSetup onDone={() => setShowUsername(false)} />}
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/"            element={<Dashboard />} />
            <Route path="/play/:mode"  element={<GamePage />} />
            <Route path="/tournament"  element={<TournamentPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile"     element={<ProfilePage />} />
            <Route path="*"            element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#fff', color: '#0A0B0D',
            border: '1px solid #E3E7EF',
            borderRadius: '12px', fontSize: '14px',
            fontWeight: '600',
          },
          success: { iconTheme: { primary: '#0052FF', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
