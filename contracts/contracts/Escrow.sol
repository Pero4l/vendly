// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow is 
    Initializable, 
    AccessControlUpgradeable, 
    ReentrancyGuard, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    struct EscrowRecord {
        bytes32 orderId;
        address buyer;
        address seller;
        address tokenAddress; // address(0) for native CELO
        uint256 totalAmount;
        uint256 releasedAmount;
        uint8 stage; // 0 = LOCKED, 1 = 30% RELEASED, 2 = 50% RELEASED, 3 = COMPLETED
        bool isDisputed;
        bool isRefunded;
    }

    mapping(bytes32 => EscrowRecord) public escrows;

    event EscrowCreated(bytes32 indexed orderId, address indexed buyer, address indexed seller, address tokenAddress, uint256 amount);
    event StageOneReleased(bytes32 indexed orderId, uint256 amount);
    event StageTwoReleased(bytes32 indexed orderId, uint256 amount);
    event StageThreeReleased(bytes32 indexed orderId, uint256 amount);
    event BuyerRefunded(bytes32 indexed orderId, uint256 amount);
    event DisputeOpened(bytes32 indexed orderId);
    event DisputeResolved(bytes32 indexed orderId, uint256 refundAmount, uint256 releaseToSellerAmount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKETPLACE_ROLE, admin);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // --- Core Functions ---

    /**
     * @notice Creates an escrow record and locks tokens.
     */
    function createEscrow(
        bytes32 orderId,
        address buyer,
        address seller,
        address tokenAddress,
        uint256 amount
    ) external payable onlyRole(MARKETPLACE_ROLE) nonReentrant whenNotPaused {
        require(escrows[orderId].totalAmount == 0, "Escrow already exists");
        require(amount > 0, "Amount must be greater than zero");

        if (tokenAddress == address(0)) {
            require(msg.value == amount, "Sent CELO amount mismatch");
        } else {
            require(msg.value == 0, "Do not send CELO for ERC20 payments");
            // Expects tokens to be already sent to this contract or pulls them. 
            // In purchase() workflow, we will pull tokens from buyer using transferFrom.
            IERC20(tokenAddress).safeTransferFrom(msg.sender, address(this), amount);
        }

        escrows[orderId] = EscrowRecord({
            orderId: orderId,
            buyer: buyer,
            seller: seller,
            tokenAddress: tokenAddress,
            totalAmount: amount,
            releasedAmount: 0,
            stage: 0,
            isDisputed: false,
            isRefunded: false
        });

        emit EscrowCreated(orderId, buyer, seller, tokenAddress, amount);
    }

    /**
     * @notice Releases 30% of total escrow to the seller (Stage 1).
     */
    function releaseThirtyPercent(bytes32 orderId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(esc.stage == 0, "Invalid stage transition");
        require(!esc.isDisputed, "Escrow is in dispute");
        require(!esc.isRefunded, "Escrow already refunded");

        uint256 payout = (esc.totalAmount * 30) / 100;
        esc.releasedAmount += payout;
        esc.stage = 1;

        _payout(esc.tokenAddress, esc.seller, payout);
        emit StageOneReleased(orderId, payout);
    }

    /**
     * @notice Releases 20% of total escrow to the seller (Stage 2).
     */
    function releaseTwentyPercent(bytes32 orderId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(esc.stage == 1, "Invalid stage transition");
        require(!esc.isDisputed, "Escrow is in dispute");
        require(!esc.isRefunded, "Escrow already refunded");

        uint256 payout = (esc.totalAmount * 20) / 100;
        esc.releasedAmount += payout;
        esc.stage = 2;

        _payout(esc.tokenAddress, esc.seller, payout);
        emit StageTwoReleased(orderId, payout);
    }

    /**
     * @notice Releases remaining 50% of total escrow to the seller (Stage 3).
     */
    function releaseFinalFiftyPercent(bytes32 orderId) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(esc.stage == 2, "Invalid stage transition");
        require(!esc.isDisputed, "Escrow is in dispute");
        require(!esc.isRefunded, "Escrow already refunded");

        uint256 payout = esc.totalAmount - esc.releasedAmount; // Remaining balance
        esc.releasedAmount += payout;
        esc.stage = 3;

        _payout(esc.tokenAddress, esc.seller, payout);
        emit StageThreeReleased(orderId, payout);
    }

    /**
     * @notice Refunds a custom amount to the buyer (under admin instruction).
     */
    function refundBuyer(bytes32 orderId, uint256 refundAmount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(!esc.isRefunded, "Already refunded");
        
        uint256 remainingFunds = esc.totalAmount - esc.releasedAmount;
        require(refundAmount <= remainingFunds, "Refund amount exceeds locked funds");

        esc.isRefunded = true;
        esc.stage = 3; // Completes the escrow

        _payout(esc.tokenAddress, esc.buyer, refundAmount);
        
        // If there are any remaining funds, return them to the seller
        uint256 remainingToSeller = remainingFunds - refundAmount;
        if (remainingToSeller > 0) {
            _payout(esc.tokenAddress, esc.seller, remainingToSeller);
        }

        emit BuyerRefunded(orderId, refundAmount);
    }

    /**
     * @notice Marks the escrow as disputed.
     */
    function openDispute(bytes32 orderId) external whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(msg.sender == esc.buyer || msg.sender == esc.seller || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not authorized");
        require(!esc.isDisputed, "Already disputed");
        require(esc.stage < 3, "Escrow already completed");

        esc.isDisputed = true;
        emit DisputeOpened(orderId);
    }

    /**
     * @notice Resolves an open dispute.
     */
    function resolveDispute(bytes32 orderId, uint256 refundAmount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant whenNotPaused {
        EscrowRecord storage esc = escrows[orderId];
        require(esc.totalAmount > 0, "Escrow does not exist");
        require(esc.isDisputed, "Escrow not in dispute");

        uint256 remainingFunds = esc.totalAmount - esc.releasedAmount;
        require(refundAmount <= remainingFunds, "Refund amount exceeds remaining funds");

        esc.isDisputed = false;
        esc.isRefunded = (refundAmount > 0);
        esc.stage = 3; // Completes the escrow

        if (refundAmount > 0) {
            _payout(esc.tokenAddress, esc.buyer, refundAmount);
        }

        uint256 remainingToSeller = remainingFunds - refundAmount;
        if (remainingToSeller > 0) {
            _payout(esc.tokenAddress, esc.seller, remainingToSeller);
        }

        emit DisputeResolved(orderId, refundAmount, remainingToSeller);
    }

    // --- Helpers ---

    function _payout(address tokenAddress, address recipient, uint256 amount) internal {
        if (amount == 0) return;
        if (tokenAddress == address(0)) {
            (bool success, ) = payable(recipient).call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(tokenAddress).safeTransfer(recipient, amount);
        }
    }

    receive() external payable {}
}
