const API_URL = process.env.REACT_APP_API_URL || 'https://chesswar-api.railway.app';

// ── Auth token management ─────────────────────────────────────────────────────
function getToken()          { return localStorage.getItem('cw_token'); }
function setToken(t)         { localStorage.setItem('cw_token', t); }
function clearToken()        { localStorage.removeItem('cw_token'); }

function headers() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function api(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

// ── Login with wallet signature ───────────────────────────────────────────────
export async function loginWithWallet(signer) {
  const address = await signer.getAddress();
  const message = `ChessWar login\nAddress: ${address}\nTimestamp: ${Date.now()}`;
  const signature = await signer.signMessage(message);
  const { token, user } = await api('POST', '/api/users/auth', { address, signature, message });
  setToken(token);
  return user;
}

export function logout() { clearToken(); }

// ── User profile ──────────────────────────────────────────────────────────────
export const getProfile      = (addr)    => api('GET',  `/api/users/${addr}`);
export const updateProfile   = (data)    => api('PUT',  '/api/users/profile', data);
export const getLeaderboard  = ()        => api('GET',  '/api/users/leaderboard/top');
export const claimReferral   = (code)    => api('POST', '/api/users/referral/claim', { referralCode: code });

// ── Points ────────────────────────────────────────────────────────────────────
export const addPoints       = (data)    => api('POST', '/api/points/add', data);
export const getPointsHistory= ()        => api('GET',  '/api/points/history');
export const updateNFTBoost  = (boost)   => api('POST', '/api/points/nft-boost', { boost });

// ── Games ─────────────────────────────────────────────────────────────────────
export const getGameHistory  = ()        => api('GET',  '/api/games/history');
export const getGame         = (id)      => api('GET',  `/api/games/${id}`);

// ── NFT ───────────────────────────────────────────────────────────────────────
export const syncNFTBoost    = ()        => api('POST', '/api/nft/sync');
export const getNFTInfo      = (addr)    => api('GET',  `/api/nft/${addr}`);

// ── Airdrop ───────────────────────────────────────────────────────────────────
export const getAirdropProof = (addr)    => api('GET',  `/api/airdrop/proof/${addr}`);
export const markAirdropClaimed = ()     => api('POST', '/api/airdrop/claimed');
export const getAirdropStats = ()        => api('GET',  '/api/airdrop/stats');
