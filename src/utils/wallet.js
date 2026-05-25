import { ethers } from 'ethers';

export const BASE_CHAIN = {
  chainId: '0x2105',
  chainName: 'Base',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const TARGET = BASE_CHAIN;

export const USDC_ADDRESS = {
  '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  '0x2105':  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

export const PLATFORM_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS || '0x0000000000000000000000000000000000000001';

const BUILDER_CODE = "0x07626173656170700080218021802180218021802180218021";

export const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
];

// True only inside Farcaster frame
export function isFarcaster() {
  try {
    return window.self !== window.top;
  } catch { return false; }
}

// True inside Coinbase/Base App
export function isBaseApp() {
  try {
    return !!(window.ethereum?.isCoinbaseWallet) ||
           navigator.userAgent.includes('CoinbaseWallet');
  } catch { return false; }
}

export async function connectWallet() {
  // ── Base App (Coinbase Wallet) ─────────────────────────────────────────
  if (isBaseApp()) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    try {
      await provider.send('wallet_switchEthereumChain', [{ chainId: TARGET.chainId }]);
    } catch (e) {
      if (e.code === 4902) {
        await provider.send('wallet_addEthereumChain', [TARGET]);
      }
    }
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    return { provider, signer, address };
  }

  // ── Farcaster Mini App ─────────────────────────────────────────────────
  if (isFarcaster()) {
    try {
      const { sdk } = await import('@farcaster/frame-sdk');
      await sdk.actions.ready();
      const ethProvider = sdk.wallet.ethProvider;
      if (!ethProvider) throw new Error('Farcaster wallet not available');
      const provider = new ethers.BrowserProvider(ethProvider);
      await provider.send('eth_requestAccounts', []);
      try {
        await provider.send('wallet_switchEthereumChain', [{ chainId: TARGET.chainId }]);
      } catch (e) {
        if (e.code === 4902) {
          await provider.send('wallet_addEthereumChain', [TARGET]);
        }
      }
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      return { provider, signer, address };
    } catch (e) {
      throw new Error('Farcaster wallet connection failed: ' + e.message);
    }
  }

  // ── Regular browser (MetaMask / Coinbase Extension) ────────────────────
  if (!window.ethereum) throw new Error('No wallet found. Please install MetaMask.');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: TARGET.chainId }],
    });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [TARGET] });
    } else throw e;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer   = await provider.getSigner();
  const address  = await signer.getAddress();
  return { provider, signer, address };
}

export async function getUSDCBalance(address, provider) {
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x14a34'];
  try {
    const c = new ethers.Contract(usdcAddr, USDC_ABI, provider);
    const [bal, dec] = await Promise.all([c.balanceOf(address), c.decimals()]);
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(2);
  } catch { return '0.00'; }
}

export async function getETHBalance(address, provider) {
  try {
    const bal = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(bal)).toFixed(4);
  } catch { return '0.0000'; }
}

const VAULT_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount, address to) external',
  'function balances(address) view returns (uint256)',
];

export async function depositUSDC(amount, signer, provider) {
  const usdcAddr  = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x2105'];
  const vaultAddr = PLATFORM_ADDRESS;
  const usdc  = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, signer);
  const decimals = await usdc.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);
  const address = await signer.getAddress();
  const balance = await usdc.balanceOf(address);
  if (balance < amountWei) {
    throw new Error(`Insufficient USDC. You have ${ethers.formatUnits(balance, decimals)} USDC.`);
  }
  const allowance = await usdc.allowance(address, vaultAddr);
  if (allowance < amountWei) {
    const approveTx = await usdc.approve(vaultAddr, amountWei, { data: BUILDER_CODE });
    await approveTx.wait();
  }
  const tx = await vault.deposit(amountWei, { data: BUILDER_CODE });
  const receipt = await tx.wait();
  return receipt;
}

export async function withdrawUSDC(amount, toAddress, signer) {
  const vaultAddr = PLATFORM_ADDRESS;
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, signer);
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x2105'];
  const usdc = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const decimals = await usdc.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);
  const address = await signer.getAddress();
  const tx = await vault.withdraw(amountWei, address, { data: BUILDER_CODE });
  const receipt = await tx.wait();
  return receipt;
}

export const shortAddr   = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
export const explorerUrl = (a) => `${TARGET.blockExplorerUrls[0]}/address/${a}`;
export const txUrl       = (hash) => `${TARGET.blockExplorerUrls[0]}/tx/${hash}`;
