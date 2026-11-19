const { ethers, network } = require("hardhat");

// Real Agent ID registry (SPACE ID Agent ID) on BNB Chain mainnet.
const REAL_REGISTRY = "0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Network: ${network.name} (chainId ${network.config.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} BNB`);

  let registryAddress = process.env.AGENT_ID_REGISTRY || "";
  if (network.config.chainId === 56) {
    registryAddress = REAL_REGISTRY;
    console.log(`Using REAL Agent ID registry: ${registryAddress}`);
  } else if (!registryAddress) {
    const Mock = await ethers.getContractFactory("MockAgentId");
    const mock = await Mock.deploy();
    await mock.waitForDeployment();
    registryAddress = await mock.getAddress();
    console.log(`No registry given - deployed MockAgentId for this network: ${registryAddress}`);
  } else {
    console.log(`Using registry from env: ${registryAddress}`);
  }

  const Farm = await ethers.getContractFactory("SowcialFarm");
  const farm = await Farm.deploy(registryAddress);
  await farm.waitForDeployment();
  const address = await farm.getAddress();
  console.log(`SowcialFarm deployed: ${address}`);
  console.log(`Verify: npx hardhat verify --network ${network.name} ${address} ${registryAddress}`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
