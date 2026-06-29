const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying VendlyEscrow with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "CELO");

  const VendlyEscrow = await ethers.getContractFactory("VendlyEscrow");
  const escrow = await VendlyEscrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("VendlyEscrow deployed to:", address);
  console.log("Admin (deployer):", deployer.address);
  console.log("\nAdd to your .env:");
  console.log(`ESCROW_CONTRACT_ADDRESS=${address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
