import { ethers } from "hardhat";

import { verifyContract } from "../utils/verify";

async function main() {
  const { chainId } = await ethers.provider.getNetwork();

  const contractName = "ScrollBadgeLevelsScrolly";
  const contractPath = `contracts/badge/${contractName}.sol:${contractName}`;
  const contractAddress = "0x7653f0c782f44de7ead7a65e91cf4bcb48679b09";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const args: any[] = [
    "0xd2270b3540FD2220Fa1025414e1625af8B0dd8f3",
    "0x4A82158ff4B0504F3DB4c7555FfB6298452985E2",
    "https://scrolly-badge-server-alderian.vercel.app/api/badge/token",
    "https://scrolly-badge-server-alderian.vercel.app/api/badge/token?level=",
  ];

  // You don't want to verify on localhost
  if (chainId != 31337n && chainId != 1337n) {
    await verifyContract({
      contractPath,
      contractAddress,
      args,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
