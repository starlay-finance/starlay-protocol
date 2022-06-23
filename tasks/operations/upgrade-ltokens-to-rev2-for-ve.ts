import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployGenericLTokenRev2Impl } from "../../helpers/contracts-deployments";
import { getLendingPoolConfiguratorProxy, getStarlayProtocolDataProvider } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { getLTokenExtraParams } from "../../helpers/init-helpers";
import { setDRE } from "../../helpers/misc-utils";
import { eContractid, eNetwork, SymbolMap } from "../../helpers/types";
import { LendingPoolConfigurator, LTokenFactory, LTokenRev2Factory } from "../../types";

const SUPPORTED_NETWORK = ['astar', 'shiden'] as const;
type SupportedNetwork = typeof SUPPORTED_NETWORK[number];
type EthereumAddress = `0x${string}`;

type Addresses = {
  StarlayProtocolDataProvider: EthereumAddress
  LendingPoolConfigurator: EthereumAddress
  IncentiveController: EthereumAddress
  Voter: EthereumAddress
};
type Constants = {
  [key in SupportedNetwork]?: Addresses;
};
const astar: Addresses = {
  StarlayProtocolDataProvider: "0x5BF9B2644E273D92ff1C31A83476314c95953133",
  LendingPoolConfigurator: '0xa1c2ED9e0d09f5e441aC9C44AFa308D38dAf463c',
  IncentiveController: '0x97Ab79B80E8904214413D8219E8B04373D1030AD',
  Voter: "0xTBD",
}
const shiden: Addresses = {
  StarlayProtocolDataProvider: "0x3fD308785Cf41F30993038c145cE50b7fF677a71",
  LendingPoolConfigurator: '0x1aE33143380567fe1246bE4Be5008B7bFa25790A',
  IncentiveController: '0xD9F3bbC743b7AF7E1108653Cd90E483C03D6D699',
  Voter: "0xTBD",
}
const CONSTANTS: Constants = {
  astar: astar,
  shiden: shiden,
};

const checkLTokens = async (params: {
  ethers: HardhatRuntimeEnvironment["ethers"],
  ltokenProxies: { symbol: string, addr: string }[],
  symbolAndAddrs: SymbolMap<string>
  isRev2?: boolean
}) => {
  const { ethers: { provider, utils }, ltokenProxies, symbolAndAddrs, isRev2 } = params
  for await (const item of ltokenProxies) {
    const asset = symbolAndAddrs[item.symbol]
    console.log(`## symbol: ${item.symbol}`)
    console.log(`asset: ${asset}`)
    console.log(`ltoken: ${item.addr}`)
    const ltoken = isRev2
      ? LTokenRev2Factory.connect(item.addr, provider)
      : LTokenFactory.connect(item.addr, provider)
    const results = await Promise.all([
      ltoken.name(),
      ltoken.symbol(),
      ltoken.decimals(),
      ltoken.UNDERLYING_ASSET_ADDRESS(),
      ltoken.POOL(),
      ltoken.getIncentivesController(),
      ltoken.RESERVE_TREASURY_ADDRESS(),
      ltoken.scaledTotalSupply().then(v => utils.formatUnits(v, 27)),
      (isRev2 ? ltoken.getCurrentRevision() : ltoken.LTOKEN_REVISION()).then(v => v.toNumber()),
    ])
    const [name, symbol, decimals, underlyingAsset, pool, incentivesController, treasury, scaledTotalSupply, revision] = results
    console.log({
      name,
      symbol,
      decimals,
      revision,
      underlyingAsset,
      pool,
      incentivesController,
      treasury,
      scaledTotalSupply
    })
    console.log(``)
  }
}

type UpdateLTokenInputParams = {
  asset: string;
  treasury: string;
  incentivesController: string;
  name: string;
  symbol: string;
  implementation: string;
  params: string;
}
const upgradeLToken = async (
  configurator: LendingPoolConfigurator,
  updateLTokenInputParams: Omit<UpdateLTokenInputParams, "implementation">
) => {
  console.log(`> deploy LTokenRev2Impl`)
  const newLTokenImpl = await deployGenericLTokenRev2Impl(false)
  console.log(`newLTokenImpl ... ${newLTokenImpl.address}`)
  console.log(`>> end: deploy LTokenRev2Impl`)

  console.log(`> upgrade ltoken`)
  const _updateLTokenInputParams = {
    ...updateLTokenInputParams,
    implementation: newLTokenImpl.address,
  }
  const tx = await configurator.updateLToken(_updateLTokenInputParams);
  await tx.wait()
  console.log(`>> end: upgrade ltoken`)
  // const tr = await tx.wait()
  // console.log(tr.events)
}

task("upgrade-ltokens-to-rev2-for-ve", "upgrade-ltokens-to-rev2-for-ve").setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE
  const network = <eNetwork>localBRE.network.name;
  const constants = CONSTANTS[network]
  const pConf = loadPoolConfig(ConfigNames.Starlay);
  
  const protocolDataProvider = await getStarlayProtocolDataProvider(constants.StarlayProtocolDataProvider);
  const symbolAndAddrs = getParamPerNetwork(pConf.ReserveAssets, network as eNetwork)
  const ltokenProxies: { symbol: string, addr: string }[] = []
  for await (const [symbol, address] of Object.entries(symbolAndAddrs)) {
    const { lTokenAddress } = await protocolDataProvider.getReserveTokensAddresses(address);
    ltokenProxies.push({ symbol: symbol, addr: lTokenAddress })
  }

  const baseParams = {
    ethers,
    ltokenProxies,
    symbolAndAddrs
  }
  console.log(`####### Before`)
  await checkLTokens({
    ...baseParams,
    isRev2: false
  })

  console.log(`####### Execute`)
  const configurator = await getLendingPoolConfiguratorProxy(constants.LendingPoolConfigurator);
  const { LTokenNamePrefix, SymbolPrefix } = pConf
  for await (const item of ltokenProxies) {
    const { symbol } = item
    const asset = symbolAndAddrs[symbol]
    console.log(`## symbol: ${symbol}`)
    console.log(`asset: ${asset}`)
    const updateLTokenInputParams: Omit<UpdateLTokenInputParams, "implementation"> = {
      asset: asset,
      treasury: constants.Voter, // purpose (change from treasury to voter for ve overall)
      incentivesController: constants.IncentiveController,
      name: `${LTokenNamePrefix} ${symbol}`,
      symbol: `l${SymbolPrefix}${symbol}`,
      // implementation: "0xTBD",
      params: await getLTokenExtraParams(eContractid.LToken, "0xTBD"),
    };
    await upgradeLToken(configurator, updateLTokenInputParams)
  }

  console.log(`####### After`)
  await checkLTokens({
    ...baseParams,
    isRev2: true
  })
})
