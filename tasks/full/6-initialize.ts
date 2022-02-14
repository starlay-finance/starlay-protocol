import { task } from 'hardhat/config';
import { exit } from 'process';
import { ConfigNames, getTreasuryAddress, loadPoolConfig } from '../../helpers/configuration';
import { aggregatorProxy, baseTokenAddress } from '../../helpers/constants';
import {
  authorizeWETHGateway,
  deployLendingPoolCollateralManager,
  deployUiIncentiveDataProviderV2,
  deployUiPoolDataProviderV2,
  deployWalletBalancerProvider,
} from '../../helpers/contracts-deployments';
import {
  getLendingPoolAddressesProvider,
  getStarlayProtocolDataProvider,
  getWETHGateway,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { eNetwork, ICommonConfiguration } from '../../helpers/types';

task('full:initialize-lending-pool', 'Initialize lending pool configuration.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    try {
      await localBRE.run('set-DRE');
      const network = <eNetwork>localBRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const {
        LTokenNamePrefix,
        StableDebtTokenNamePrefix,
        VariableDebtTokenNamePrefix,
        SymbolPrefix,
        ReserveAssets,
        ReservesConfig,
        LendingPoolCollateralManager,
        WethGateway,
        IncentivesController,
      } = poolConfig as ICommonConfiguration;

      const reserveAssets = await getParamPerNetwork(ReserveAssets, network);
      const incentivesController = await getParamPerNetwork(IncentivesController, network);
      const addressesProvider = await getLendingPoolAddressesProvider();

      const testHelpers = await getStarlayProtocolDataProvider();

      const admin = await addressesProvider.getPoolAdmin();
      const oracle = await addressesProvider.getPriceOracle();

      if (!reserveAssets) {
        throw 'Reserve assets is undefined. Check ReserveAssets configuration at config directory';
      }

      const treasuryAddress = await getTreasuryAddress(poolConfig);

      await initReservesByHelper(
        ReservesConfig,
        reserveAssets,
        LTokenNamePrefix,
        StableDebtTokenNamePrefix,
        VariableDebtTokenNamePrefix,
        SymbolPrefix,
        admin,
        treasuryAddress,
        incentivesController,
        pool,
        verify
      );
      await configureReservesByHelper(ReservesConfig, reserveAssets, testHelpers, admin);

      let collateralManagerAddress = await getParamPerNetwork(
        LendingPoolCollateralManager,
        network
      );
      if (!notFalsyOrZeroAddress(collateralManagerAddress)) {
        const collateralManager = await deployLendingPoolCollateralManager(verify);
        collateralManagerAddress = collateralManager.address;
      }
      // Seems unnecessary to register the collateral manager in the JSON db

      console.log(
        '\tSetting lending pool collateral manager implementation with address',
        collateralManagerAddress
      );
      await waitForTx(
        await addressesProvider.setLendingPoolCollateralManager(collateralManagerAddress)
      );

      console.log(
        '\tSetting StarlayProtocolDataProvider at AddressesProvider at id: 0x01',
        collateralManagerAddress
      );
      const starlayProtocolDataProvider = await getStarlayProtocolDataProvider();
      await waitForTx(
        await addressesProvider.setAddress(
          '0x0100000000000000000000000000000000000000000000000000000000000000',
          starlayProtocolDataProvider.address
        )
      );

      await deployWalletBalancerProvider(verify);

      const uiPoolDataProvider = await deployUiPoolDataProviderV2(
        aggregatorProxy[localBRE.network.name],
        baseTokenAddress[localBRE.network.name],
        verify
      );
      console.log('UiPoolDataProvider deployed at:', uiPoolDataProvider.address);

      const uiIncentiveDataProvider = await deployUiIncentiveDataProviderV2();
      console.log('UiIncentiveDataProvider deployed at:', uiIncentiveDataProvider.address);

      const lendingPoolAddress = await addressesProvider.getLendingPool();

      let gateWay = getParamPerNetwork(WethGateway, network);
      if (!notFalsyOrZeroAddress(gateWay)) {
        gateWay = (await getWETHGateway()).address;
      }
      console.log('GATEWAY', gateWay);
      await authorizeWETHGateway(gateWay, lendingPoolAddress);
    } catch (err) {
      console.error(err);
      exit(1);
    }
  });
