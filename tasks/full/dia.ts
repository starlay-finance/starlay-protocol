import { PriceAggregatorDiaImpl } from './../../types/PriceAggregatorDiaImpl.d';
import { task } from 'hardhat/config';
import { deployPriceAggregatorDiaImpl } from '../../helpers/contracts-deployments';
import { eNetwork } from '../../helpers/types';
import { ConfigNames } from '../../helpers/configuration';
import { PriceAggregatorDiaImplFactory } from '../../types';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { USD_ADDRESS } from '../../helpers/constants';

task('deploy-dia', 'Deploy dia')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .setAction(async ({ verify }, DRE) => {
    try {
      await DRE.run('set-DRE');
      const network = <eNetwork>DRE.network.name;
      //
      //const aaveOracle = await deployPriceAggregatorDiaImpl(
      //  ['0x1232acd632dd75f874e357c77295da3f5cd7733e', 'USD', 'ETH'],
      //  false
      //);
      //console.log('UiPoolDataProvider deployed at:', aaveOracle.address);
      const dia = PriceAggregatorDiaImplFactory.connect(
        '0x5C56E2a9B5e0d04eA9674984c813D40D1b960d23',
        await getFirstSigner()
      );
      const price = await dia.currentPrice('0x488c6A241A7Ddb7aBa32BDd29BC8C3A186873066');
      console.log(price.toBigInt().toString());
    } catch (error) {
      if (DRE.network.name.includes('tenderly')) {
        const transactionLink = `https://dashboard.tenderly.co/${DRE.config.tenderly.username}/${
          DRE.config.tenderly.project
        }/fork/${DRE.tenderly.network().getFork()}/simulation/${DRE.tenderly.network().getHead()}`;
        console.error('Check tx error:', transactionLink);
      }
      throw error;
    }
  });
