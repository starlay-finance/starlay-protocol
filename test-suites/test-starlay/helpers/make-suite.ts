import chai from 'chai';
// @ts-ignore
import bignumberChai from 'chai-bignumber';
import { solidity } from 'ethereum-waffle';
import { Signer } from 'ethers';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import {
  getFlashLiquidationAdapter,
  getLendingPool,
  getLendingPoolAddressesProvider,
  getLendingPoolAddressesProviderRegistry,
  getLendingPoolConfiguratorProxy,
  getLToken,
  getMintableERC20,
  getParaSwapLiquiditySwapAdapter,
  getPriceOracle,
  getStarlayProtocolDataProvider,
  getUniswapLiquiditySwapAdapter,
  getUniswapRepayAdapter,
  getWASTRMocked,
  getWETHGateway,
} from '../../../helpers/contracts-getters';
import { getEthersSigners, getParamPerNetwork } from '../../../helpers/contracts-helpers';
import { DRE, evmRevert, evmSnapshot } from '../../../helpers/misc-utils';
import { usingTenderly } from '../../../helpers/tenderly-utils';
import { eNetwork, tEthereumAddress } from '../../../helpers/types';
import { StarlayConfig } from '../../../markets/starlay';
import { FlashLiquidationAdapter, WASTRMocked } from '../../../types';
import { LendingPool } from '../../../types/LendingPool';
import { LendingPoolAddressesProvider } from '../../../types/LendingPoolAddressesProvider';
import { LendingPoolAddressesProviderRegistry } from '../../../types/LendingPoolAddressesProviderRegistry';
import { LendingPoolConfigurator } from '../../../types/LendingPoolConfigurator';
import { LToken } from '../../../types/LToken';
import { MintableERC20 } from '../../../types/MintableERC20';
import { ParaSwapLiquiditySwapAdapter } from '../../../types/ParaSwapLiquiditySwapAdapter';
import { PriceOracle } from '../../../types/PriceOracle';
import { StarlayProtocolDataProvider } from '../../../types/StarlayProtocolDataProvider';
import { UniswapLiquiditySwapAdapter } from '../../../types/UniswapLiquiditySwapAdapter';
import { UniswapRepayAdapter } from '../../../types/UniswapRepayAdapter';
import { WETHGateway } from '../../../types/WETHGateway';
import { almostEqual } from './almost-equal';

chai.use(bignumberChai());
chai.use(almostEqual());
chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  pool: LendingPool;
  configurator: LendingPoolConfigurator;
  oracle: PriceOracle;
  helpersContract: StarlayProtocolDataProvider;
  weth: WASTRMocked;
  lWETH: LToken;
  dai: MintableERC20;
  lDai: LToken;
  usdc: MintableERC20;
  lay: MintableERC20;
  addressesProvider: LendingPoolAddressesProvider;
  uniswapLiquiditySwapAdapter: UniswapLiquiditySwapAdapter;
  uniswapRepayAdapter: UniswapRepayAdapter;
  registry: LendingPoolAddressesProviderRegistry;
  wethGateway: WETHGateway;
  flashLiquidationAdapter: FlashLiquidationAdapter;
  paraswapLiquiditySwapAdapter: ParaSwapLiquiditySwapAdapter;
}

let buidlerevmSnapshotId: string = '0x1';
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  pool: {} as LendingPool,
  configurator: {} as LendingPoolConfigurator,
  helpersContract: {} as StarlayProtocolDataProvider,
  oracle: {} as PriceOracle,
  weth: {} as WASTRMocked,
  lWETH: {} as LToken,
  dai: {} as MintableERC20,
  lDai: {} as LToken,
  usdc: {} as MintableERC20,
  lay: {} as MintableERC20,
  addressesProvider: {} as LendingPoolAddressesProvider,
  uniswapLiquiditySwapAdapter: {} as UniswapLiquiditySwapAdapter,
  uniswapRepayAdapter: {} as UniswapRepayAdapter,
  flashLiquidationAdapter: {} as FlashLiquidationAdapter,
  paraswapLiquiditySwapAdapter: {} as ParaSwapLiquiditySwapAdapter,
  registry: {} as LendingPoolAddressesProviderRegistry,
  wethGateway: {} as WETHGateway,
} as TestEnv;

export async function initializeMakeSuite() {
  const [_deployer, ...restSigners] = await getEthersSigners();
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };

  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }
  testEnv.deployer = deployer;
  testEnv.pool = await getLendingPool();

  testEnv.configurator = await getLendingPoolConfiguratorProxy();

  testEnv.addressesProvider = await getLendingPoolAddressesProvider();

  if (process.env.FORK) {
    testEnv.registry = await getLendingPoolAddressesProviderRegistry(
      getParamPerNetwork(StarlayConfig.ProviderRegistry, process.env.FORK as eNetwork)
    );
  } else {
    testEnv.registry = await getLendingPoolAddressesProviderRegistry();
    testEnv.oracle = await getPriceOracle();
  }

  testEnv.helpersContract = await getStarlayProtocolDataProvider();

  const allTokens = await testEnv.helpersContract.getAllLTokens();
  const lDaiAddress = allTokens.find((lToken) => lToken.symbol === 'lDAI')?.tokenAddress;
  const lWETHAddress = allTokens.find((lToken) => lToken.symbol === 'lWETH')?.tokenAddress;

  const reservesTokens = await testEnv.helpersContract.getAllReservesTokens();

  const daiAddress = reservesTokens.find((token) => token.symbol === 'DAI')?.tokenAddress;
  const usdcAddress = reservesTokens.find((token) => token.symbol === 'USDC')?.tokenAddress;
  const layAddress = reservesTokens.find((token) => token.symbol === 'LAY')?.tokenAddress;
  const wethAddress = reservesTokens.find((token) => token.symbol === 'WETH')?.tokenAddress;

  if (!lDaiAddress || !lWETHAddress) {
    process.exit(1);
  }
  if (!daiAddress || !usdcAddress || !layAddress || !wethAddress) {
    process.exit(1);
  }

  testEnv.lDai = await getLToken(lDaiAddress);
  testEnv.lWETH = await getLToken(lWETHAddress);

  testEnv.dai = await getMintableERC20(daiAddress);
  testEnv.usdc = await getMintableERC20(usdcAddress);
  testEnv.lay = await getMintableERC20(layAddress);
  testEnv.weth = await getWASTRMocked(wethAddress);
  testEnv.wethGateway = await getWETHGateway();

  testEnv.uniswapLiquiditySwapAdapter = await getUniswapLiquiditySwapAdapter();
  testEnv.uniswapRepayAdapter = await getUniswapRepayAdapter();
  testEnv.flashLiquidationAdapter = await getFlashLiquidationAdapter();

  testEnv.paraswapLiquiditySwapAdapter = await getParaSwapLiquiditySwapAdapter();
}

const setSnapshot = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  if (usingTenderly()) {
    setBuidlerevmSnapshotId((await hre.tenderlyNetwork.getHead()) || '0x1');
    return;
  }
  setBuidlerevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  if (usingTenderly()) {
    await hre.tenderlyNetwork.setHead(buidlerevmSnapshotId);
    return;
  }
  await evmRevert(buidlerevmSnapshotId);
};

export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}
