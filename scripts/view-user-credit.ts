import { ethers, network } from 'hardhat';
import { moveBlocks } from '../utils/move-blocks';

async function view_user_credit() {
	// const requested_property: string = await title_registry.viewRequest(
	//   '947942246732486'
	// );
	// const signer = await ethers.getSigner(
	//   '0x8063cC5B2105f7a740B539c06F5bEBe921D7d9b2'
	// );

	const title_registry = await ethers.getContract('TitleRegistry');

	// const PRICE = ethers.utils
	//   .parseEther('0.001')

	const procceds = await title_registry.getProcceds(
		'0x8063cC5B2105f7a740B539c06F5bEBe921D7d9b2'
	);
	// 0x8063cC5B2105f7a740B539c06F5bEBe921D7d9b2
	// 0x8bE3e5Ce5608A7356432F39cBc8BD15AA993c698
	await procceds.wait();

	if (procceds) {
		console.log(procceds);
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
