export interface networkConfigItem {
  name?: string;
  subscriptionId?: string;
  keepersUpdateInterval?: string;
  raffleEntranceFee?: string;
  callbackGasLimit?: string;
  vrfCoordinatorV2?: string;
  gasLane?: string;
  ethUsdPriceFeed?: string;
  mintFee?: string;
}

export interface networkConfigInfo {
  [key: number]: networkConfigItem;
}

export const networkConfig: networkConfigInfo = {
  31337: {
    name: "localhost",
    subscriptionId: "588",
    gasLane:
      "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: "100000000000000000", // 0.1 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
  5: {
    name: "goerli",
    subscriptionId: "588",
    gasLane:
      "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
    keepersUpdateInterval: "30",
    raffleEntranceFee: "100000000000000000", // 0.1 ETH
    callbackGasLimit: "500000", // 500,000 gas
  },
  1: {
    name: "mainnet",
    keepersUpdateInterval: "30",
  },
};

export const developmentChains = ["hardhat", "localhost"];
export const VERIFICATION_BLOCK_CONFIRMATIONS = 6;
export const frontEndContractsFile =
  "../title-registry-app-v2/constants/networkMapping.json";
// export const frontEndContractsFile2 =
//     "../nextjs-nft-marketplace-thegraph-fcc/constants/networkMapping.json"
export const frontEndAbiLocation = "../title-registry-app-v2/constants/";
// export const frontEndAbiLocation2 =
//     "../nextjs-nft-marketplace-thegraph-fcc/constants/"
