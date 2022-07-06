import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  deployGenericLTokenRev2Impl,
  deployGenericLTokenRev2ImplWithSigner,
} from '../../helpers/contracts-deployments';
import {
  getFirstSigner,
  getLendingPoolConfiguratorProxy,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { getLTokenExtraParams } from '../../helpers/init-helpers';
import { setDRE } from '../../helpers/misc-utils';
import { eContractid, eNetwork, SymbolMap } from '../../helpers/types';
import { LendingPoolConfigurator, LTokenFactory, LTokenRev2Factory } from '../../types';

const SUPPORTED_NETWORK = ['astar', 'shiden', 'localhost'] as const;
type SupportedNetwork = typeof SUPPORTED_NETWORK[number];
type EthereumAddress = `0x${string}`;

type Addresses = {
  StarlayProtocolDataProvider: EthereumAddress;
  LendingPoolConfigurator: EthereumAddress;
  IncentiveController: EthereumAddress;
  Voter: EthereumAddress | '';
};
type Constants = {
  [key in SupportedNetwork]?: Addresses;
};
const astar: Addresses = {
  StarlayProtocolDataProvider: '0x5BF9B2644E273D92ff1C31A83476314c95953133',
  LendingPoolConfigurator: '0xa1c2ED9e0d09f5e441aC9C44AFa308D38dAf463c',
  IncentiveController: '0x97Ab79B80E8904214413D8219E8B04373D1030AD',
  Voter: '0xB45Ae34e16D97D87c021DAf03a15142935cFB177',
};
const shiden: Addresses = {
  StarlayProtocolDataProvider: '0x3fD308785Cf41F30993038c145cE50b7fF677a71',
  LendingPoolConfigurator: '0x1aE33143380567fe1246bE4Be5008B7bFa25790A',
  IncentiveController: '0xD9F3bbC743b7AF7E1108653Cd90E483C03D6D699',
  Voter: '0x04f6A8eF63CC99Db088e036CeC627cea9941E250',
};
const CONSTANTS: Constants = {
  astar: astar,
  shiden: shiden,
};

type LTokenInfo = {
  name: string;
  symbol: string;
  decimals: number;
  revision: number;
  underlyingAsset: string;
  pool: string;
  incentivesController: string;
  treasury: string;
  scaledTotalSupply: string;
};
const getCurrentLTokens = async (params: {
  ethers: HardhatRuntimeEnvironment['ethers'];
  ltokenProxies: { symbol: string; addr: string }[];
  symbolAndAddrs: SymbolMap<string>;
  isRev2?: boolean;
}): Promise<{ [key in string]: LTokenInfo }> => {
  const {
    ethers: { provider, utils },
    ltokenProxies,
    symbolAndAddrs,
    isRev2,
  } = params;
  const result: { [key in string]: LTokenInfo } = {};
  for await (const item of ltokenProxies) {
    // const asset = symbolAndAddrs[item.symbol]
    console.log(`> symbol: ${item.symbol} / ltoken: ${item.addr}`);
    // console.log(`symbol: ${item.symbol}`)
    // console.log(`asset: ${asset}`)
    // console.log(`ltoken: ${item.addr}`)
    const ltoken = isRev2
      ? LTokenRev2Factory.connect(item.addr, provider)
      : LTokenFactory.connect(item.addr, provider);
    const name = await ltoken.name();
    const symbol = await ltoken.symbol();
    const decimals = await ltoken.decimals();
    const underlyingAsset = await ltoken.UNDERLYING_ASSET_ADDRESS();
    const pool = await ltoken.POOL();
    const incentivesController = await ltoken.getIncentivesController();
    const treasury = await ltoken.RESERVE_TREASURY_ADDRESS();
    const scaledTotalSupply = await ltoken
      .scaledTotalSupply()
      .then((v) => utils.formatUnits(v, decimals));
    const revision = (await (isRev2 ? ltoken.getCurrentRevision() : ltoken.LTOKEN_REVISION()).then(
      (v) => v.toNumber()
    )) as number;
    Object.assign(result, {
      [item.symbol]: {
        name,
        symbol,
        decimals,
        revision,
        underlyingAsset,
        pool,
        incentivesController,
        treasury,
        scaledTotalSupply,
      },
    });
  }
  return result;
};

task('check-ltokens', 'check-ltokens').setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE;
  const network = <eNetwork>localBRE.network.name;
  const constants = CONSTANTS[network];
  const pConf = loadPoolConfig(ConfigNames.Starlay);

  const protocolDataProvider = await getStarlayProtocolDataProvider(
    constants.StarlayProtocolDataProvider
  );
  const symbolAndAddrs = getParamPerNetwork(pConf.ReserveAssets, network as eNetwork);
  const ltokenProxies: { symbol: string; addr: string }[] = [];
  for await (const [symbol, address] of Object.entries(symbolAndAddrs)) {
    const { lTokenAddress } = await protocolDataProvider.getReserveTokensAddresses(address);
    ltokenProxies.push({ symbol: symbol, addr: lTokenAddress });
  }

  const baseParams = {
    ethers,
    ltokenProxies,
    symbolAndAddrs,
  };
  const lTokens = await getCurrentLTokens({
    ...baseParams,
    isRev2: true,
  });
  for (const item of ltokenProxies) {
    const asset = symbolAndAddrs[item.symbol];
    console.log(`## symbol: ${item.symbol}`);
    console.log(`asset: ${asset}`);
    console.log(`ltoken: ${item.addr}`);
    console.log(lTokens[item.symbol]);
  }
});

