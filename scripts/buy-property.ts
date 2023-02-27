import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function create_regional_admin() {
  const title_registry = await ethers.getContract('TitleRegistry');

  const new_admin = await title_registry.addRegionalAdmin(
    '0x46cB63C2b9D448AFfD4446f80B20b60677c07a5B',
    'Santiago de Surco'
  );

  if (new_admin) {
    console.log('Regional admin created!');
  }

  if ((network.config.chainId = 5)) {
    await moveBlocks(2, 1000);
  }
}

create_regional_admin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
