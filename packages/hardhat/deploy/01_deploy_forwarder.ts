import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployForwarder: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("Forwarder", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  const forwarder = await hre.ethers.getContract<Contract>("Forwarder", deployer);
  console.log("✅ Forwarder deployed at:", await forwarder.getAddress());
};

export default deployForwarder;

deployForwarder.tags = ["Forwarder"];
