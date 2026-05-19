import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const AVATARS = ['♔', '♕', '♖', '♗', '♘', '♙'];

export default function UsernameSetup({ onDone }) {
  const { updateProfile, wallet } = useStore();
  const [username, setUsername] = useState('');
  const [avatar,   setAvatar]   = useState(0);
  const [error,    setError]    = useState('');

  const validate = (val) => {
    if (val.length < 3)  return 'Minimum 3 characters';
    if (val.length > 20) return 'Maximum 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Letters, numbers and _ only';
    return '';
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setUsername(val);
    setError(validate(val));
  };

  const handleSubmit = () => {
    const err = validate(username);
    if (err) { setError(err); return; }
    updateProfile({ username: username.trim(), avatar });
    localStorage.setItem('cw_username_skipped', '1');
    toast.success(`Welcome, ${username}!`);
    onDone();
  };

  const addr = wallet?.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : '';

  return (
    <div className="us-overlay">
      <div className="us-card">

        {/* Header */}
        <div className="us-header">
          <div className="us-chess-icon">♟</div>
          <h2>Create your profile</h2>
          <p>Your username appears on the leaderboard and in battles</p>
        </div>

        {/* Avatar */}
        <div className="us-section">
          <label className="us-label">Avatar</label>
          <div className="us-avatars">
            {AVATARS.map((a, i) => (
              <button
                key={i}
                className={`us-av ${avatar === i ? 'us-av-selected' : ''}`}
                onClick={() => setAvatar(i)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Username */}
        <div className="us-section">
          <label className="us-label">Username</label>
          <div className={`us-input-wrap ${error ? 'us-err' : username.length >= 3 ? 'us-ok' : ''}`}>
            <span className="us-av-preview">{AVATARS[avatar]}</span>
            <input
              className="us-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={handleChange}
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <span className="us-count">{username.length}/20</span>
          </div>
          {error
            ? <p className="us-error-msg">{error}</p>
            : username.length >= 3
            ? <p className="us-success-msg">Looks good</p>
            : <p className="us-hint-msg">3–20 characters, letters and numbers only</p>
          }
        </div>

        {/* Wallet */}
        <div className="us-wallet">
          <span className="us-wallet-dot" />
          <span className="us-wallet-addr">{addr}</span>
          <span className="us-wallet-net">Base Network</span>
        </div>

        {/* Actions */}
        <button
          className="us-submit"
          onClick={handleSubmit}
          disabled={username.length < 3 || !!error}
        >
          Get Started
        </button>
        <button className="us-skip" onClick={() => { localStorage.setItem('cw_username_skipped', '1'); onDone(); }}>
          Skip for now
        </button>

      </div>
    </div>
  );
}
