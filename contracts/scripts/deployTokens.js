const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying mock stablecoins with account:", deployer.address);

  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const supply = ethers.parseEther("10000000"); // 10 million each

  const usdc = await MockERC20.deploy("USD Coin", "USDC", supply);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("MockUSDC deployed to:", usdcAddress);

  const usdt = await MockERC20.deploy("Tether USD", "USDT", supply);
  await usdt.waitForDeployment();
  const usdtAddress = await usdt.getAddress();
  console.log("MockUSDT deployed to:", usdtAddress);

  const cusd = await MockERC20.deploy("Celo Dollar", "cUSD", supply);
  await cusd.waitForDeployment();
  const cusdAddress = await cusd.getAddress();
  console.log("MockcUSD deployed to:", cusdAddress);

  console.log("\nAdd to your backend .env:");
  console.log(`CUSD_ADDRESS=${cusdAddress}`);
  console.log(`USDC_ADDRESS=${usdcAddress}`);
  console.log(`USDT_ADDRESS=${usdtAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
