// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VendlyEscrow
 * @notice 3-stage admin-gated escrow for Vendly marketplace orders.
 *
 * Flow:
 *  1. Backend calls lockFunds() when buyer places order — funds sit in contract.
 *  2. Admin calls approveStage(orderId, 1) after verifying order accepted  → 30% credited to seller.
 *  3. Seller calls sellerWithdraw(orderId) to pull their approved balance.
 *  4. Admin calls approveStage(orderId, 2) after shipment confirmed          → 20% credited to seller.
 *  5. Seller calls sellerWithdraw(orderId) again.
 *  6. Admin calls approveStage(orderId, 3) after delivery confirmed          → 50% credited to seller.
 *  7. Seller calls sellerWithdraw(orderId) for the final payout.
 *
 * Rules:
 *  - Only the admin (deployer) can approve stages or refund the buyer.
 *  - Only the seller of a specific order can withdraw that order's approved funds.
 *  - Stages must be approved in order (1 → 2 → 3).
 *  - adminEmergencyWithdraw() is restricted to the deployer address only.
 */
contract VendlyEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── State ───────────────────────────────────────────────────────
    address public immutable admin;   // deployer — set once, never changes

    struct OrderEscrow {
        address buyer;
        address seller;
        address token;          // address(0) = native CELO; any ERC-20 address otherwise
        uint256 totalAmount;    // total locked
        uint256 approvedAmount; // total credited to seller (approved across all stages)
        uint256 withdrawnAmount;// total already withdrawn by seller
        uint8   stageApproved;  // 0 = none, 1 = 30% approved, 2 = +20% approved, 3 = +50% approved (complete)
        bool    active;
        bool    disputed;
        bool    refunded;
    }

    mapping(bytes32 => OrderEscrow) public orders;

    // ─── Events ──────────────────────────────────────────────────────
    event FundsLocked(bytes32 indexed orderId, address buyer, address seller, address token, uint256 amount);
    event StageApproved(bytes32 indexed orderId, uint8 stage, uint256 credited);
    event SellerWithdrew(bytes32 indexed orderId, address seller, uint256 amount);
    event BuyerRefunded(bytes32 indexed orderId, address buyer, uint256 amount);
    event DisputeOpened(bytes32 indexed orderId);
    event DisputeResolved(bytes32 indexed orderId, uint256 sellerAmount, uint256 buyerAmount);

    // ─── Modifiers ───────────────────────────────────────────────────
    modifier onlyAdmin() {
        require(msg.sender == admin, "Escrow: caller is not admin");
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────
    constructor() {
        admin = msg.sender;
    }

    // ─── Locking ─────────────────────────────────────────────────────

    /**
     * @notice Called by the backend (admin wallet) when a buyer places an order.
     *         For native CELO: send value == amount. For ERC-20: backend must
     *         have already approved this contract to spend `amount` tokens.
     * @param orderId  keccak256 of the DB order UUID
     * @param buyer    buyer's custodial wallet address
     * @param seller   seller's custodial wallet address
     * @param token    address(0) for CELO, ERC-20 contract address otherwise
     * @param amount   total order value in wei
     */
    function lockFunds(
        bytes32 orderId,
        address buyer,
        address seller,
        address token,
        uint256 amount
    ) external payable onlyAdmin nonReentrant {
        require(orders[orderId].totalAmount == 0, "Escrow: order already exists");
        require(amount > 0, "Escrow: amount must be > 0");
        require(buyer != address(0) && seller != address(0), "Escrow: invalid address");

        if (token == address(0)) {
            require(msg.value == amount, "Escrow: CELO amount mismatch");
        } else {
            require(msg.value == 0, "Escrow: do not send CELO for ERC-20 orders");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        orders[orderId] = OrderEscrow({
            buyer: buyer,
            seller: seller,
            token: token,
            totalAmount: amount,
            approvedAmount: 0,
            withdrawnAmount: 0,
            stageApproved: 0,
            active: true,
            disputed: false,
            refunded: false
        });

        emit FundsLocked(orderId, buyer, seller, token, amount);
    }

    // ─── Admin: Stage Approvals ───────────────────────────────────────

    /**
     * @notice Admin approves a stage. This credits the seller's claimable balance
     *         inside the contract — it does NOT push funds to them automatically.
     *         The seller must call sellerWithdraw() separately.
     *
     *  Stage 1 → credits 30% of totalAmount
     *  Stage 2 → credits 20% of totalAmount (requires stage 1 already approved)
     *  Stage 3 → credits remaining ~50% of totalAmount (requires stage 2 already approved)
     */
    function approveStage(bytes32 orderId, uint8 stage) external onlyAdmin nonReentrant {
        OrderEscrow storage o = orders[orderId];
        require(o.totalAmount > 0, "Escrow: order not found");
        require(o.active, "Escrow: order not active");
        require(!o.disputed, "Escrow: order is disputed");
        require(!o.refunded, "Escrow: order was refunded");
        require(stage >= 1 && stage <= 3, "Escrow: invalid stage");
        require(stage == o.stageApproved + 1, "Escrow: stages must be approved in order");

        uint256 credit;
        if (stage == 1) {
            credit = (o.totalAmount * 30) / 100;
        } else if (stage == 2) {
            credit = (o.totalAmount * 20) / 100;
        } else {
            // Stage 3: everything not yet approved (handles rounding dust automatically)
            credit = o.totalAmount - o.approvedAmount;
        }

        o.approvedAmount += credit;
        o.stageApproved = stage;
        if (stage == 3) o.active = false; // Order fully complete

        emit StageApproved(orderId, stage, credit);
    }

    // ─── Seller: Withdraw ────────────────────────────────────────────

    /**
     * @notice Seller pulls all admin-approved but unwithdrawN funds for an order.
     *         Only the seller of this specific order can call this.
     *         Nothing to pull if admin has not approved any stage yet.
     */
    function sellerWithdraw(bytes32 orderId) external nonReentrant {
        OrderEscrow storage o = orders[orderId];
        require(o.totalAmount > 0, "Escrow: order not found");
        require(msg.sender == o.seller, "Escrow: caller is not the seller");
        // Note: refunded=true is allowed here — after a refund or dispute the seller
        // may still have an approved/credited balance they need to claim.

        uint256 claimable = o.approvedAmount - o.withdrawnAmount;
        require(claimable > 0, "Escrow: nothing to withdraw");

        o.withdrawnAmount += claimable;
        _sendFunds(o.token, o.seller, claimable);

        emit SellerWithdrew(orderId, o.seller, claimable);
    }

    // ─── Admin: Refund & Dispute ──────────────────────────────────────

    /**
     * @notice Admin refunds the remaining locked (not yet approved) funds to the buyer.
     *         Any already-approved amounts stay with the seller.
     *         Seller can still withdraw their approved balance after a refund.
     */
    function refundBuyer(bytes32 orderId) external onlyAdmin nonReentrant {
        OrderEscrow storage o = orders[orderId];
        require(o.totalAmount > 0, "Escrow: order not found");
        require(!o.refunded, "Escrow: already refunded");
        require(o.active || o.disputed, "Escrow: order already completed");

        uint256 refundable = o.totalAmount - o.approvedAmount;
        require(refundable > 0, "Escrow: no funds left to refund");

        o.refunded = true;
        o.active = false;

        _sendFunds(o.token, o.buyer, refundable);
        emit BuyerRefunded(orderId, o.buyer, refundable);
    }

    /**
     * @notice Either the buyer, seller, or admin can flag an order as disputed.
     *         This prevents new stage approvals until resolved.
     */
    function openDispute(bytes32 orderId) external {
        OrderEscrow storage o = orders[orderId];
        require(o.totalAmount > 0, "Escrow: order not found");
        require(o.active, "Escrow: order not active");
        require(!o.disputed, "Escrow: already disputed");
        require(
            msg.sender == o.buyer || msg.sender == o.seller || msg.sender == admin,
            "Escrow: not authorized"
        );

        o.disputed = true;
        emit DisputeOpened(orderId);
    }

    /**
     * @notice Admin resolves a dispute: splits remaining locked funds between
     *         seller and buyer. sellerShare + buyerShare must equal the locked remainder.
     * @param sellerShare how much of the remaining locked amount goes to the seller
     */
    function resolveDispute(bytes32 orderId, uint256 sellerShare) external onlyAdmin nonReentrant {
        OrderEscrow storage o = orders[orderId];
        require(o.totalAmount > 0, "Escrow: order not found");
        require(o.disputed, "Escrow: not disputed");

        uint256 locked = o.totalAmount - o.approvedAmount;
        require(sellerShare <= locked, "Escrow: seller share exceeds locked funds");

        uint256 buyerShare = locked - sellerShare;

        o.disputed = false;
        o.refunded = true;
        o.active = false;
        o.approvedAmount += sellerShare; // credit seller their dispute allocation

        if (buyerShare > 0) _sendFunds(o.token, o.buyer, buyerShare);
        // Seller still needs to call sellerWithdraw() for their approved amount
        // This is intentional: admin approved it but seller must claim

        emit DisputeResolved(orderId, sellerShare, buyerShare);
    }

    // ─── Admin: Emergency Drain ───────────────────────────────────────

    /**
     * @notice Emergency function — only the deployer address can call this.
     *         Use only if there is a critical bug and funds need to be recovered.
     * @param token  address(0) for CELO, ERC-20 address otherwise
     * @param amount amount to withdraw
     */
    function adminEmergencyWithdraw(address token, uint256 amount) external onlyAdmin nonReentrant {
        _sendFunds(token, admin, amount);
    }

    // ─── Views ───────────────────────────────────────────────────────

    /** @notice Returns how much a seller can currently withdraw for an order. */
    function getSellerClaimable(bytes32 orderId) external view returns (uint256) {
        OrderEscrow storage o = orders[orderId];
        if (o.totalAmount == 0) return 0;
        return o.approvedAmount - o.withdrawnAmount;
    }

    /** @notice Returns full escrow details for an order. */
    function getOrder(bytes32 orderId) external view returns (
        address buyer, address seller, address token,
        uint256 totalAmount, uint256 approvedAmount, uint256 withdrawnAmount,
        uint8 stageApproved, bool active, bool disputed, bool refunded
    ) {
        OrderEscrow storage o = orders[orderId];
        return (
            o.buyer, o.seller, o.token,
            o.totalAmount, o.approvedAmount, o.withdrawnAmount,
            o.stageApproved, o.active, o.disputed, o.refunded
        );
    }

    // ─── Internal ────────────────────────────────────────────────────

    function _sendFunds(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool ok, ) = payable(to).call{value: amount}("");
            require(ok, "Escrow: CELO transfer failed");
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
