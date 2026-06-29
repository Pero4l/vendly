const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VendlyEscrow", function () {
  let admin, seller, buyer, outsider;
  let escrow, mockToken;

  const ORDER_ID = ethers.id("order-001");

  beforeEach(async function () {
    [admin, seller, buyer, outsider] = await ethers.getSigners();

    const MockToken = await ethers.getContractFactory("MockERC20");
    mockToken = await MockToken.deploy("Mock cUSD", "mcUSD", ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();
    await mockToken.transfer(admin.address, ethers.parseEther("10000"));

    const VendlyEscrow = await ethers.getContractFactory("VendlyEscrow");
    escrow = await VendlyEscrow.deploy();
    await escrow.waitForDeployment();
  });

  // ─── lockFunds ───────────────────────────────────────────────

  describe("lockFunds", function () {
    it("locks native CELO for an order", async function () {
      const amount = ethers.parseEther("10");
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount });

      const o = await escrow.getOrder(ORDER_ID);
      expect(o.totalAmount).to.equal(amount);
      expect(o.buyer).to.equal(buyer.address);
      expect(o.seller).to.equal(seller.address);
      expect(o.active).to.be.true;
      expect(o.stageApproved).to.equal(0);
    });

    it("locks ERC-20 tokens for an order", async function () {
      const amount = ethers.parseEther("5");
      const tokenAddr = await mockToken.getAddress();
      const escrowAddr = await escrow.getAddress();

      await mockToken.connect(admin).approve(escrowAddr, amount);
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, tokenAddr, amount);

      const o = await escrow.getOrder(ORDER_ID);
      expect(o.totalAmount).to.equal(amount);
      expect(o.token).to.equal(tokenAddr);
    });

    it("reverts if called by non-admin", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        escrow.connect(outsider).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount })
      ).to.be.revertedWith("Escrow: caller is not admin");
    });

    it("reverts if order already exists", async function () {
      const amount = ethers.parseEther("1");
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount });
      await expect(
        escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount })
      ).to.be.revertedWith("Escrow: order already exists");
    });

    it("reverts if CELO amount does not match", async function () {
      const amount = ethers.parseEther("1");
      await expect(
        escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Escrow: CELO amount mismatch");
    });
  });

  // ─── approveStage + sellerWithdraw ───────────────────────────

  describe("3-stage release with CELO", function () {
    const amount = ethers.parseEther("10");

    beforeEach(async function () {
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount });
    });

    it("stage 1 credits 30% and seller can withdraw", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      expect(await escrow.getSellerClaimable(ORDER_ID)).to.equal(ethers.parseEther("3"));

      const before = await ethers.provider.getBalance(seller.address);
      const tx = await escrow.connect(seller).sellerWithdraw(ORDER_ID);
      const receipt = await tx.wait();
      const gas = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(seller.address);
      expect(after - before + gas).to.equal(ethers.parseEther("3"));
    });

    it("stage 2 credits additional 20%", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      await escrow.connect(seller).sellerWithdraw(ORDER_ID);
      await escrow.connect(admin).approveStage(ORDER_ID, 2);
      expect(await escrow.getSellerClaimable(ORDER_ID)).to.equal(ethers.parseEther("2"));
    });

    it("stage 3 credits remaining 50% and closes order", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      await escrow.connect(admin).approveStage(ORDER_ID, 2);
      await escrow.connect(admin).approveStage(ORDER_ID, 3);

      const o = await escrow.getOrder(ORDER_ID);
      expect(o.active).to.be.false;
      expect(o.stageApproved).to.equal(3);
      expect(await escrow.getSellerClaimable(ORDER_ID)).to.equal(ethers.parseEther("10"));
    });

    it("full 3-stage flow pays seller entire amount", async function () {
      const before = await ethers.provider.getBalance(seller.address);

      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      const tx1 = await escrow.connect(seller).sellerWithdraw(ORDER_ID);
      const r1 = await tx1.wait();

      await escrow.connect(admin).approveStage(ORDER_ID, 2);
      const tx2 = await escrow.connect(seller).sellerWithdraw(ORDER_ID);
      const r2 = await tx2.wait();

      await escrow.connect(admin).approveStage(ORDER_ID, 3);
      const tx3 = await escrow.connect(seller).sellerWithdraw(ORDER_ID);
      const r3 = await tx3.wait();

      const gas = (r1.gasUsed * r1.gasPrice) + (r2.gasUsed * r2.gasPrice) + (r3.gasUsed * r3.gasPrice);
      const after = await ethers.provider.getBalance(seller.address);
      expect(after - before + gas).to.equal(amount);
    });

    it("reverts if stages approved out of order", async function () {
      await expect(escrow.connect(admin).approveStage(ORDER_ID, 2)).to.be.revertedWith("Escrow: stages must be approved in order");
    });

    it("reverts if non-seller tries to withdraw", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      await expect(escrow.connect(outsider).sellerWithdraw(ORDER_ID)).to.be.revertedWith("Escrow: caller is not the seller");
    });

    it("reverts withdraw when nothing is claimable", async function () {
      await expect(escrow.connect(seller).sellerWithdraw(ORDER_ID)).to.be.revertedWith("Escrow: nothing to withdraw");
    });
  });

  // ─── refundBuyer ─────────────────────────────────────────────

  describe("refundBuyer", function () {
    const amount = ethers.parseEther("10");

    beforeEach(async function () {
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount });
    });

    it("refunds full amount to buyer when no stages approved", async function () {
      const before = await ethers.provider.getBalance(buyer.address);
      await escrow.connect(admin).refundBuyer(ORDER_ID);
      const after = await ethers.provider.getBalance(buyer.address);
      expect(after - before).to.equal(amount);
    });

    it("refunds only unapproved portion after stage 1", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      const before = await ethers.provider.getBalance(buyer.address);
      await escrow.connect(admin).refundBuyer(ORDER_ID);
      const after = await ethers.provider.getBalance(buyer.address);
      expect(after - before).to.equal(ethers.parseEther("7")); // 70% back to buyer
    });

    it("reverts double refund", async function () {
      await escrow.connect(admin).refundBuyer(ORDER_ID);
      await expect(escrow.connect(admin).refundBuyer(ORDER_ID)).to.be.revertedWith("Escrow: already refunded");
    });
  });

  // ─── dispute flow ─────────────────────────────────────────────

  describe("dispute and resolution", function () {
    const amount = ethers.parseEther("10");

    beforeEach(async function () {
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, ethers.ZeroAddress, amount, { value: amount });
    });

    it("buyer can open a dispute", async function () {
      await escrow.connect(buyer).openDispute(ORDER_ID);
      const o = await escrow.getOrder(ORDER_ID);
      expect(o.disputed).to.be.true;
    });

    it("disputed order blocks further stage approvals", async function () {
      await escrow.connect(buyer).openDispute(ORDER_ID);
      await expect(escrow.connect(admin).approveStage(ORDER_ID, 1)).to.be.revertedWith("Escrow: order is disputed");
    });

    it("admin resolves dispute — splits funds correctly", async function () {
      await escrow.connect(buyer).openDispute(ORDER_ID);

      const sellerShare = ethers.parseEther("4");
      const buyerShare  = ethers.parseEther("6");

      const buyerBefore  = await ethers.provider.getBalance(buyer.address);
      await escrow.connect(admin).resolveDispute(ORDER_ID, sellerShare);
      const buyerAfter   = await ethers.provider.getBalance(buyer.address);

      expect(buyerAfter - buyerBefore).to.equal(buyerShare);
      expect(await escrow.getSellerClaimable(ORDER_ID)).to.equal(sellerShare);
    });

    it("outsider cannot open a dispute", async function () {
      await expect(escrow.connect(outsider).openDispute(ORDER_ID)).to.be.revertedWith("Escrow: not authorized");
    });
  });

  // ─── ERC-20 full flow ─────────────────────────────────────────

  describe("ERC-20 full flow", function () {
    const amount = ethers.parseEther("6");

    beforeEach(async function () {
      const escrowAddr = await escrow.getAddress();
      await mockToken.connect(admin).approve(escrowAddr, amount);
      await escrow.connect(admin).lockFunds(ORDER_ID, buyer.address, seller.address, await mockToken.getAddress(), amount);
    });

    it("pays seller correct ERC-20 amounts across all 3 stages", async function () {
      await escrow.connect(admin).approveStage(ORDER_ID, 1);
      await escrow.connect(seller).sellerWithdraw(ORDER_ID);

      await escrow.connect(admin).approveStage(ORDER_ID, 2);
      await escrow.connect(seller).sellerWithdraw(ORDER_ID);

      await escrow.connect(admin).approveStage(ORDER_ID, 3);
      await escrow.connect(seller).sellerWithdraw(ORDER_ID);

      expect(await mockToken.balanceOf(seller.address)).to.equal(amount);
      expect(await mockToken.balanceOf(await escrow.getAddress())).to.equal(0);
    });
  });
});
