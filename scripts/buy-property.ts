import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function create_regional_admin() {
  // const requested_property: string = await title_registry.viewRequest(
  //   '947942246732486'
  // );
  const signer = await ethers.getSigner(
    '0x8bE3e5Ce5608A7356432F39cBc8BD15AA993c698'
  );

  const title_registry = await ethers.getContract('TitleRegistry', signer);

  const PRICE = ethers.utils
    .parseEther('0.001')
    .add(ethers.utils.parseEther('0.0001'));

  const bought_property = await title_registry.buyProperty('947942246732486', {
    value: PRICE,
  });

  await bought_property.wait();

  if (bought_property) {
    console.log(bought_property);
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
