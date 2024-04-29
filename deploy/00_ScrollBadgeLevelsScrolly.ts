import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { preDeploy } from "../utils/contracts";
import { verifyContract } from "../utils/verify";

const RESOLVER_ADDRESS = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const ACTIVITY_POINTS_ADDRESS = "0x90F79bf6EB2c4f870365E785982E1f101E93b906";
const DEFAULT_BADGE_URI =
  "https://cyan-passive-guan-475.mypinata.cloud/ipfs/QmPwheo42BLNfmXDss3zz7iAPX7HCzXEsSjSaxMjmrvp3Y/0.png";
const BASE_BADGE_URI =
  "https://cyan-passive-guan-475.mypinata.cloud/ipfs/QmPwheo42BLNfmXDss3zz7iAPX7HCzXEsSjSaxMjmrvp3Y/";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  type ConstructorParams = [string, string, string, string];
  const args: ConstructorParams = [
    RESOLVER_ADDRESS,
    ACTIVITY_POINTS_ADDRESS,
    DEFAULT_BADGE_URI,
    BASE_BADGE_URI,
  ];

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
    const contractPath = `contracts/ScrollBadgeLevelsScrolly.sol:ScrollBadgeLevelsScrolly`;
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
