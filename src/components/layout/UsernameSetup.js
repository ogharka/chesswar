import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import toast from 'react-hot-toast';

const AVATARS = ['♟', '🗡️', '🛡️', '👑', '🏹', '🪖'];

export default function UsernameSetup({ onDone }) {
  const { updateProfile, wallet } = useStore();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar]     = useState(0);
  const [error, setError]       = useState('');

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
    toast.success(`Welcome to ChessWar, ${username}!`);
    onDone();
  };

  return (
    <div className="username-setup-overlay">
      <div className="username-setup-card">

        <div className="us-header">
          <div className="us-logo">♟♙</div>
          <h2>Set Your Callsign</h2>
          <p>Choose a name that will appear on the leaderboard and in battles</p>
        </div>

        {/* Avatar picker */}
        <div className="us-section">
          <label className="us-label">Choose Avatar</label>
          <div className="us-avatar-grid">
            {AVATARS.map((a, i) => (
              <button
                key={i}
                className={`us-avatar-btn ${avatar === i ? 'selected' : ''}`}
                onClick={() => setAvatar(i)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Username input */}
        <div className="us-section">
          <label className="us-label">Username</label>
          <div className="us-input-wrap">
            <span className="us-preview-av">{AVATARS[avatar]}</span>
            <input
              className={`us-input ${error ? 'us-input-err' : username.length >= 3 ? 'us-input-ok' : ''}`}
              type="text"
              placeholder="Enter your callsign..."
              value={username}
              onChange={handleChange}
              maxLength={20}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <span className="us-char-count">{username.length}/20</span>
          </div>
          {error && <p className="us-error">{error}</p>}
          {!error && username.length >= 3 && (
            <p className="us-ok">Callsign available</p>
          )}
        </div>

        {/* Wallet info */}
        <div className="us-wallet-info">
          <span className="us-wallet-dot" />
          <span>{wallet?.address?.slice(0, 8)}...{wallet?.address?.slice(-6)}</span>
          <span className="us-wallet-label">Base Network</span>
        </div>

        <button
          className="us-submit-btn"
          onClick={handleSubmit}
          disabled={username.length < 3 || !!error}
        >
          Enter the Battlefield
        </button>

        <button className="us-skip-btn" onClick={onDone}>
          Skip for now
        </button>

      </div>
    </div>
  );
}
