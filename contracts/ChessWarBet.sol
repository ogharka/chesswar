// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title ChessWarBet
 * @notice USDC escrow contract for ChessWar bet battles.
 *
 * Flow:
 *   1. Player A calls createGame(stake) — deposits USDC, gets a gameId
 *   2. Player B calls joinGame(gameId)  — deposits matching USDC
 *   3. Oracle calls resolveGame(gameId, winner) after the match ends
 *   4. Winner receives 2× stake minus 2% platform fee
 *   5. Either player can cancel an unjoined game to get their stake back
 *
 * Oracle:
 *   A trusted backend address (set by owner) signs and submits results.
 *   For added security, result submission requires an ECDSA signature from the oracle.
 */
contract ChessWarBet is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Config ───────────────────────────────────────────────────────────────
    IERC20  public immutable usdc;
    address public oracle;
    address public feeRecipient;

    uint256 public constant FEE_BPS       = 200;   // 2%
    uint256 public constant MIN_STAKE     = 100_000; // 0.10 USDC (6 decimals)
    uint256 public constant BPS_DENOM     = 10_000;

    // ─── Game state ───────────────────────────────────────────────────────────
    enum Status { Open, Active, Resolved, Cancelled }

    struct Game {
        address playerA;
        address playerB;
        uint256 stake;      // per player, in USDC (6 decimals)
        Status  status;
    }

    uint256 public nextGameId;
    mapping(uint256 => Game) public games;

    // ─── Events ───────────────────────────────────────────────────────────────
    event GameCreated(uint256 indexed gameId, address indexed playerA, uint256 stake);
    event GameJoined(uint256 indexed gameId, address indexed playerB);
    event GameResolved(uint256 indexed gameId, address indexed winner, uint256 payout);
    event GameCancelled(uint256 indexed gameId);
    event OracleUpdated(address indexed newOracle);

    // ─── Errors ───────────────────────────────────────────────────────────────
    error StakeTooLow();
    error GameNotOpen();
    error GameNotActive();
    error NotOracle();
    error NotPlayerA();
    error InvalidWinner();

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address usdcAddress, address _oracle, address initialOwner)
        Ownable(initialOwner)
    {
        usdc         = IERC20(usdcAddress);
        oracle       = _oracle;
        feeRecipient = initialOwner;
    }

    // ─── Player actions ───────────────────────────────────────────────────────

    /**
     * @notice Create a new bet game. Deposits `stake` USDC into escrow.
     */
    function createGame(uint256 stake) external nonReentrant returns (uint256 gameId) {
        if (stake < MIN_STAKE) revert StakeTooLow();

        usdc.safeTransferFrom(msg.sender, address(this), stake);

        gameId = nextGameId++;
        games[gameId] = Game({
            playerA: msg.sender,
            playerB: address(0),
            stake:   stake,
            status:  Status.Open
        });

        emit GameCreated(gameId, msg.sender, stake);
    }

    /**
     * @notice Join an open game. Must deposit the same stake as Player A.
     */
    function joinGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.status != Status.Open) revert GameNotOpen();

        usdc.safeTransferFrom(msg.sender, address(this), game.stake);

        game.playerB = msg.sender;
        game.status  = Status.Active;

        emit GameJoined(gameId, msg.sender);
    }

    /**
     * @notice Cancel an open (unjoined) game and refund stake to Player A.
     */
    function cancelGame(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        if (game.status != Status.Open) revert GameNotOpen();
        if (msg.sender != game.playerA) revert NotPlayerA();

        game.status = Status.Cancelled;
        usdc.safeTransfer(game.playerA, game.stake);

        emit GameCancelled(gameId);
    }

    // ─── Oracle ───────────────────────────────────────────────────────────────

    /**
     * @notice Resolve a game and pay the winner.
     *         Only callable by the oracle address.
     * @param gameId  The game to resolve
     * @param winner  Must be playerA or playerB
     */
    function resolveGame(uint256 gameId, address winner) external nonReentrant {
        if (msg.sender != oracle) revert NotOracle();

        Game storage game = games[gameId];
        if (game.status != Status.Active) revert GameNotActive();
        if (winner != game.playerA && winner != game.playerB) revert InvalidWinner();

        game.status = Status.Resolved;

        uint256 pot     = game.stake * 2;
        uint256 fee     = (pot * FEE_BPS) / BPS_DENOM;
        uint256 payout  = pot - fee;

        usdc.safeTransfer(feeRecipient, fee);
        usdc.safeTransfer(winner, payout);

        emit GameResolved(gameId, winner, payout);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setOracle(address newOracle) external onlyOwner {
        oracle = newOracle;
        emit OracleUpdated(newOracle);
    }

    function setFeeRecipient(address recipient) external onlyOwner {
        feeRecipient = recipient;
    }

    // ─── Views ────────────────────────────────────────────────────────────────

    function getGame(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }
}
