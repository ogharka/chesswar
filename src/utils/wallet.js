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

// Switch to BASE_CHAIN for mainnet
export const TARGET = BASE_SEPOLIA;

export async function connectWallet() {
  if (!window.ethereum) throw new Error('No wallet found. Please install MetaMask.');
  await window.ethereum.request({ method: 'eth_requestAccounts' });
  try {
    await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: TARGET.chainId }] });
  } catch (e) {
    if (e.code === 4902) {
      await window.ethereum.request({ method: 'wallet_addEthereumChain', params: [TARGET] });
    } else throw e;
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  return { provider, signer, address };
}

export async function getUSDCBalance(address, provider) {
  const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  const ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];
  try {
    const c = new ethers.Contract(USDC, ABI, provider);
    const [bal, dec] = await Promise.all([c.balanceOf(address), c.decimals()]);
    return parseFloat(ethers.formatUnits(bal, dec)).toFixed(2);
  } catch { return '0.00'; }
}

export const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : '';
export const explorerUrl = (a) => `${TARGET.blockExplorerUrls[0]}/address/${a}`;
