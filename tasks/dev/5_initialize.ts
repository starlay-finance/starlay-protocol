import { task } from 'hardhat/config';
import { ConfigNames, getTreasuryAddress, loadPoolConfig } from '../../helpers/configuration';
import { ZERO_ADDRESS } from '../../helpers/constants';
import {
  authorizeWETHGateway,
  deployLendingPoolCollateralManager,
  deployMockFlashLoanReceiver,
  deployStarlayProtocolDataProvider,
  deployWalletBalancerProvider,
} from '../../helpers/contracts-deployments';
import {
  getAllMockedTokens,
  getLendingPoolAddressesProvider,
  getWETHGateway,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork, insertContractAddressInDb } from '../../helpers/contracts-helpers';
import { configureReservesByHelper, initReservesByHelper } from '../../helpers/init-helpers';
import { filterMapBy, notFalsyOrZeroAddress, waitForTx } from '../../helpers/misc-utils';
import { getAllTokenAddresses } from '../../helpers/mock-helpers';
import { eContractid, eNetwork, tEthereumAddress } from '../../helpers/types';

task('dev:initialize-lending-pool', 'Initialize lending pool configuration.')
  .addFlag('verify', 'Verify contracts at Etherscan')
  .addParam('pool', `Pool name to retrieve configuration, supported: ${Object.values(ConfigNames)}`)
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run('set-DRE');
    const network = <eNetwork>localBRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    const {
      LTokenNamePrefix,
      StableDebtTokenNamePrefix,
      VariableDebtTokenNamePrefix,
      SymbolPrefix,
      WethGateway,
      ReservesConfig,
    } = poolConfig;
    const mockTokens = await getAllMockedTokens();
    const allTokenAddresses = getAllTokenAddresses(mockTokens);

    const addressesProvider = await getLendingPoolAddressesProvider();

    const protoPoolReservesAddresses = <{ [symbol: string]: tEthereumAddress }>(
      filterMapBy(allTokenAddresses, (key: string) => !key.includes('UNI_'))
    );

    const testHelpers = await deployStarlayProtocolDataProvider(addressesProvider.address, verify);

    const admin = await addressesProvider.getPoolAdmin();

    const treasuryAddress = await getTreasuryAddress(poolConfig);

    await initReservesByHelper(
      ReservesConfig,
      protoPoolReservesAddresses,
      LTokenNamePrefix,
      StableDebtTokenNamePrefix,
      VariableDebtTokenNamePrefix,
      SymbolPrefix,
      admin,
      treasuryAddress,
      ZERO_ADDRESS,
      pool,
      verify
    );
    await configureReservesByHelper(ReservesConfig, protoPoolReservesAddresses, testHelpers, admin);

    const collateralManager = await deployLendingPoolCollateralManager(verify);
    await waitForTx(
      await addressesProvider.setLendingPoolCollateralManager(collateralManager.address)
    );

    const mockFlashLoanReceiver = await deployMockFlashLoanReceiver(
      addressesProvider.address,
      verify
    );
    await insertContractAddressInDb(
      eContractid.MockFlashLoanReceiver,
      mockFlashLoanReceiver.address
    );

    await deployWalletBalancerProvider(verify);

    await insertContractAddressInDb(eContractid.StarlayProtocolDataProvider, testHelpers.address);

    const lendingPoolAddress = await addressesProvider.getLendingPool();

    let gateway = getParamPerNetwork(WethGateway, network);
    if (!notFalsyOrZeroAddress(gateway)) {
      gateway = (await getWETHGateway()).address;
    }
    await authorizeWETHGateway(gateway, lendingPoolAddress);
  });
