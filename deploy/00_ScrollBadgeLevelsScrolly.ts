import { config as dotenvConfig } from "dotenv";
import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { resolve } from "path";

import { preDeploy } from "../utils/contracts";
import { verifyContract } from "../utils/verify";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(process.cwd(), dotenvConfigPath) });

const RESOLVER_ADDRESS = process.env.RESOLVER_ADDRESS;
if (typeof RESOLVER_ADDRESS === "undefined") {
  console.log(`RESOLVER_ADDRESS must be a defined environment variable`);
}
// const RESOLVER_ADDRESS = "0xd2270b3540FD2220Fa1025414e1625af8B0dd8f3";

const ACTIVITY_POINTS_ADDRESS = process.env.ACTIVITY_POINTS_ADDRESS;
if (typeof ACTIVITY_POINTS_ADDRESS === "undefined") {
  console.log(`ACTIVITY_POINTS_ADDRESS must be a defined environment variable`);
}
// const ACTIVITY_POINTS_ADDRESS = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";

const DEFAULT_BADGE_URI = process.env.DEFAULT_BADGE_URI;
if (typeof DEFAULT_BADGE_URI === "undefined") {
  console.log(`DEFAULT_BADGE_URI must be a defined environment variable`);
}
// const DEFAULT_BADGE_URI =
//   "https://cyan-passive-guan-475.mypinata.cloud/ipfs/QmPwheo42BLNfmXDss3zz7iAPX7HCzXEsSjSaxMjmrvp3Y/0.png";

const BASE_BADGE_URI = process.env.BASE_BADGE_URI;
if (typeof BASE_BADGE_URI === "undefined") {
  console.log(`BASE_BADGE_URI must be a defined environment variable`);
}
// const BASE_BADGE_URI =
//   "https://cyan-passive-guan-475.mypinata.cloud/ipfs/QmPwheo42BLNfmXDss3zz7iAPX7HCzXEsSjSaxMjmrvp3Y/";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  type ConstructorParams = [string, string, string, string];
  const args: ConstructorParams = [
    RESOLVER_ADDRESS || "",
    ACTIVITY_POINTS_ADDRESS || "",
    DEFAULT_BADGE_URI || "",
    BASE_BADGE_URI || "",
  ];

  console.log("deploying with args:", args);
  await preDeploy(deployer, "ScrollBadgeLevelsScrolly");
  const deployResult: DeployResult = await deploy("ScrollBadgeLevelsScrolly", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: args,
    log: true,
    // waitConfirmations: 5,
  });

  // You don't want to verify on localhost
  if (chainId !== "31337" && chainId !== "1337") {
    const contractPath = `contracts/badge/ScrollBadgeLevelsScrolly.sol:ScrollBadgeLevelsScrolly`;
    await verifyContract({
      contractPath: contractPath,
      contractAddress: deployResult.address,
      args: deployResult.args || [],
    });
  }
};

export default func;
func.id = "deploy_scrollBadgeLevelsScrolly";
func.tags = ["ScrollBadgeLevelsScrolly"];
