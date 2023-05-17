import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function view_user_credit() {
  const title_registry = await ethers.getContract('TitleRegistry');
  const procceds = await title_registry.getProceeds(
    '0x8bE3e5Ce5608A7356432F39cBc8BD15AA993c698'
  );
  // 0x8063cC5B2105f7a740B539c06F5bEBe921D7d9b2
  // 0x8bE3e5Ce5608A7356432F39cBc8BD15AA993c698
  await procceds;

  if (procceds) {
    console.log(ethers.utils.formatEther(procceds));
  }

  // if ((network.config.chainId = 5)) {
  //   await moveBlocks(2, 1000);
  // }
}

view_user_credit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
