import { ethers } from 'ethers';

export const BASE_CHAIN = {
  chainId: '0x2105',
  chainName: 'Base',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const BASE_SEPOLIA = {
  chainId: '0x14a34',
  chainName: 'Base',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

// ─── Switch to BASE_CHAIN for mainnet deployment ───────────────────────────
export const TARGET = BASE_CHAIN;

// USDC contract addresses
export const USDC_ADDRESS = {
  // Base testnet
  '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  // Base Mainnet
  '0x2105':  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// ChessWar platform wallet — receives deposits, holds battle funds
// REPLACE THIS with your actual deployed contract address
export const PLATFORM_ADDRESS = process.env.REACT_APP_VAULT_ADDRESS || '0x0000000000000000000000000000000000000001';

export const USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
];

export async function connectWallet() {
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

// Get USDC balance of any address
export async function getUSDCBalance(address, provider) {
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x14a34'];
  try {
    const c = new ethers.Contract(usdcAddr, USDC_ABI, provider);
    const [bal, dec] = await Promise.all([c.balanceOf(address), c.decimals()]);
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(2);
  } catch { return '0.00'; }
}

// Get ETH balance
export async function getETHBalance(address, provider) {
  try {
    const bal = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(bal)).toFixed(4);
  } catch { return '0.0000'; }
}

const VAULT_ABI = [
  'function deposit(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function balances(address) view returns (uint256)',
];

// Deposit USDC into ChessWar Vault
export async function depositUSDC(amount, signer, provider) {
  const usdcAddr  = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x2105'];
  const vaultAddr = PLATFORM_ADDRESS;
  
  const usdc  = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, signer);
  const decimals = await usdc.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);

  // Check balance
  const address = await signer.getAddress();
  const balance = await usdc.balanceOf(address);
  if (balance < amountWei) {
    throw new Error(`Insufficient USDC. You have ${ethers.formatUnits(balance, decimals)} USDC.`);
  }

  // Step 1: Approve vault to spend USDC
  const allowance = await usdc.allowance(address, vaultAddr);
  if (allowance < amountWei) {
    const approveTx = await usdc.approve(vaultAddr, amountWei);
    await approveTx.wait();
  }

  // Step 2: Deposit into vault
  const tx = await vault.deposit(amountWei);
  const receipt = await tx.wait();
  return receipt;
}

// Withdraw USDC from ChessWar Vault
export async function withdrawUSDC(amount, toAddress, signer) {
  const vaultAddr = PLATFORM_ADDRESS;
  const vault = new ethers.Contract(vaultAddr, VAULT_ABI, signer);
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x2105'];
  const usdc = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const decimals = await usdc.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);
  const tx = await vault.withdraw(amountWei);
  const receipt = await tx.wait();
  return receipt;
}

export const shortAddr  = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
export const explorerUrl = (a) => `${TARGET.blockExplorerUrls[0]}/address/${a}`;
export const txUrl       = (hash) => `${TARGET.blockExplorerUrls[0]}/tx/${hash}`;
