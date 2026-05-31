// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title CWARToken
 * @notice ChessWar governance and reward token.
 *
 * Tokenomics (1,000,000,000 CWAR total):
 *   400,000,000 — Airdrop (merkle claim)
 *   250,000,000 — Liquidity
 *   200,000,000 — Team (sent to owner, 2-year vesting handled off-chain or via separate contract)
 *   100,000,000 — Ecosystem / grants
 *    50,000,000 — Tournament prize reserve
 *
 * Transfer lock: tokens cannot be transferred until owner calls unlockTransfers().
 * Exceptions: owner and whitelisted addresses (e.g. DEX, staking) can always transfer.
 */
contract CWARToken is ERC20, Ownable {

    uint256 public constant TOTAL_SUPPLY       = 1_000_000_000 ether;
    uint256 public constant AIRDROP_ALLOC      =   400_000_000 ether;
    uint256 public constant LIQUIDITY_ALLOC    =   250_000_000 ether;
    uint256 public constant TEAM_ALLOC         =   200_000_000 ether;
    uint256 public constant ECOSYSTEM_ALLOC    =   100_000_000 ether;
    uint256 public constant TOURNAMENT_ALLOC   =    50_000_000 ether;

    // ─── Transfer lock ────────────────────────────────────────────────────────
    bool public transfersUnlocked;
    mapping(address => bool) public transferWhitelist;

    // ─── Merkle airdrop ───────────────────────────────────────────────────────
    bytes32 public merkleRoot;
    mapping(address => bool) public hasClaimed;
    uint256 public totalClaimed;

    // ─── Events ───────────────────────────────────────────────────────────────
    event TransfersUnlocked();
    event WhitelistUpdated(address indexed account, bool status);
    event MerkleRootSet(bytes32 root);
    event AirdropClaimed(address indexed claimer, uint256 amount);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error TransferLocked();
    error AlreadyClaimed();
    error InvalidProof();
    error AirdropExhausted();

    constructor(address initialOwner)
        ERC20("ChessWar Token", "CWAR")
        Ownable(initialOwner)
    {
        // Whitelist owner so it can seed liquidity before TGE
        transferWhitelist[initialOwner] = true;

        // Mint allocations to owner — owner distributes to the right addresses
        _mint(initialOwner, LIQUIDITY_ALLOC + TEAM_ALLOC + ECOSYSTEM_ALLOC + TOURNAMENT_ALLOC);

        // Airdrop allocation stays in this contract for claims
        _mint(address(this), AIRDROP_ALLOC);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function unlockTransfers() external onlyOwner {
        transfersUnlocked = true;
        emit TransfersUnlocked();
    }

    function setWhitelist(address account, bool status) external onlyOwner {
        transferWhitelist[account] = status;
        emit WhitelistUpdated(account, status);
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
        emit MerkleRootSet(root);
    }

    // ─── Airdrop claim ────────────────────────────────────────────────────────

    /**
     * @notice Claim your CWAR airdrop.
     * @param amount Your allocated amount (from the merkle tree)
     * @param proof  Merkle proof generated off-chain
     *
     * Leaf format: keccak256(abi.encodePacked(claimer, amount))
     */
    function claim(uint256 amount, bytes32[] calldata proof) external {
        if (hasClaimed[msg.sender]) revert AlreadyClaimed();
        if (totalClaimed + amount > AIRDROP_ALLOC) revert AirdropExhausted();

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) revert InvalidProof();

        hasClaimed[msg.sender] = true;
        totalClaimed += amount;
        _transfer(address(this), msg.sender, amount);

        emit AirdropClaimed(msg.sender, amount);
    }

    // ─── Transfer lock override ───────────────────────────────────────────────

    function _update(address from, address to, uint256 value) internal override {
        // Allow minting (from == 0) and burning (to == 0) always
        // Allow whitelisted addresses always
        // Otherwise check if transfers are unlocked
        if (
            from != address(0) &&
            to != address(0) &&
            !transfersUnlocked &&
            !transferWhitelist[from] &&
            !transferWhitelist[to]
        ) {
            revert TransferLocked();
        }
        super._update(from, to, value);
    }
}
