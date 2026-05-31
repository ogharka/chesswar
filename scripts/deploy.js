const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Your main wallet = contract owner. Deploy wallet = just pays gas.
  const ownerAddress = ethers.getAddress(process.env.OWNER_ADDRESS || deployer.address);
  if (ownerAddress === deployer.address) {
    console.warn("⚠️  No OWNER_ADDRESS set — deployer is also the owner.");
  }

  console.log("Deploy wallet:  ", deployer.address);
  console.log("Contract owner: ", ownerAddress);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:        ", ethers.formatEther(balance), "OPN\n");

  // ── 1. MockUSDC ──────────────────────────────────────────────────────────
  console.log("Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy(deployer.address); // deployer temp owner
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC:      ", usdcAddress);

  // ── 2. CWARToken ─────────────────────────────────────────────────────────
  console.log("Deploying CWARToken...");
  const CWARToken = await ethers.getContractFactory("CWARToken");
  const cwar = await CWARToken.deploy(deployer.address);
  await cwar.waitForDeployment();
  const cwarAddress = await cwar.getAddress();
  console.log("CWARToken:     ", cwarAddress);

  // ── 3. ChessWarNFT ───────────────────────────────────────────────────────
  // Pass ownerAddress directly as feeRecipient so no setter call needed
  console.log("Deploying ChessWarNFT...");
  const ChessWarNFT = await ethers.getContractFactory("ChessWarNFT");
  const nft = await ChessWarNFT.deploy(deployer.address);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("ChessWarNFT:   ", nftAddress);

  // ── 4. ChessWarBet ───────────────────────────────────────────────────────
  // Oracle = ownerAddress, feeRecipient = ownerAddress, set via constructor
  console.log("Deploying ChessWarBet...");
  const ChessWarBet = await ethers.getContractFactory("ChessWarBet");
  const bet = await ChessWarBet.deploy(usdcAddress, ownerAddress, deployer.address);
  await bet.waitForDeployment();
  const betAddress = await bet.getAddress();
  console.log("ChessWarBet:   ", betAddress);

  // ── 5. Transfer ownership to main wallet ─────────────────────────────────
  if (ownerAddress !== deployer.address) {
    console.log("\nTransferring ownership to main wallet...");
    await (await usdc.transferOwnership(ownerAddress)).wait();
    await (await cwar.transferOwnership(ownerAddress)).wait();
    await (await nft.transferOwnership(ownerAddress)).wait();
    await (await bet.transferOwnership(ownerAddress)).wait();
    console.log("Ownership transferred.");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== ChessWar OPN Testnet Deployment ===");
  console.log("MockUSDC:     ", usdcAddress);
  console.log("CWARToken:    ", cwarAddress);
  console.log("ChessWarNFT:  ", nftAddress);
  console.log("ChessWarBet:  ", betAddress);
  console.log("Owner:        ", ownerAddress);
  console.log("=======================================\n");

  const fs = require("fs");
  fs.writeFileSync("deployed-addresses.json", JSON.stringify({
    MockUSDC:    usdcAddress,
    CWARToken:   cwarAddress,
    ChessWarNFT: nftAddress,
    ChessWarBet: betAddress,
    owner:       ownerAddress,
    network:     "opnTestnet",
    chainId:     984,
  }, null, 2));
  console.log("Addresses saved to deployed-addresses.json");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
