import { config as dotenvConfig } from "dotenv";
import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { resolve } from "path";

import { preDeploy } from "../utils/contracts";
import { verifyContract } from "../utils/verify";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(process.cwd(), dotenvConfigPath) });

const EAS_ADDRESS = process.env.SCROLL_EAS_ADDRESS;
if (typeof EAS_ADDRESS === "undefined") {
  console.log(`SCROLL_EAS_ADDRESS must be a defined environment variable`);
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  type ConstructorParams = [string];
  const args: ConstructorParams = [EAS_ADDRESS || ""];

  console.log("deploying with args:", args);
  await preDeploy(deployer, "AttesterProxy");
  const deployResult: DeployResult = await deploy("AttesterProxy", {
    // Learn more about args here: https://www.npmjs.com/package/hardhat-deploy#deploymentsdeploy
    from: deployer,
    args: args,
    log: true,
    // waitConfirmations: 5,
  });

  // You don't want to verify on localhost
  if (chainId !== "31337" && chainId !== "1337") {
    const contractPath = `contracts/utils/AttesterProxy.sol:AttesterProxy`;
    await verifyContract({
      contractPath: contractPath,
      contractAddress: deployResult.address,
      args: deployResult.args || [],
    });
  }
};

export default func;
func.id = "deploy_attesterProxy";
func.tags = ["ScrollBadgeLevelsScrolly"];
