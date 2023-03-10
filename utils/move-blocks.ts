import { network } from "hardhat";

export function sleep(timeInMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

export async function moveBlocks(amount: number, sleepAmount: number = 0) {
  console.log("Minando bloques...");
  for (let index = 0; index < amount; index++) {
    await network.provider.request({
      method: "evm_mine",
      params: [],
    });
    if (sleepAmount) {
      console.log(`Durmiendo por ${sleepAmount}`);
      await sleep(sleepAmount);
    }
  }

  console.log(`Se minaron ${amount} bloques`);
}
