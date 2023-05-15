import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function update_title_registry() {
  // const requested_property: string = await title_registry.viewRequest(
  //   '947942246732486'
  // );
  const signer = await ethers.getSigner(
    '0x8063cC5B2105f7a740B539c06F5bEBe921D7d9b2'
  );

  const title_registry = await ethers.getContract('TitleRegistry', signer);

  const PRICE = ethers.utils
    .parseEther('0.001')

  const updated_property = await title_registry.updateTitleRegistry(
    '947942246732486',
    PRICE
  );

  await updated_property.wait();

  if (updated_property) {
    console.log(updated_property);
  }

  if ((network.config.chainId = 5)) {
    await moveBlocks(2, 1000);
  }
}

update_title_registry()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
