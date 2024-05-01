import chalk from "chalk";
import { config as dotenvConfig } from "dotenv";
import { ContractTransactionResponse } from "ethers";
import type { DeployFunction, DeployResult } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";
import { resolve } from "path";

import { preDeploy } from "../utils/contracts";
import { verifyContract } from "../utils/verify";

const dotenvConfigPath: string = process.env.DOTENV_CONFIG_PATH || "./.env";
dotenvConfig({ path: resolve(process.cwd(), dotenvConfigPath) });

const EAS_ADDRESS = process.env.SCROLL_SEPOLIA_EAS_ADDRESS;
if (typeof EAS_ADDRESS === "undefined") {
  console.log(`SCROLL_SEPOLIA_EAS_ADDRESS must be a defined environment variable`);
}
// const SCROLL_SEPOLIA_EAS_ADDRESS = "0xaEF4103A04090071165F78D45D83A0C0782c2B2a";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, getChainId, deployments } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  const badgeDeployment = await deployments.get("ScrollBadgeLevelsScrolly");
  const scrollBadgeLevelsScrolly = await hre.ethers.getContractAt(
    "ScrollBadgeLevelsScrolly",
    badgeDeployment.address
  );

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

  // Set permissions

  console.log(
    " 📄 Toogle attester for ",
    chalk.greenBright(deployResult.address),
    "on badge:",
    chalk.cyan(await scrollBadgeLevelsScrolly.getAddress())
  );

  // Toogle attesterProxy on badger
  const tx1: ContractTransactionResponse = await scrollBadgeLevelsScrolly.toggleAttester(
    deployResult.address,
    true
  );

  console.log("(tx:", tx1.hash);

  console.log(
    " 📄 Toogle attester for ",
    chalk.greenBright(deployer),
    "on proxy:",
    chalk.cyan(deployResult.address)
  );

  // Toogle deployer on attesterProxy
  const attasterProxy = await hre.ethers.getContractAt("AttesterProxy", deployResult.address);
  const tx2: ContractTransactionResponse = await attasterProxy.toggleAttester(deployer, true);

  console.log("(tx:", tx2.hash);
};

export default func;
func.id = "deploy_attesterProxy";
func.tags = ["AttesterProxy"];
