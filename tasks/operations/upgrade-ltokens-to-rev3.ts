import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { formatEther } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { ConfigNames, loadPoolConfig } from '../../helpers/configuration';
import {
  deployGenericLTokenRev3ImplWithSigner,
} from '../../helpers/contracts-deployments';
import {
  getLendingPoolConfiguratorProxy,
  getStarlayProtocolDataProvider,
} from '../../helpers/contracts-getters';
import { getParamPerNetwork } from '../../helpers/contracts-helpers';
import { getLTokenExtraParams } from '../../helpers/init-helpers';
import { setDRE } from '../../helpers/misc-utils';
import { eContractid, eNetwork } from '../../helpers/types';
import { LendingPoolConfigurator } from '../../types';

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
const EOA = ''; // set PoolAdmin

// deploy-ltoken-rev3
task("deploy-ltoken-rev3", "deploy-ltoken-rev3").setAction(async ({}, localBRE) => {
  if (!(SUPPORTED_NETWORK as ReadonlyArray<string>).includes(localBRE.network.name))
    throw new Error(`Support only ${SUPPORTED_NETWORK} ...`);
  setDRE(localBRE);
  const { ethers } = localBRE;
  const network = <eNetwork>localBRE.network.name;
  const signer = await ethers.getSigner(EOA);

  console.log(`network: ${network}`);
  console.log(`signer: ${signer.address}`);
  console.log(`balance (before): ${formatEther(await signer.getBalance())}`);
  console.log(`- - - - - - - - - - -`);

  const instance = await deployGenericLTokenRev3ImplWithSigner(false, signer);
  console.log(`contract address ... ${instance.address}`);

  console.log(`- - - - - - - - - - -`);
  console.log(`balance (after): ${formatEther(await signer.getBalance())}`);
})

// upgrade-ltoken-to-rev3-by-deployed-ltokens
//// utilities
type UpdateLTokenInputParams = {
  asset: string;
  treasury: string;
  incentivesController: string;
  name: string;
  symbol: string;
  implementation: string;
  params: string;
};
const upgradeLTokenWithDeployedLTokenRev3 = async (
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
};
//// main
const PARAMS_TO_UPGRADE = {
  target: {
    symbol: "NativeUSDT",
    asset: "0xfFFfffFF000000000000000000000001000007C0",
    ltoken: "0x659110D07923e2C3fCB9d3C9E66B0a1605e7ce71",
  },
  newLtokenImpl: "0x892DEF735c209b191Ac914e5a4286629FcBF9082"
}
task(
  'upgrade-ltoken-to-rev3-by-deployed-ltokens',
  'upgrade-ltoken-to-rev3-by-deployed-ltokens'
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

  const _signer = await ethers.getSigner(EOA);
  console.log(`> signer ... ${_signer.address}`);

  const symbolAndAddrs = getParamPerNetwork(pConf.ReserveAssets, network as eNetwork);
  const { target, newLtokenImpl } = PARAMS_TO_UPGRADE
  const assetAddress = symbolAndAddrs[target.symbol]
  if (assetAddress.toLowerCase() != target.asset.toLowerCase()) throw new Error("Not equal input asset address to getted asset address")
  const { lTokenAddress } = await protocolDataProvider.getReserveTokensAddresses(assetAddress);
  if (lTokenAddress.toLowerCase() != target.ltoken.toLowerCase()) throw new Error("Not equal input ltoken address to getted ltoken address")

  // generate params to use upgrading
  const configurator = await getLendingPoolConfiguratorProxy(constants.LendingPoolConfigurator);
  const { LTokenNamePrefix, SymbolPrefix } = pConf;
  const updateLTokenInputParams: Omit<UpdateLTokenInputParams, 'implementation'> = {
    asset: assetAddress,
    treasury: constants.Voter, // purpose (change from treasury to voter for ve overall)
    incentivesController: constants.IncentiveController,
    name: `${LTokenNamePrefix} ${target.symbol}`,
    symbol: `l${SymbolPrefix}${target.symbol}`,
    // implementation: "0xTBD", // set when upgrading
    params: await getLTokenExtraParams(eContractid.LToken, '0xTBD'),
  };
  // upgrade
  await upgradeLTokenWithDeployedLTokenRev3(
    _signer,
    configurator,
    updateLTokenInputParams,
    newLtokenImpl
  );
})
