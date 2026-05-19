import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useStore } from './store/useStore';
import { connectWallet } from './utils/wallet';
import { loginWithWallet, getProfile, syncNFTBoost } from './utils/api';
import Navbar from './components/layout/Navbar';
import ConnectPage from './components/layout/ConnectPage';
import UsernameSetup from './components/layout/UsernameSetup';
import Dashboard from './components/layout/Dashboard';
import GamePage from './components/game/GamePage';
import TournamentPage from './components/layout/TournamentPage';
import LeaderboardPage from './components/layout/LeaderboardPage';
import ProfilePage from './components/layout/ProfilePage';
import './styles/global.css';

export default function App() {
  const { wallet, setWallet, setProvider, initProfile, updateProfile, profile, setPoints, setNftBoost } = useStore();
  const [booting, setBooting] = useState(true);
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);

  useEffect(() => {
    const tryReconnect = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const { provider, signer, address } = await connectWallet();
            setProvider(provider);
            setWallet({ address, signer });
            initProfile(address);

            // Login to backend and sync data
            try {
              await loginWithWallet(signer);
              const user = await getProfile(address);
              if (user) {
                updateProfile({
                  username:      user.username || '',
                  referralCode:  user.referralCode,
                  gamesPlayed:   user.gamesPlayed,
                  gamesWon:      user.gamesWon,
                  gamesLost:     user.gamesLost,
                  gamesDraw:     user.gamesDraw,
                  referralCount: 0,
                });
                if (setPoints)   setPoints(user.points);
                if (setNftBoost) setNftBoost(user.nftBoost);
              }
              // Sync NFT boost from blockchain
              await syncNFTBoost().catch(() => {});
            } catch { /* backend offline — use local state */ }
          }
        } catch { /* silent */ }
      }
      setBooting(false);
    };
    tryReconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (wallet && !profile.username) {
      setShowUsernameSetup(true);
    }
  }, [wallet, profile.username]);

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="boot-inner">
          <div className="boot-logo">♟♙</div>
          <h1>ChessWar</h1>
          <p>Dominate. Earn. Conquer.</p>
          <div className="boot-bar"><div className="boot-fill" /></div>
        </div>
      </div>
    );
  }

  if (!wallet) return <ConnectPage />;

  if (showUsernameSetup) {
    return <UsernameSetup onDone={() => setShowUsernameSetup(false)} />;
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Navbar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/play/:mode" element={<GamePage />} />
            <Route path="/tournament" element={<TournamentPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#fff',
            color: '#0A0B0D',
            border: '1px solid #E3E7EF',
            borderRadius: '8px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#0052FF', secondary: '#fff' } },
        }}
      />
    </BrowserRouter>
  );
}
