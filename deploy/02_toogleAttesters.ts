import chalk from "chalk";
import { ContractTransactionResponse } from "ethers";
import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre;
  const { deployer } = await getNamedAccounts();

  const badgeDeployment = await deployments.get("ScrollBadgeLevelsScrolly");
  const scrollBadgeLevelsScrolly = await hre.ethers.getContractAt(
    "ScrollBadgeLevelsScrolly",
    badgeDeployment.address
  );

  const proxyDeployment = await deployments.get("AttesterProxy");
  const attesterProxy = await hre.ethers.getContractAt("AttesterProxy", proxyDeployment.address);

  // Set permissions

  // Toogle attesterProxy on badger
  console.log(
    " 📄 Toogle attesterProxy:",
    chalk.greenBright(proxyDeployment.address),
    "on badge:",
    chalk.cyan(await scrollBadgeLevelsScrolly.getAddress())
  );

  const tx1: ContractTransactionResponse = await scrollBadgeLevelsScrolly.toggleAttester(
    proxyDeployment.address,
    true
  );

  console.log("(tx1:", tx1.hash);

  // Toogle deployer on attesterProxy
  console.log(
    " 📄 Toogle deployer:",
    chalk.greenBright(deployer),
    "on attesterProxy:",
    chalk.cyan(proxyDeployment.address)
  );

  const tx2: ContractTransactionResponse = await attesterProxy.toggleAttester(deployer, true);

  console.log("(tx2:", tx2.hash);
};

export default func;
func.id = "toogle Attesters";
func.tags = ["ScrollBadgeLevelsScrolly"];
