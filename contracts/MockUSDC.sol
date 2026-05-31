// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Testnet-only USDC substitute for OPN Testnet.
 *         Anyone can mint up to 1,000 USDC per day via faucet().
 *         6 decimals to match real USDC.
 */
contract MockUSDC is ERC20, Ownable {

    uint8 private constant DECIMALS = 6;
    uint256 public constant FAUCET_AMOUNT = 1_000 * 10 ** 6;   // 1,000 USDC
    uint256 public constant FAUCET_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastFaucet;

    event Faucet(address indexed to, uint256 amount);

    constructor(address initialOwner)
        ERC20("USD Coin (Testnet)", "USDC")
        Ownable(initialOwner)
    {
        // Mint 10M USDC to owner for seeding liquidity / testing
        _mint(initialOwner, 10_000_000 * 10 ** DECIMALS);
    }

    /// @notice Anyone can call this once per 24h to get 1,000 test USDC
    function faucet() external {
        require(
            block.timestamp >= lastFaucet[msg.sender] + FAUCET_COOLDOWN,
            "Faucet: cooldown active"
        );
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
        emit Faucet(msg.sender, FAUCET_AMOUNT);
    }

    /// @notice Owner can mint arbitrary amounts for testing
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
}
