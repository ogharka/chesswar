import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { getUSDCBalance, getETHBalance, depositUSDC, withdrawUSDC, shortAddr, txUrl } from '../../utils/wallet';
import toast from 'react-hot-toast';

const QUICK_AMOUNTS = [5, 10, 25, 50, 100];
const TABS = ['deposit', 'withdraw', 'history'];

export default function WalletModal({ onClose }) {
  const { wallet, provider } = useStore();

  const [tab,          setTab]         = useState('deposit');
  const [usdcBal,      setUsdcBal]     = useState(null);
  const [ethBal,       setEthBal]      = useState(null);
  const [platformBal,  setPlatformBal] = useState('0.00'); // in-app balance
  const [amount,       setAmount]      = useState('');
  const [withdrawAddr, setWithdrawAddr] = useState('');
  const [loading,      setLoading]     = useState(false);
  const [txHistory,    setTxHistory]   = useState(
    JSON.parse(localStorage.getItem('cw_txs') || '[]')
  );

  useEffect(() => {
    if (!wallet?.address || !provider) return;
    loadBalances();
  }, [wallet?.address, provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadBalances = async () => {
    const [usdc, eth] = await Promise.all([
      getUSDCBalance(wallet.address, provider),
      getETHBalance(wallet.address, provider),
    ]);
    setUsdcBal(usdc);
    setEthBal(eth);
    // Load in-app balance from localStorage (replace with backend in production)
    const stored = localStorage.getItem(`cw_balance_${wallet.address}`) || '0.00';
    setPlatformBal(stored);
  };

  const updatePlatformBal = (newBal) => {
    const rounded = parseFloat(newBal).toFixed(2);
    setPlatformBal(rounded);
    localStorage.setItem(`cw_balance_${wallet.address}`, rounded);
  };

  const addTx = (tx) => {
    const updated = [tx, ...txHistory].slice(0, 20);
    setTxHistory(updated);
    localStorage.setItem('cw_txs', JSON.stringify(updated));
  };

  const handleDeposit = async () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n < 0.1) { toast.error('Minimum deposit is 0.10 USDC'); return; }
    if (parseFloat(usdcBal) < n) { toast.error(`Insufficient balance. You have ${usdcBal} USDC`); return; }

    setLoading(true);
    try {
      const receipt = await depositUSDC(n, wallet.signer, provider);
      const newBal = (parseFloat(platformBal) + n).toFixed(2);
      updatePlatformBal(newBal);
      addTx({
        type: 'deposit',
        amount: n,
        hash: receipt.hash,
        date: new Date().toISOString(),
        status: 'confirmed',
      });
      await loadBalances();
      setAmount('');
      toast.success(`Deposited ${n} USDC successfully!`);
    } catch (err) {
      toast.error(err.message || 'Deposit failed');
    }
    setLoading(false);
  };

  const handleWithdraw = async () => {
    const n = parseFloat(amount);
    if (isNaN(n) || n < 0.1) { toast.error('Minimum withdrawal is 0.10 USDC'); return; }
    if (n > parseFloat(platformBal)) { toast.error(`Insufficient in-app balance. You have ${platformBal} USDC`); return; }
    if (!withdrawAddr || withdrawAddr.trim() === '') {
      setWithdrawAddr(wallet.address);
    }
    const toAddr = withdrawAddr.trim() || wallet.address;

    setLoading(true);
    try {
      const receipt = await withdrawUSDC(n, toAddr, wallet.signer);
      const newBal = (parseFloat(platformBal) - n).toFixed(2);
      updatePlatformBal(newBal);
      addTx({
        type: 'withdraw',
        amount: n,
        to: toAddr,
        hash: receipt.hash,
        date: new Date().toISOString(),
        status: 'confirmed',
      });
      await loadBalances();
      setAmount('');
      setWithdrawAddr('');
      toast.success(`Withdrawn ${n} USDC to ${shortAddr(toAddr)}`);
    } catch (err) {
      toast.error(err.message || 'Withdrawal failed');
    }
    setLoading(false);
  };

  const maxDeposit  = () => setAmount(usdcBal || '0');
  const maxWithdraw = () => setAmount(platformBal || '0');

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wallet-modal">

        {/* Header */}
        <div className="wm-header">
          <div className="wm-title">
            <span className="wm-icon">♜</span>
            <h2>Wallet</h2>
          </div>
          <button className="wm-close" onClick={onClose}>✕</button>
        </div>

        {/* Balance cards */}
        <div className="wm-balances">
          <div className="wm-bal-card wm-bal-wallet">
            <span className="wm-bal-label">Wallet USDC</span>
            <span className="wm-bal-val">
              {usdcBal === null ? '—' : `${usdcBal}`}
              <span className="wm-bal-unit">USDC</span>
            </span>
            <span className="wm-bal-sub">ETH: {ethBal === null ? '—' : ethBal}</span>
          </div>
          <div className="wm-bal-arrow">→</div>
          <div className="wm-bal-card wm-bal-app">
            <span className="wm-bal-label">In-App Balance</span>
            <span className="wm-bal-val">
              {platformBal}
              <span className="wm-bal-unit">USDC</span>
            </span>
            <span className="wm-bal-sub">Available for battles</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="wm-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`wm-tab ${tab === t ? 'active' : ''}`}
              onClick={() => setTab(t)}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Deposit tab */}
        {tab === 'deposit' && (
          <div className="wm-body">
            <p className="wm-desc">
              Transfer USDC from your wallet into ChessWar to use for battles and tournaments.
            </p>

            <div className="wm-quick-amounts">
              {QUICK_AMOUNTS.map((a) => (
                <button
                  key={a}
                  className={`wm-quick-btn ${parseFloat(amount) === a ? 'active' : ''}`}
                  onClick={() => setAmount(a.toString())}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="wm-input-group">
              <label>Amount</label>
              <div className="wm-input-row">
                <input
                  type="number"
                  className="wm-input"
                  placeholder="0.00"
                  value={amount}
                  min="0.1"
                  step="0.01"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="wm-input-unit">USDC</span>
                <button className="wm-max-btn" onClick={maxDeposit}>MAX</button>
              </div>
              <p className="wm-available">Available: {usdcBal === null ? 'Loading…' : `${usdcBal} USDC`}</p>
            </div>

            <div className="wm-info-box">
              <div className="wm-info-row"><span>Network</span><strong>Base {process.env.NODE_ENV === 'production' ? 'Mainnet' : 'Sepolia'}</strong></div>
              <div className="wm-info-row"><span>Gas fee</span><strong>~0.0001 ETH</strong></div>
              <div className="wm-info-row"><span>You receive</span><strong className="wm-green">{parseFloat(amount) || 0} USDC in-app</strong></div>
            </div>

            <button
              className="wm-action-btn"
              onClick={handleDeposit}
              disabled={loading || !amount || parseFloat(amount) < 0.1}
            >
              {loading ? 'Processing…' : `Deposit ${parseFloat(amount) || 0} USDC`}
            </button>
          </div>
        )}

        {/* Withdraw tab */}
        {tab === 'withdraw' && (
          <div className="wm-body">
            <p className="wm-desc">
              Withdraw your in-app USDC back to any Base wallet address.
            </p>

            <div className="wm-quick-amounts">
              {QUICK_AMOUNTS.filter((a) => a <= parseFloat(platformBal || 0)).map((a) => (
                <button
                  key={a}
                  className={`wm-quick-btn ${parseFloat(amount) === a ? 'active' : ''}`}
                  onClick={() => setAmount(a.toString())}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="wm-input-group">
              <label>Amount</label>
              <div className="wm-input-row">
                <input
                  type="number"
                  className="wm-input"
                  placeholder="0.00"
                  value={amount}
                  min="0.1"
                  step="0.01"
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="wm-input-unit">USDC</span>
                <button className="wm-max-btn" onClick={maxWithdraw}>MAX</button>
              </div>
              <p className="wm-available">In-app balance: {platformBal} USDC</p>
            </div>

            <div className="wm-input-group">
              <label>Withdraw to address</label>
              <input
                type="text"
                className="wm-input wm-addr-input"
                placeholder={wallet?.address}
                value={withdrawAddr}
                onChange={(e) => setWithdrawAddr(e.target.value)}
              />
              <p className="wm-available">Leave blank to use your connected wallet</p>
            </div>

            <div className="wm-info-box">
              <div className="wm-info-row"><span>Network</span><strong>Base</strong></div>
              <div className="wm-info-row"><span>You receive</span><strong className="wm-green">{parseFloat(amount) || 0} USDC</strong></div>
              <div className="wm-info-row"><span>To address</span><strong>{shortAddr(withdrawAddr || wallet?.address)}</strong></div>
            </div>

            <button
              className="wm-action-btn wm-withdraw-btn"
              onClick={handleWithdraw}
              disabled={loading || !amount || parseFloat(amount) < 0.1 || parseFloat(amount) > parseFloat(platformBal)}
            >
              {loading ? 'Processing…' : `Withdraw ${parseFloat(amount) || 0} USDC`}
            </button>
          </div>
        )}

        {/* History tab */}
        {tab === 'history' && (
          <div className="wm-body">
            {txHistory.length === 0 ? (
              <p className="wm-empty">No transactions yet</p>
            ) : (
              <div className="wm-tx-list">
                {txHistory.map((tx, i) => (
                  <div key={i} className={`wm-tx-row ${tx.type}`}>
                    <div className="wm-tx-left">
                      <span className="wm-tx-type">{tx.type === 'deposit' ? '↓ Deposit' : '↑ Withdraw'}</span>
                      <span className="wm-tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                    </div>
                    <div className="wm-tx-right">
                      <span className={`wm-tx-amount ${tx.type}`}>
                        {tx.type === 'deposit' ? '+' : '-'}{tx.amount} USDC
                      </span>
                      {tx.hash && (
                        <a
                          href={txUrl(tx.hash)}
                          target="_blank"
                          rel="noreferrer"
                          className="wm-tx-link"
                        >
                          View ↗
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
