import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { getStarlayProtocolDataProvider } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { setDRE } from "../../helpers/misc-utils";
import { eNetwork, SymbolMap } from "../../helpers/types";
import { LTokenFactory, LTokenRev2Factory } from "../../types";

const SUPPORTED_NETWORK = ['astar', 'shiden'] as const;
type SupportedNetwork = typeof SUPPORTED_NETWORK[number];
type EthereumAddress = `0x${string}`;

type Addresses = {
  StarlayProtocolDataProvider: EthereumAddress
};
type Constants = {
  [key in SupportedNetwork]?: Addresses;
};
const astar: Addresses = {
  StarlayProtocolDataProvider: "0x5BF9B2644E273D92ff1C31A83476314c95953133"
}
const shiden: Addresses = {
  StarlayProtocolDataProvider: "0x3fD308785Cf41F30993038c145cE50b7fF677a71"
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
    const [name, symbol, decimals, underlyingAsset, pool, treasury, incentivesController, scaledTotalSupply, revision] = await Promise.all([
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

task("upgrade-ltokens-to-rev2-for-ve", "upgrade-ltokens-to-rev2-for-ve").setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE
  const network = <eNetwork>localBRE.network.name;
  const addrs = CONSTANTS[network]
  const poolConfig = loadPoolConfig(ConfigNames.Starlay);
  
  const protocolDataProvider = await getStarlayProtocolDataProvider(addrs.StarlayProtocolDataProvider);
  const symbolAndAddrs = getParamPerNetwork(poolConfig.ReserveAssets, network as eNetwork)
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
  // TODO

  console.log(`####### After`)
  await checkLTokens({
    ...baseParams,
    isRev2: true
  })

})