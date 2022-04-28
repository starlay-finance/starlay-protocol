import { task } from "hardhat/config";
import { eAstarNetwork } from "../../helpers/types";
import StarlayConfig from "../../markets/starlay";
import { PriceAggregatorAdapterDiaImplFactory } from "../../types";
import { StarlayFallbackOracleFactory } from "../../types/StarlayFallbackOracleFactory";

type EthereumAddress = `0x${string}`
type Addresses = {
  StarlayFallbackOracle: EthereumAddress
  PriceAggregatorAdapterDiaImpl: EthereumAddress
  DiaOracle: EthereumAddress
}
const SUPPORTED_NETWORK = ["astar", "shiden"] as const
type SupportedNetwork = typeof SUPPORTED_NETWORK[number]
type Constants = {
  [key in SupportedNetwork]?: Addresses
}

const astar: Addresses = {
  StarlayFallbackOracle: "0x35E6D71FeA378B60b3A5Afc91eA7F520F937833c",
  PriceAggregatorAdapterDiaImpl: "0x043C93fF4d52B2F76811852644549553A00309a8",
  DiaOracle: "0x35490A8AC7cD0Df5C4d7Ab4243A6B517133BcDB1"
}
const shiden: Addresses = {
  StarlayFallbackOracle: "0xA42D5A35b6bbC93fe63FE54536f320faC9996f4C",
  PriceAggregatorAdapterDiaImpl: "0x8F2fFfF56375CDeD7f53E0D90259711Cd122Da31",
  DiaOracle: "0xCe784F99f87dBa11E0906e2fE954b08a8cc9815d"
}
const CONSTANTS: Constants = {
  astar: astar,
  shiden: shiden
}

task("check:oracle:fallback-oracle", "check:oracle:fallback-oracle").setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  const { ethers, network } = localBRE

  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  const networkName = network.name as SupportedNetwork
  const addrs = CONSTANTS[networkName]
  if (!addrs) throw new Error("Not setting addresses")

  const prices = StarlayConfig.ReserveAssets[networkName as eAstarNetwork]
  const keys = Object.keys(prices) as string[]
  const values = Object.values(prices) as string[]

  const _oracle = StarlayFallbackOracleFactory.connect(
    addrs.StarlayFallbackOracle,
    ethers.provider,
  )
  for (let i=0; i<keys.length; i++) console.log(`${keys[i]} ... ${ethers.utils.formatUnits(await _oracle.getAssetPrice(values[i]), 8)}`)
})

task("check:oracle:price-aggregator-adapter-dia-impl", "check:oracle:price-aggregator-adapter-dia-impl").setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  const { ethers, network } = localBRE

  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  const networkName = network.name as SupportedNetwork
  const addrs = CONSTANTS[networkName]
  if (!addrs) throw new Error("Not setting addresses")

  const prices = StarlayConfig.ReserveAssets[networkName as eAstarNetwork]
  const keys = Object.keys(prices) as string[]
  const values = Object.values(prices) as string[]

  const _oracle = PriceAggregatorAdapterDiaImplFactory.connect(
    addrs.PriceAggregatorAdapterDiaImpl,
    ethers.provider,
  )
  for (let i=0; i<keys.length; i++) console.log(`${keys[i]} ... ${ethers.utils.formatUnits(await _oracle.currentPrice(values[i]), 8)}`)
})

const ABI_DIA_ORACLE_V2 = [{"type":"constructor","stateMutability":"nonpayable","inputs":[]},{"type":"event","name":"OracleUpdate","inputs":[{"type":"string","name":"key","internalType":"string","indexed":false},{"type":"uint128","name":"value","internalType":"uint128","indexed":false},{"type":"uint128","name":"timestamp","internalType":"uint128","indexed":false}],"anonymous":false},{"type":"event","name":"UpdaterAddressChange","inputs":[{"type":"address","name":"newUpdater","internalType":"address","indexed":false}],"anonymous":false},{"type":"function","stateMutability":"view","outputs":[{"type":"uint128","name":"","internalType":"uint128"},{"type":"uint128","name":"","internalType":"uint128"}],"name":"getValue","inputs":[{"type":"string","name":"key","internalType":"string"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"setValue","inputs":[{"type":"string","name":"key","internalType":"string"},{"type":"uint128","name":"value","internalType":"uint128"},{"type":"uint128","name":"timestamp","internalType":"uint128"}]},{"type":"function","stateMutability":"nonpayable","outputs":[],"name":"updateOracleUpdaterAddress","inputs":[{"type":"address","name":"newOracleUpdaterAddress","internalType":"address"}]},{"type":"function","stateMutability":"view","outputs":[{"type":"uint256","name":"","internalType":"uint256"}],"name":"values","inputs":[{"type":"string","name":"","internalType":"string"}]}]
task("check:oracle:dia-oracle", "check:oracle:dia-oracle").setAction(async ({}, localBRE) => {
  await localBRE.run('set-DRE');
  const { ethers, network } = localBRE

  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(network.name)) throw new Error(`Support only ${SUPPORTED_NETWORK} ...`)
  const networkName = network.name as SupportedNetwork
  const addrs = CONSTANTS[networkName]
  if (!addrs) throw new Error("Not setting addresses")

  const keys = [
    "ASTR/USD",
    "SDN/USD",
    "ETH/USD",
    "WBTC/USD",
    "USDT/USD",
    "USDC/USD",
    "LAY/USD",
    "BUSD/USD",
    "DAI/USD",
    "MATIC/USD",
    "BNB/USD",
  ]
  const _oracle = new ethers.Contract(
    addrs.DiaOracle,
    new ethers.utils.Interface(ABI_DIA_ORACLE_V2),
    ethers.provider
  )
  for (let i=0; i<keys.length; i++) {
    const result = await _oracle.getValue(keys[i])
    console.log(`> ${keys[i]}`)
    console.log(`value ... ${ethers.utils.formatUnits(result[0], 8)}`)
    console.log(`timestamp ... ${result[1]}`)
  }
})
