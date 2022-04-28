import { notFalsyOrZeroAddress } from './../../helpers/misc-utils';
import { task } from 'hardhat/config';
import { deployStakeUIHelper } from '../../helpers/contracts-deployments';
import { eContractid, eNetwork, ICommonConfiguration } from '../../helpers/types';
import { getStarlayOracle } from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';

task(`deploy-${eContractid.StakeUIHelper}`, `Deploys the StakeUIHelper contract`)
  .addFlag('verify', 'Verify StakeUIHelper contract via Etherscan API.')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    if (!localBRE.network.config.chainId) {
      throw new Error('INVALID_CHAIN_ID');
    }
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const {
      ReserveAssets,
      StakedLay,
      ProtocolGlobalParams: { UsdAddress },
    } = poolConfig as ICommonConfiguration;
    const oracle = await getStarlayOracle();
    const assets = getParamPerNetwork(ReserveAssets, network);
    const lay = assets['LAY'];
    const stkLay = getParamPerNetwork(StakedLay, network);
    console.log(`\n- StakeUIHelper oracle: ${oracle.address}`);
    console.log(`\n- StakeUIHelper lay: ${lay}`);
    console.log(`\n- StakeUIHelper stkLay: ${stkLay}`);
    console.log(`\n- StakeUIHelper usd: ${UsdAddress}`);
    console.log(`\n- StakeUIHelper deployment`);

    if (!notFalsyOrZeroAddress(oracle.address)) {
      throw new Error('oracle address is not defined');
    }
    if (!notFalsyOrZeroAddress(lay)) {
      throw new Error('lay address is not defined');
    }
    if (!notFalsyOrZeroAddress(stkLay)) {
      throw new Error('stkLay address is not defined');
    }
    if (!notFalsyOrZeroAddress(UsdAddress)) {
      throw new Error('UsdAddress address is not defined');
    }

    const StakeUIHelper = await deployStakeUIHelper([oracle.address, lay, stkLay, UsdAddress]);

    console.log('StakeUIHelper deployed :', StakeUIHelper.address);
    console.log(`\tFinished StakeUIHelper deployment`);
  });
