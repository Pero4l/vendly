const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vendly System Tests", function () {
  let admin, seller, buyer, outsider;
  let escrow, marketplace, reputation, mockToken;

  beforeEach(async function () {
    [admin, seller, buyer, outsider] = await ethers.getSigners();

    // 1. Deploy Mock ERC20
    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock cUSD", "mcUSD", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // Distribute tokens to buyer
    await mockToken.transfer(buyer.address, ethers.parseEther("10000"));

    // 2. Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy();
    await escrow.waitForDeployment();
    await escrow.initialize(admin.address);

    // 3. Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();
    await marketplace.initialize(admin.address, await escrow.getAddress());

    // 4. Deploy Reputation
    const Reputation = await ethers.getContractFactory("Reputation");
    reputation = await Reputation.deploy();
    await reputation.waitForDeployment();
    await reputation.initialize(admin.address);

    // Grant roles
    const MARKETPLACE_ROLE = await escrow.MARKETPLACE_ROLE();
    await escrow.grantRole(MARKETPLACE_ROLE, await marketplace.getAddress());
    await reputation.grantRole(MARKETPLACE_ROLE, admin.address); // For manual/admin updates
  });

  describe("Reputation Contract", function () {
    it("Should track seller rating and completed orders", async function () {
      await reputation.submitReview(seller.address, buyer.address, 5);
      await reputation.submitReview(seller.address, buyer.address, 4);
      await reputation.incrementCompletedOrders(seller.address);

      const [avgRating, count, completed] = await reputation.getSellerRating(seller.address);
      expect(avgRating).to.equal(450); // (5 + 4) / 2 = 4.5 -> 450
      expect(count).to.equal(2);
      expect(completed).to.equal(1);
    });
  });

  describe("Marketplace Fee System", function () {
    it("Should allow admin to set fee and restrict withdrawals to deployer address", async function () {
      // 1. Set fee to 2.5% (250 basis points)
      await expect(marketplace.connect(outsider).setPlatformFee(250)).to.be.reverted;
      await expect(marketplace.connect(admin).setPlatformFee(1200)).to.be.revertedWith("Fee cannot exceed 10%");
      
      await expect(marketplace.connect(admin).setPlatformFee(250))
        .to.emit(marketplace, "PlatformFeeSet")
        .withArgs(250);

      expect(await marketplace.platformFeeBasisPoints()).to.equal(250);

      // Create a listing
      const price = ethers.parseEther("100"); // 100 CELO
      await marketplace.connect(seller).createListing("ipfs://test-fee", price, 1, ethers.ZeroAddress);

      // Purchase
      let orderId = ethers.keccak256(ethers.toUtf8Bytes("order-fee"));
      await marketplace.connect(buyer).purchase(1, 1, orderId, { value: price });

      // Verify that 2.5% (2.5 CELO) goes to accumulatedFees, and 97.5% (97.5 CELO) goes to escrow
      const escrowRecord = await escrow.escrows(orderId);
      expect(escrowRecord.totalAmount).to.equal(ethers.parseEther("97.5"));

      const accFee = await marketplace.accumulatedFees(ethers.ZeroAddress);
      expect(accFee).to.equal(ethers.parseEther("2.5"));

      // Withdraw fees
      // Outsider should fail
      await expect(marketplace.connect(outsider).withdrawFees(ethers.ZeroAddress)).to.be.reverted;

      // Admin withdrawals go strictly to deployerAddress (admin in this case)
      const deployerInitialBalance = await ethers.provider.getBalance(admin.address);
      
      const tx = await marketplace.connect(admin).withdrawFees(ethers.ZeroAddress);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      const deployerFinalBalance = await ethers.provider.getBalance(admin.address);
      
      // Deployer balance should increase by 2.5 CELO minus gas spent
      expect(deployerFinalBalance - deployerInitialBalance + gasSpent).to.equal(ethers.parseEther("2.5"));
      
      // Accumulated fees should be reset
      expect(await marketplace.accumulatedFees(ethers.ZeroAddress)).to.equal(0);
    });
  });

  describe("Marketplace & Escrow Purchasing Flow", function () {
    let orderId = ethers.keccak256(ethers.toUtf8Bytes("order-1"));

    it("Should purchase and execute 3-stage escrow release with native CELO", async function () {
      // Seller creates listing with CELO (tokenAddress = 0x0)
      const price = ethers.parseEther("10"); // 10 CELO
      const qty = 2;
      const totalCost = price * BigInt(qty); // 20 CELO

      await marketplace.connect(seller).createListing("ipfs://test-metadata", price, qty, ethers.ZeroAddress);

      // Buyer purchases listing
      const initialSellerBalance = await ethers.provider.getBalance(seller.address);

      await marketplace.connect(buyer).purchase(1, qty, orderId, { value: totalCost });

      // Verify Escrow created
      const escrowRecord = await escrow.escrows(orderId);
      expect(escrowRecord.totalAmount).to.equal(totalCost);

      // Stage 1 release (30%)
      await escrow.connect(admin).releaseThirtyPercent(orderId);
      let record = await escrow.escrows(orderId);
      expect(record.stage).to.equal(1);

      // Stage 2 release (20%)
      await escrow.connect(admin).releaseTwentyPercent(orderId);
      record = await escrow.escrows(orderId);
      expect(record.stage).to.equal(2);

      // Stage 3 release (50%)
      await escrow.connect(admin).releaseFinalFiftyPercent(orderId);
      record = await escrow.escrows(orderId);
      expect(record.stage).to.equal(3);

      const finalSellerBalance = await ethers.provider.getBalance(seller.address);
      expect(finalSellerBalance - initialSellerBalance).to.equal(totalCost);
    });

    it("Should purchase and execute escrow with ERC20", async function () {
      const price = ethers.parseEther("5"); // 5 mcUSD
      const qty = 1;
      const totalCost = price * BigInt(qty);

      // Seller creates listing with mcUSD
      await marketplace.connect(seller).createListing("ipfs://test-erc20", price, qty, await mockToken.getAddress());

      // Buyer approves Marketplace to spend mockToken
      await mockToken.connect(buyer).approve(await marketplace.getAddress(), totalCost);

      // Buyer purchases listing
      await marketplace.connect(buyer).purchase(1, qty, orderId);

      // Check escrow
      let record = await escrow.escrows(orderId);
      expect(record.totalAmount).to.equal(totalCost);

      // Dispute & Refund Scenario
      await escrow.connect(buyer).openDispute(orderId);
      record = await escrow.escrows(orderId);
      expect(record.isDisputed).to.be.true;

      // Admin resolves dispute: Refund 60%, release 40%
      const initialBuyerBalance = await mockToken.balanceOf(buyer.address);
      const initialSellerBalance = await mockToken.balanceOf(seller.address);

      const refundAmount = (totalCost * BigInt(60)) / BigInt(100);
      const releaseToSeller = totalCost - refundAmount;

      await escrow.connect(admin).resolveDispute(orderId, refundAmount);

      const finalBuyerBalance = await mockToken.balanceOf(buyer.address);
      const finalSellerBalance = await mockToken.balanceOf(seller.address);

      expect(finalBuyerBalance - initialBuyerBalance).to.equal(refundAmount);
      expect(finalSellerBalance - initialSellerBalance).to.equal(releaseToSeller);

      record = await escrow.escrows(orderId);
      expect(record.isDisputed).to.be.false;
      expect(record.stage).to.equal(3);
    });
  });
});
