import {
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-hardhat-config"
import verify from "../utils/verify"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const deployTitleSystem: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const accounts = await ethers.getSigners() // tambien se podria hacer con getNamedAccounts
    const deployer =await accounts[0].getAddress()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS

    log("----------------------------------------------------")

    const args: any[] = []
    const titleRegistry = await deploy("TitleRegistry", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })
    // Verificar el despliegue
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("verificando...")
        await verify(titleRegistry.address, args)
    }

    log("----------------------------------------------------")
}

export default deployTitleSystem
deployTitleSystem.tags = ["all", "titleregistry"]
