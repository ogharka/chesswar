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
  chainName: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://sepolia.base.org'],
  blockExplorerUrls: ['https://sepolia.basescan.org'],
};

// ─── Switch to BASE_CHAIN for mainnet deployment ───────────────────────────
export const TARGET = BASE_SEPOLIA;

// USDC contract addresses
export const USDC_ADDRESS = {
  // Base Sepolia testnet
  '0x14a34': '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  // Base Mainnet
  '0x2105':  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
};

// ChessWar platform wallet — receives deposits, holds battle funds
// REPLACE THIS with your actual deployed contract address
export const PLATFORM_ADDRESS = '0x0000000000000000000000000000000000000001';

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

// Deposit USDC: transfers from user wallet to platform contract
export async function depositUSDC(amount, signer, provider) {
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x14a34'];
  const contract = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const decimals = await contract.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);

  // Check balance first
  const address = await signer.getAddress();
  const balance = await contract.balanceOf(address);
  if (balance < amountWei) {
    throw new Error(`Insufficient USDC balance. You have ${ethers.formatUnits(balance, decimals)} USDC.`);
  }

  // Transfer USDC to platform wallet
  const tx = await contract.transfer(PLATFORM_ADDRESS, amountWei);
  const receipt = await tx.wait();
  return receipt;
}

// Withdraw USDC: in production this calls your smart contract
// For now: shows the user their withdrawal address and amount
// Real implementation: backend verifies balance then calls contract.withdraw()
export async function withdrawUSDC(amount, toAddress, signer) {
  // Validate address
  if (!ethers.isAddress(toAddress)) throw new Error('Invalid withdrawal address');

  // In production: call your ChessWarVault.withdraw(amount, toAddress)
  // For MVP: transfer directly (requires platform to have approved this)
  const usdcAddr = USDC_ADDRESS[TARGET.chainId] || USDC_ADDRESS['0x14a34'];
  const contract = new ethers.Contract(usdcAddr, USDC_ABI, signer);
  const decimals = await contract.decimals();
  const amountWei = ethers.parseUnits(amount.toString(), decimals);
  const tx = await contract.transfer(toAddress, amountWei);
  const receipt = await tx.wait();
  return receipt;
}

export const shortAddr  = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
export const explorerUrl = (a) => `${TARGET.blockExplorerUrls[0]}/address/${a}`;
export const txUrl       = (hash) => `${TARGET.blockExplorerUrls[0]}/tx/${hash}`;
