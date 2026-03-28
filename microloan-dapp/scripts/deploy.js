// deploy.js (CommonJS compatible)

const hre = require("hardhat");

async function main() {
  const Microloan = await hre.ethers.getContractFactory("Microloan");
  const microloan = await Microloan.deploy();

  await microloan.deployed();

  console.log("Microloan deployed to:", microloan.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
