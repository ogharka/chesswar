import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { connectWallet, isFarcaster } from './utils/wallet';
import { loginWithWallet, getProfile, syncNFTBoost } from './utils/api';
import Navbar        from './components/layout/Navbar';
import ConnectPage   from './components/layout/ConnectPage';
import UsernameSetup from './components/layout/UsernameSetup';
import Dashboard     from './components/layout/Dashboard';
import GamePage      from './components/game/GamePage';
import TournamentPage from './components/layout/TournamentPage';
import LeaderboardPage from './components/layout/LeaderboardPage';
import ProfilePage from './components/layout/ProfilePage';
import './styles/global.css';

export default function App() {
  const { wallet, setWallet, setProvider, initProfile, updateProfile,
          profile, setPoints, setNftBoost } = useStore();
  const [booting, setBooting] = useState(true);
  const [showUsername, setShowUsername] = useState(false);

  // Initialize Farcaster SDK and auto-connect if inside Farcaster
  useEffect(() => {
    const init = async () => {
      try {
        const { sdk } = await import('@farcaster/frame-sdk');
        await sdk.actions.ready();

        // Auto-connect wallet if inside Farcaster
        if (isFarcaster()) {
          try {
            const { provider, signer, address } = await connectWallet();
            setProvider(provider);
            setWallet({ address, signer });
            initProfile(address);
            try {
              await loginWithWallet(signer);
              const user = await getProfile(address);
              if (user) {
                updateProfile({
                  username:    user.username || '',
                  referralCode: user.referralCode,
                  gamesPlayed: user.gamesPlayed,
                  gamesWon:    user.gamesWon,
                  gamesLost:   user.gamesLost,
                  gamesDraw:   user.gamesDraw,
                });
                if (setPoints)   setPoints(user.points);
                if (setNftBoost) setNftBoost(user.nftBoost);
              }
              await syncNFTBoost().catch(() => {});
            } catch { /* backend offline */ }
            // Fetch from ws server
            try {
              const res = await fetch(`https://ws.chesswar.xyz/user/${address}`);
              const user = await res.json();
              if (user?.username && user.username !== 'Anonymous') {
                updateProfile({ username: user.username });
                if (user.points) setPoints(user.points);
              }
            } catch {}
          } catch { /* wallet not ready yet, user will click connect */ }
        }
      } catch {}
      setBooting(false);
    };
    init();
  }, []); // eslint-disable-line

  // Auto-switch to Base mainnet for regular browser
  useEffect(() => {
    if (!window.ethereum || isFarcaster()) return;
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
              params: [{ chainId: '0x2105', chainName: 'Base', nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, rpcUrls: ['https://mainnet.base.org'], blockExplorerUrls: ['https://basescan.org'] }],
            });
          } catch {}
        }
      }
    };
    switchToBase();
    window.ethereum.on('chainChanged', switchToBase);
    return () => window.ethereum.removeListener('chainChanged', switchToBase);
  }, []);

  // Auto-reconnect for regular browser
  useEffect(() => {
    if (isFarcaster()) return;
    const tryReconnect = async () => {
      if (localStorage.getItem("cw_just_disconnected")) {
        localStorage.removeItem("cw_just_disconnected");
        setBooting(false);
        return;
      }
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const { ethers } = await import('ethers');
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setProvider(provider);
            setWallet({ address, signer });
            initProfile(address);
            try {
              await loginWithWallet(signer);
              const user = await getProfile(address);
              if (user) {
                updateProfile({
                  username:    user.username || '',
                  referralCode: user.referralCode,
                  gamesPlayed: user.gamesPlayed,
                  gamesWon:    user.gamesWon,
                  gamesLost:   user.gamesLost,
                  gamesDraw:   user.gamesDraw,
                });
                if (setPoints)   setPoints(user.points);
                if (setNftBoost) setNftBoost(user.nftBoost);
              }
              await syncNFTBoost().catch(() => {});
            } catch {}
            try {
              const res = await fetch(`https://ws.chesswar.xyz/user/${address}`);
              const user = await res.json();
              if (user?.username && user.username !== 'Anonymous') {
                updateProfile({ username: user.username });
                if (user.points) setPoints(user.points);
              }
            } catch {}
          }
        } catch {}
      }
      setBooting(false);
    };
    tryReconnect();
  }, []); // eslint-disable-line

  useEffect(() => {
    if (wallet && !profile.username && !localStorage.getItem("cw_username_skipped")) {
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
        <div className="boot-logo">♟</div>
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
            <Route path="/"             element={<Dashboard />} />
            <Route path="/play/:mode"   element={<GamePage />} />
            <Route path="/tournament"   element={<TournamentPage />} />
            <Route path="/leaderboard"  element={<LeaderboardPage />} />
            <Route path="/profile"      element={<ProfilePage />} />
            <Route path="*"             element={<Navigate to="/" replace />} />
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