type UpdateLTokenInputParams = {
  asset: string;
  treasury: string;
  incentivesController: string;
  name: string;
  symbol: string;
  implementation: string;
  params: string;
};
const upgradeLToken = async (
  configurator: LendingPoolConfigurator,
  updateLTokenInputParams: Omit<UpdateLTokenInputParams, 'implementation'>
) => {
  console.log(`> deploy LTokenRev2Impl`);
  const newLTokenImpl = await deployGenericLTokenRev2Impl(false);
  console.log(`newLTokenImpl ... ${newLTokenImpl.address}`);
  console.log(`>> end: deploy LTokenRev2Impl`);

  console.log(`> upgrade ltoken`);
  const _updateLTokenInputParams = {
    ...updateLTokenInputParams,
    implementation: newLTokenImpl.address,
  };
  const tx = await configurator.updateLToken(_updateLTokenInputParams);
  await tx.wait();
  console.log(`>> end: upgrade ltoken`);
  // const tr = await tx.wait()
  // console.log(tr.events)
};

// NOTE: NOT USED in production
// task("upgrade-ltokens-to-rev2-for-ve", "upgrade-ltokens-to-rev2-for-ve").setAction(async ({}, localBRE) => {
//   if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
//     throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
//   setDRE(localBRE);
//   const { ethers } = localBRE
//   const network = <eNetwork>localBRE.network.name;
//   const constants = CONSTANTS[network]
//   const pConf = loadPoolConfig(ConfigNames.Starlay);

//   const protocolDataProvider = await getStarlayProtocolDataProvider(constants.StarlayProtocolDataProvider);
//   const symbolAndAddrs = getParamPerNetwork(pConf.ReserveAssets, network as eNetwork)
//   const ltokenProxies: { symbol: string, addr: string }[] = []
//   for await (const [symbol, address] of Object.entries(symbolAndAddrs)) {
//     const { lTokenAddress } = await protocolDataProvider.getReserveTokensAddresses(address);
//     ltokenProxies.push({ symbol: symbol, addr: lTokenAddress })
//   }

//   const baseParams = {
//     ethers,
//     ltokenProxies,
//     symbolAndAddrs
//   }
//   console.log(`####### Before`)
//   const beforeLTokens = await getCurrentLTokens({
//     ...baseParams,
//     isRev2: false
//   })
//   for (const item of ltokenProxies) {
//     const asset = symbolAndAddrs[item.symbol]
//     console.log(`## symbol: ${item.symbol}`)
//     console.log(`asset: ${asset}`)
//     console.log(`ltoken: ${item.addr}`)
//     console.log(beforeLTokens[item.symbol])
//   }

//   console.log(`####### Execute`)
//   const configurator = await getLendingPoolConfiguratorProxy(constants.LendingPoolConfigurator);
//   const { LTokenNamePrefix, SymbolPrefix } = pConf
//   for await (const item of ltokenProxies) {
//     const { symbol } = item
//     const asset = symbolAndAddrs[symbol]
//     console.log(`## symbol: ${symbol}`)
//     console.log(`asset: ${asset}`)
//     const updateLTokenInputParams: Omit<UpdateLTokenInputParams, "implementation"> = {
//       asset: asset,
//       treasury: constants.Voter, // purpose (change from treasury to voter for ve overall)
//       incentivesController: constants.IncentiveController,
//       name: `${LTokenNamePrefix} ${symbol}`,
//       symbol: `l${SymbolPrefix}${symbol}`,
//       // implementation: "0xTBD",
//       params: await getLTokenExtraParams(eContractid.LToken, "0xTBD"),
//     };
//     await upgradeLToken(configurator, updateLTokenInputParams)
//   }

//   console.log(`####### After`)
//   const afterLTokens = await getCurrentLTokens({
//     ...baseParams,
//     isRev2: true
//   })
//   for (const item of ltokenProxies) {
//     const asset = symbolAndAddrs[item.symbol]
//     console.log(`## symbol: ${item.symbol}`)
//     console.log(`asset: ${asset}`)
//     console.log(`ltoken: ${item.addr}`)
//     console.log(afterLTokens[item.symbol])
//   }
// })

