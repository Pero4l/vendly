// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IEscrow {
    function createEscrow(
        bytes32 orderId,
        address buyer,
        address seller,
        address tokenAddress,
        uint256 amount
    ) external payable;
}

contract Marketplace is 
    Initializable, 
    AccessControlUpgradeable, 
    PausableUpgradeable, 
    UUPSUpgradeable 
{
    using SafeERC20 for IERC20;

    struct Listing {
        uint256 id;
        address seller;
        string tokenUri; // IPFS hash or metadata URL containing title, description, etc.
        uint256 price;
        uint256 quantity;
        address tokenAddress; // address(0) for native CELO
        bool active;
    }

    IEscrow public escrow;
    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;

    // Platform Fee Parameters
    address public deployerAddress;
    uint256 public platformFeeBasisPoints; // e.g. 250 for 2.5%
    mapping(address => uint256) public accumulatedFees;

    event ListingCreated(uint256 indexed listingId, address indexed seller, string tokenUri, uint256 price, uint256 quantity, address tokenAddress);
    event ListingUpdated(uint256 indexed listingId, string tokenUri, uint256 price, uint256 quantity, address tokenAddress, bool active);
    event ListingRemoved(uint256 indexed listingId);
    event ProductPurchased(uint256 indexed listingId, address indexed buyer, uint256 quantity, bytes32 indexed orderId, uint256 totalCost);
    event PlatformFeeSet(uint256 feeBps);
    event FeesWithdrawn(address indexed token, address indexed recipient, uint256 amount);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        // _disableInitializers();
    }

    function initialize(address admin, address escrowAddress) public initializer {
        __AccessControl_init();
        __Pausable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        escrow = IEscrow(escrowAddress);
        deployerAddress = admin; // In this setup, admin represents the contract deployer
        platformFeeBasisPoints = 0; // Default: 0%
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}

    // --- Admin Functions ---

    function setEscrow(address escrowAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(escrowAddress != address(0), "Invalid escrow address");
        escrow = IEscrow(escrowAddress);
    }

    /**
     * @notice Sets platform fee in basis points (100 = 1%). Max fee 10% (1000 bps).
     */
    function setPlatformFee(uint256 feeBps) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feeBps <= 1000, "Fee cannot exceed 10%");
        platformFeeBasisPoints = feeBps;
        emit PlatformFeeSet(feeBps);
    }

    /**
     * @notice Withdraws collected fees. Destination is hardcoded to deployerAddress.
     */
    function withdrawFees(address token) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 amount = accumulatedFees[token];
        require(amount > 0, "No fees to withdraw");
        accumulatedFees[token] = 0;

        if (token == address(0)) {
            (bool success, ) = payable(deployerAddress).call{value: amount}("");
            require(success, "Native transfer failed");
        } else {
            IERC20(token).safeTransfer(deployerAddress, amount);
        }

        emit FeesWithdrawn(token, deployerAddress, amount);
    }

    // --- Listing Functions ---

    function createListing(
        string calldata tokenUri,
        uint256 price,
        uint256 quantity,
        address tokenAddress
    ) external whenNotPaused returns (uint256) {
        require(price > 0, "Price must be greater than zero");
        require(quantity > 0, "Quantity must be greater than zero");

        listingCount++;
        listings[listingCount] = Listing({
            id: listingCount,
            seller: msg.sender,
            tokenUri: tokenUri,
            price: price,
            quantity: quantity,
            tokenAddress: tokenAddress,
            active: true
        });

        emit ListingCreated(listingCount, msg.sender, tokenUri, price, quantity, tokenAddress);
        return listingCount;
    }

    function updateListing(
        uint256 listingId,
        string calldata tokenUri,
        uint256 price,
        uint256 quantity,
        address tokenAddress,
        bool active
    ) external whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.id != 0, "Listing does not exist");
        require(listing.seller == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not listing owner or admin");
        require(price > 0, "Price must be greater than zero");

        listing.tokenUri = tokenUri;
        listing.price = price;
        listing.quantity = quantity;
        listing.tokenAddress = tokenAddress;
        listing.active = active;

        emit ListingUpdated(listingId, tokenUri, price, quantity, tokenAddress, active);
    }

    function removeListing(uint256 listingId) external whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.id != 0, "Listing does not exist");
        require(listing.seller == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Not listing owner or admin");
        require(listing.active, "Listing already inactive");

        listing.active = false;
        emit ListingRemoved(listingId);
    }

    // --- Purchase Functions ---

    function purchase(
        uint256 listingId,
        uint256 quantity,
        bytes32 orderId
    ) external payable whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.id != 0, "Listing does not exist");
        require(listing.active, "Listing is not active");
        require(listing.quantity >= quantity, "Insufficient listing quantity");

        uint256 totalCost = listing.price * quantity;
        listing.quantity -= quantity;
        if (listing.quantity == 0) {
            listing.active = false;
        }

        // Calculate platform fee
        uint256 fee = (totalCost * platformFeeBasisPoints) / 10000;
        uint256 escrowAmount = totalCost - fee;

        if (listing.tokenAddress == address(0)) {
            require(msg.value == totalCost, "Incorrect CELO value sent");
            
            // Accrue native CELO fee
            accumulatedFees[address(0)] += fee;
            
            // Forward remaining CELO to the escrow contract
            escrow.createEscrow{value: escrowAmount}(orderId, msg.sender, listing.seller, address(0), escrowAmount);
        } else {
            require(msg.value == 0, "Do not send CELO for ERC20 payments");
            
            // Transfer ERC20 from buyer to Marketplace contract
            IERC20(listing.tokenAddress).safeTransferFrom(msg.sender, address(this), totalCost);
            
            // Accrue ERC20 fee
            accumulatedFees[listing.tokenAddress] += fee;
            
            // Approve Escrow contract to pull remaining from Marketplace
            IERC20(listing.tokenAddress).approve(address(escrow), escrowAmount);
            
            // Create escrow through Escrow contract
            escrow.createEscrow(orderId, msg.sender, listing.seller, listing.tokenAddress, escrowAmount);
        }

        emit ProductPurchased(listingId, msg.sender, quantity, orderId, totalCost);
    }
}
