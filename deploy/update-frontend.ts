import {
    frontEndContractsFile,
    frontEndAbiLocation,
} from "../helper-hardhat-config"
import "dotenv/config"
import fs from "fs"
import { network, ethers } from "hardhat"
import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const updateFrontEnd: DeployFunction = async function (
    hre: HardhatRuntimeEnvironment
) {
    if (process.env.UPDATE_FRONT_END) {
        console.log(`Actualizando FrontEnd....  `)
        await updateContractAddresses()
        await updateABI()
    }
}

async function updateABI() {
    const titleRegistry = await ethers.getContract("TitleRegistry")
    fs.writeFileSync(
        `${frontEndAbiLocation}TitleRegistry.json`,
        titleRegistry.interface.format(ethers.utils.FormatTypes.json).toString()
    )

    // const basicNft = await ethers.getContract("BasicNft")
    // fs.writeFileSync(
    //     `${frontEndAbiLocation}BasicNft.json`,
    //     basicNft.interface.format(ethers.utils.FormatTypes.json).toString()
    // )
}

async function updateContractAddresses() {
    const chainId = network.config.chainId!.toString()
    const titleregistry = await ethers.getContract("TitleRegistry")
    const contractAddresses = JSON.parse(
        fs.readFileSync(frontEndContractsFile, "utf8")
    )
    if (chainId in contractAddresses) {
        if (
            !contractAddresses[chainId]["TitleRegistry"].includes(
                titleregistry.address
            )
        ) {
            contractAddresses[chainId]["TitleRegistry"].push(
                titleregistry.address
            )
        }
    } else {
        contractAddresses[chainId] = { TitleRegistry: [titleregistry.address] }
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}

export default updateFrontEnd
updateFrontEnd.tags = ["all", "frontend"]