// use followings
// - yarn hardhat deploy-multi-ltokens-rev2 --network astar
// - yarn hardhat upgrade-ltokens-to-rev2-for-ve-by-deployed-ltokens --network astar
const EOA = ''; // set PoolAdmin
task('deploy-multi-ltokens-rev2', 'deploy-ltoken-rev2').setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE;
  const network = <eNetwork>localBRE.network.name;
  const signer = await ethers.getSigner(EOA);
  // const signer = (await ethers.getSigners())[0]

  console.log(`network: ${network}`);
  console.log(`signer: ${signer.address}`);
  console.log(`balance (before): ${formatEther(await signer.getBalance())}`);
  console.log();

  const COUNT = 12;
  const results: string[] = [];
  for (let i = 0; i < COUNT; i++) {
    console.log(`> start ${i + 1} / ${COUNT}`);
    const instance = await deployGenericLTokenRev2ImplWithSigner(false, signer);
    results.push(instance.address);
    console.log(`contract address ... ${instance.address}`);
  }

  console.log(`balance (after): ${formatEther(await signer.getBalance())}`);
  console.log();
  console.log(results);
});

const LTOKEN_REV2_IMPLS: string[] = [
  '0xTBD1',
  '0xTBD2',
  '0xTBD3',
  '0xTBD4',
  '0xTBD5',
  '0xTBD6',
  '0xTBD7',
  '0xTBD8',
  '0xTBD9',
  '0xTBD10',
  '0xTBD11',
  '0xTBD12',
]; // set from results by deploy-multi-ltokens-rev2
const upgradeLTokenWithDeployedLTokenRev2 = async (
  signer: SignerWithAddress,
  configurator: LendingPoolConfigurator,
  updateLTokenInputParams: Omit<UpdateLTokenInputParams, 'implementation'>,
  implAddress: string
) => {
  console.log(`implAddress ... ${implAddress}`);

  console.log(`> upgrade ltoken`);
  const _updateLTokenInputParams = {
    ...updateLTokenInputParams,
    implementation: implAddress,
  };
  const tx = await configurator.connect(signer).updateLToken(_updateLTokenInputParams);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
  console.log(`>> end: upgrade ltoken`);
  // const tr = await tx.wait()
  // console.log(tr.events)
};
task(
  'upgrade-ltokens-to-rev2-for-ve-by-deployed-ltokens',
  'upgrade-ltokens-to-rev2-for-ve-by-deployed-ltokens'
).setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE;
  const network = <eNetwork>localBRE.network.name;
  const constants = CONSTANTS[network];
  const pConf = loadPoolConfig(ConfigNames.Starlay);

  const protocolDataProvider = await getStarlayProtocolDataProvider(
    constants.StarlayProtocolDataProvider
  );
  const symbolAndAddrs = getParamPerNetwork(pConf.ReserveAssets, network as eNetwork);
  const ltokenProxies: { symbol: string; addr: string }[] = [];
  for await (const [symbol, address] of Object.entries(symbolAndAddrs)) {
    const { lTokenAddress } = await protocolDataProvider.getReserveTokensAddresses(address);
    ltokenProxies.push({ symbol: symbol, addr: lTokenAddress });
  }

  const baseParams = {
    ethers,
    ltokenProxies,
    symbolAndAddrs,
  };
  console.log(`####### Before`);
  const beforeLTokens = await getCurrentLTokens({
    ...baseParams,
    isRev2: false,
  });
  for (const item of ltokenProxies) {
    const asset = symbolAndAddrs[item.symbol];
    console.log(`## symbol: ${item.symbol}`);
    console.log(`asset: ${asset}`);
    console.log(`ltoken: ${item.addr}`);
    console.log(beforeLTokens[item.symbol]);
  }

  console.log('');
  const _signer = await ethers.getSigner(EOA);
  console.log(`> signer ... ${_signer.address}`);
  console.log('');

  console.log(`####### Execute`);
  const configurator = await getLendingPoolConfiguratorProxy(constants.LendingPoolConfigurator);
  const { LTokenNamePrefix, SymbolPrefix } = pConf;
  for await (const [_index, item] of ltokenProxies.entries()) {
    const { symbol } = item;
    const asset = symbolAndAddrs[symbol];
    const ltokenRev2ImplAddress = LTOKEN_REV2_IMPLS[_index];
    console.log(`## symbol: ${symbol}`);
    console.log(`asset: ${asset}`);
    console.log(`index: ${_index}`);
    console.log(`ltokenRev2 Impl address: ${ltokenRev2ImplAddress}`);
    const updateLTokenInputParams: Omit<UpdateLTokenInputParams, 'implementation'> = {
      asset: asset,
      treasury: constants.Voter, // purpose (change from treasury to voter for ve overall)
      incentivesController: constants.IncentiveController,
      name: `${LTokenNamePrefix} ${symbol}`,
      symbol: `l${SymbolPrefix}${symbol}`,
      // implementation: "0xTBD",
      params: await getLTokenExtraParams(eContractid.LToken, '0xTBD'),
    };
    await upgradeLTokenWithDeployedLTokenRev2(
      _signer,
      configurator,
      updateLTokenInputParams,
      ltokenRev2ImplAddress
    );
  }

  console.log(`####### After`);
  const afterLTokens = await getCurrentLTokens({
    ...baseParams,
    isRev2: true,
  });
  for (const item of ltokenProxies) {
    const asset = symbolAndAddrs[item.symbol];
    console.log(`## symbol: ${item.symbol}`);
    console.log(`asset: ${asset}`);
    console.log(`ltoken: ${item.addr}`);
    console.log(afterLTokens[item.symbol]);
  }
});
