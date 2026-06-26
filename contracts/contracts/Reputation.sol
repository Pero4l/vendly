// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Reputation is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable 
{
    bytes32 public constant MARKETPLACE_ROLE = keccak256("MARKETPLACE_ROLE");

    struct SellerRep {
        uint256 totalRatingPoints;
        uint256 reviewCount;
        uint256 completedOrders;
    }

    mapping(address => SellerRep) public sellerProfiles;

    event ReviewSubmitted(address indexed seller, address indexed reviewer, uint256 rating);
    event CompletedOrderIncremented(address indexed seller, uint256 count);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // _disableInitializers();
    }

    function initialize(address admin) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKETPLACE_ROLE, admin);
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // --- Write Functions ---

    /**
     * @notice Submits a review rating for a seller.
     */
    function submitReview(
        address seller,
        address reviewer,
        uint256 rating
    ) external onlyRole(MARKETPLACE_ROLE) {
        require(seller != address(0), "Invalid seller address");
        require(rating >= 1 && rating <= 5, "Rating must be between 1 and 5");

        SellerRep storage profile = sellerProfiles[seller];
        profile.totalRatingPoints += rating;
        profile.reviewCount++;

        emit ReviewSubmitted(seller, reviewer, rating);
    }

    /**
     * @notice Increments completed order count for a seller.
     */
    function incrementCompletedOrders(address seller) external onlyRole(MARKETPLACE_ROLE) {
        require(seller != address(0), "Invalid seller address");
        
        SellerRep storage profile = sellerProfiles[seller];
        profile.completedOrders++;

        emit CompletedOrderIncremented(seller, profile.completedOrders);
    }

    // --- Read Functions ---

    /**
     * @notice Returns average seller rating, review count, and completed orders.
     * Rating is returned as a scaled integer (e.g. 4.5 is returned as 450, base 100)
     */
    function getSellerRating(address seller) 
        external 
        view 
        returns (
            uint256 averageRating,
            uint256 reviewCount,
            uint256 completedOrders
        ) 
    {
        SellerRep memory profile = sellerProfiles[seller];
        if (profile.reviewCount == 0) {
            return (0, 0, profile.completedOrders);
        }
        averageRating = (profile.totalRatingPoints * 100) / profile.reviewCount;
        return (averageRating, profile.reviewCount, profile.completedOrders);
    }
}
