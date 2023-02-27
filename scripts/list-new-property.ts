import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function list_new_property() {
  const PRICE = ethers.utils.parseEther('0.1');

  const signer = await ethers.getSigner(
    '0x46cB63C2b9D448AFfD4446f80B20b60677c07a5B'
  );
  const title_registry = await ethers.getContract('TitleRegistry', signer);
  const new_property = await title_registry.registerTitle(
    'Lima',
    'Santiago de Surco',
    'Surco Viejo',
    20211456990,
    '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    PRICE
  );

  await new_property.wait();

  if (new_property) {
    console.log('New property listed!');
  }

  if ((network.config.chainId = 5)) {
    await moveBlocks(2, 1000);
  }
}

list_new_property()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
