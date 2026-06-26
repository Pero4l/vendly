const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Deploy Reputation Implementation
  console.log("Deploying Reputation implementation...");
  const Reputation = await ethers.getContractFactory("Reputation");
  const reputationImpl = await Reputation.deploy();
  await reputationImpl.waitForDeployment();
  const reputationImplAddress = await reputationImpl.getAddress();
  console.log("Reputation Implementation deployed to:", reputationImplAddress);

  // 2. Deploy Escrow Implementation
  console.log("Deploying Escrow implementation...");
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrowImpl = await Escrow.deploy();
  await escrowImpl.waitForDeployment();
  const escrowImplAddress = await escrowImpl.getAddress();
  console.log("Escrow Implementation deployed to:", escrowImplAddress);

  // 3. Deploy Marketplace Implementation
  console.log("Deploying Marketplace implementation...");
  const Marketplace = await ethers.getContractFactory("Marketplace");
  const marketplaceImpl = await Marketplace.deploy();
  await marketplaceImpl.waitForDeployment();
  const marketplaceImplAddress = await marketplaceImpl.getAddress();
  console.log("Marketplace Implementation deployed to:", marketplaceImplAddress);

  // Note: For UUPS proxy deployments, we would deploy an ERC1967Proxy pointing to the implementation.
  // In a production Hardhat setup, you would typically use '@openzeppelin/hardhat-upgrades'' deployProxy.
  // Here, we initialize the implementation contracts directly for demonstration / deployment.
  console.log("Initializing Reputation...");
  await reputationImpl.initialize(deployer.address);

  console.log("Initializing Escrow...");
  await escrowImpl.initialize(deployer.address);

  console.log("Initializing Marketplace...");
  await marketplaceImpl.initialize(deployer.address, escrowImplAddress);

  // Set roles
  console.log("Setting roles...");
  const MARKETPLACE_ROLE = await escrowImpl.MARKETPLACE_ROLE();
  await escrowImpl.grantRole(MARKETPLACE_ROLE, marketplaceImplAddress);

  console.log("--- Deployment Completed Successfully ---");
  console.log("Reputation:", reputationImplAddress);
  console.log("Escrow:", escrowImplAddress);
  console.log("Marketplace:", marketplaceImplAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
