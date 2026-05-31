// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChessWarNFT
 * @notice War NFTs — 4 tiers with permanent point multipliers.
 *
 * Tier     Multiplier   Mint Price (OPN)
 * -------  ----------   ----------------
 * Soldier      2×       0.001 OPN
 * Knight       3×       0.003 OPN
 * Commander    4×       0.005 OPN
 * Warlord      5×       0.010 OPN
 *
 * A wallet's active multiplier = highest tier NFT owned.
 */
contract ChessWarNFT is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard {

    // ─── Tiers ────────────────────────────────────────────────────────────────
    enum Tier { Soldier, Knight, Commander, Warlord }

    struct TierConfig {
        uint256 price;       // in wei (OPN)
        uint8   multiplier;  // war points multiplier
        uint256 maxSupply;
    }

    mapping(Tier => TierConfig) public tierConfig;
    mapping(Tier => uint256)    public tierMinted;
    mapping(uint256 => Tier)    public tokenTier;

    uint256 private _nextTokenId;

    // ─── Platform fee ─────────────────────────────────────────────────────────
    address public feeRecipient;

    // ─── Events ───────────────────────────────────────────────────────────────
    event Minted(address indexed to, uint256 indexed tokenId, Tier tier);
    event FeeRecipientUpdated(address indexed newRecipient);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error WrongPrice();
    error MaxSupplyReached();

    constructor(address initialOwner)
        ERC721("ChessWar NFT", "CWAR-NFT")
        Ownable(initialOwner)
    {
        feeRecipient = initialOwner;

        tierConfig[Tier.Soldier]   = TierConfig({ price: 0.001 ether, multiplier: 2, maxSupply: 10_000 });
        tierConfig[Tier.Knight]    = TierConfig({ price: 0.003 ether, multiplier: 3, maxSupply: 5_000  });
        tierConfig[Tier.Commander] = TierConfig({ price: 0.005 ether, multiplier: 4, maxSupply: 2_000  });
        tierConfig[Tier.Warlord]   = TierConfig({ price: 0.010 ether, multiplier: 5, maxSupply: 500    });
    }

    // ─── Mint ─────────────────────────────────────────────────────────────────

    function mint(Tier tier) external payable nonReentrant returns (uint256 tokenId) {
        TierConfig memory cfg = tierConfig[tier];

        if (msg.value != cfg.price) revert WrongPrice();
        if (tierMinted[tier] >= cfg.maxSupply) revert MaxSupplyReached();

        tokenId = _nextTokenId++;
        tierMinted[tier]++;
        tokenTier[tokenId] = tier;

        _safeMint(msg.sender, tokenId);

        // Forward mint fee to recipient
        (bool ok,) = feeRecipient.call{value: msg.value}("");
        require(ok, "Fee transfer failed");

        emit Minted(msg.sender, tokenId, tier);
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    /**
     * @notice Returns the highest multiplier owned by a wallet.
     *         Returns 1 (no boost) if the wallet owns no War NFTs.
     */
    function multiplierOf(address wallet) external view returns (uint8) {
        uint256 balance = balanceOf(wallet);
        if (balance == 0) return 1;

        uint8 best = 1;
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(wallet, i);
            uint8 m = tierConfig[tokenTier[tokenId]].multiplier;
            if (m > best) best = m;
        }
        return best;
    }

    function tierOf(uint256 tokenId) external view returns (Tier) {
        return tokenTier[tokenId];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setFeeRecipient(address recipient) external onlyOwner {
        feeRecipient = recipient;
        emit FeeRecipientUpdated(recipient);
    }

    function setTierPrice(Tier tier, uint256 price) external onlyOwner {
        tierConfig[tier].price = price;
    }

    // ─── Overrides ────────────────────────────────────────────────────────────

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721Enumerable) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
