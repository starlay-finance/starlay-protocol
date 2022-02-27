import { ERC20Factory } from '../../types/ERC20Factory';
import BigNumber from 'bignumber.js';
import { parseEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  getLendingPool,
  getLendingPoolConfiguratorProxy,
  getStarlayOracle,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { getEthersSigners } from '../../helpers/contracts-helpers';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';
import { getFirstSigner } from '../../helpers/contracts-getters';
import { LendingPoolFactory, StarlayProtocolDataProviderFactory } from '../../types';

task('lq-tst', 'Excute Liquidation').setAction(async ({}, DRE) => {
  await DRE.run('set-DRE');
  const network = <eNetwork>DRE.network.name;
  const poolConfig = loadPoolConfig(ConfigNames.Starlay);
  const {
    ProtocolGlobalParams: { UsdAddress },
    ReserveAssets,
    FallbackOracle,
  } = poolConfig as ICommonConfiguration;
  const configurator = await getLendingPoolConfiguratorProxy(
    '0x9A1760cEF7780B233E6b65D03Db2FCd652893f45'
  );
  const liquidator = (await getEthersSigners())[1];

  const pool = LendingPoolFactory.connect('0x8022327a333eAeFaD46A723CDcA1aeFdA12afA53', liquidator);
  const usdc = '0x458db3bEf6ffC5212f9359bbDAeD0D5A58129397';
  const wsdn = '0x7cA69766F4be8Ec93dD01E1d571e64b867455e58';
  const weth = '0x72fE832eB0452285e91CA9F46B85229A5107CeE8';
  const lusdc = '0xF4D80e698D40Aae4F8486E59D3A52BB4b637e867';
  const target = '0x50414Ac6431279824df9968855181474c919a94B';
  const amountToLiquidate = parseEther('100000');
  const lTokenInstance = await ERC20Factory.connect(lusdc, liquidator);
  const amountBefore = await lTokenInstance.balanceOf(await liquidator.getAddress());
  console.log('users config', await pool.getUserConfiguration(target));
  console.log('users config', await pool.getUserConfiguration(await liquidator.getAddress()));
  console.log(
    'health factor:',
    await (await pool.getUserAccountData(target)).healthFactor.toString()
  );
  console.log('ltoken before amount:', amountBefore.toString());
  const tx = await pool
    .connect(liquidator)
    .liquidationCall(usdc, weth, target, amountToLiquidate, true);

  const amountAfter = await lTokenInstance.balanceOf(await liquidator.getAddress());
  console.log('ltoken after amount:', amountAfter.toString());
});
