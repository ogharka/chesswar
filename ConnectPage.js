import React, { useState } from 'react';
import { connectWallet } from '../../utils/wallet';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

export default function ConnectPage() {
  const { setWallet, setProvider, initProfile } = useStore();
  const [loading, setLoading] = useState(false);

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
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'linear-gradient(160deg, #EBF0FF 0%, #F5F7FA 60%, #fff 100%)',
      padding:'20px'
    }}>
      <div style={{
        background:'#fff', borderRadius:24, width:'100%', maxWidth:400,
        padding:'40px 32px', boxShadow:'0 20px 60px rgba(0,82,255,0.12)',
        textAlign:'center'
      }}>
        {/* Logo */}
        <div style={{
          width:72, height:72, background:'var(--blue)', borderRadius:20,
          display:'flex', alignItems:'center', justifyContent:'center',
          margin:'0 auto 20px', fontSize:36, boxShadow:'0 8px 24px rgba(0,82,255,0.3)'
        }}>♟</div>

        <h1 style={{fontSize:28, fontWeight:800, color:'#0A0B0D', letterSpacing:-0.5, marginBottom:8}}>
          ChessWar
        </h1>
        <p style={{fontSize:15, color:'#9EA6B3', marginBottom:32, lineHeight:1.5}}>
          Play chess. Earn USDC.<br/>Dominate the board.
        </p>

        {/* Features */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:32, textAlign:'left'}}>
          {[
            { icon:'⚔️', title:'Bet Battle',   sub:'Win USDC'          },
            { icon:'🏆', title:'Tournaments',  sub:'5 USDC entry'       },
            { icon:'◈',  title:'War NFTs',     sub:'5× point boost'     },
            { icon:'🪂', title:'CWAR Airdrop', sub:'1B tokens'          },
          ].map((f,i) => (
            <div key={i} style={{
              background:'#F5F7FA', borderRadius:12, padding:'12px 14px',
              display:'flex', alignItems:'center', gap:10
            }}>
              <span style={{fontSize:22, flexShrink:0}}>{f.icon}</span>
              <div>
                <div style={{fontSize:13, fontWeight:700, color:'#0A0B0D'}}>{f.title}</div>
                <div style={{fontSize:11, color:'#9EA6B3', marginTop:1}}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            width:'100%', padding:'17px', background: loading ? '#CCd9FF' : '#0052FF',
            color:'#fff', borderRadius:14, fontSize:16, fontWeight:800,
            boxShadow:'0 4px 20px rgba(0,82,255,0.35)', transition:'all .2s',
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"
                style={{animation:'spin 1s linear infinite'}}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Connecting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Connect Wallet
            </>
          )}
        </button>

        <p style={{fontSize:12, color:'#C8CDD8', marginTop:16}}>
          MetaMask · Coinbase Wallet · Base Network
        </p>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
