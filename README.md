[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

```
     ..gNMMMMNmJ.    dMMM#_                                 ,MMMN!
   .(MMMMMMMMMMM#^  .MMMMF                                  dMMM#
  .dMMMM#"?7TMMY   ..MMMMb...                               MMMM@
  (MMMM#          (MMMMMMMMM#!                             .MMMMD
  dMMMMMm,        dMMMMMMMMM#        ......    .....   ... (MMMM\         .....   ......     ......
  (MMMMMMMMNa..     dMMMN        .(NMMMMMMMM}  JMMM#.gMM#! jMMM#:    ..gMMMMMMMMr dMMMMN.   .MMMMM!
   (MMMMMMMMMMNe   .MMMM#      .dMMMMB"MMMM#:  dMMMMMMMM#  dMMM#`  .gMMMMM"4MMMN! (MMMMM-  .dMMMM\
      ?TMMMMMMMM[  .MMMMD     .MMMM=  .MMMM#  .MMMMMM=` `  dMMM@  .MMMM#^  .MMM#   MMMMMp  dMMMM=
          ?MMMMMb  (MMMM%    .MMMM%   .MMMMD  (MMMM#'     .MMMMD .MMMMM:   dMMM@   (MMMM#..MMMMD
   ..     .MMMMM%  dMMMM)    dMMMN{  .MMMMM}  dMMMM$      ,MMMM} .MMMM#`  .MMMM%   .MMMMNaMMMMF
 .dMMNgJ(+MMMMMF`  dMMMMNgJ  dMMMM[ .dMMMMM`  dMMMM:      JMMMM~ (MMMMN, .MMMMN}    JMMMMMMMM@`
dMMMMMMMMMMMMM=    dMMMMMMN| (MMMMMMMMMMMM#  .MMMM#~      dMMM#` .MMMMMMMMMMMM#~     MMMMMMM@`
  7WMMMMMM#"!       ?HMMMM"!  (TMMMM"`MMMMF  .MMMM@       MMMM@   -TMMMM9~dMMM@      jMMMMM#`
                                                                                     .MMMM#!
                                                                                    .MMMMM'
                                                                                   .dMMMM\
                                                                                  .MMMMMt
                                                                                  7""""t
```

# Starlay Protocol

This repository contains the smart contracts source code and markets configuration for Starlay Protocol. The repository uses Docker Compose and Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Starlay?

Starlay is a decentralized non-custodial liquidity markets protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized (perpetually) or undercollateralized (one-block liquidity) fashion.

## Documentation

The documentation of Starlay is in the following [Starlay documentation](https://docs.starlay.finance/) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

For getting the latest contracts addresses, please check the [Deployed contracts](https://docs.starlay.finance/deployed-contracts/deployed-contracts) page at the documentation to stay up to date.


## Audits

Under construction

## Connect with the community

You can join at the [Discord](https://discord.gg/fdjNAJmgUc) channel for asking questions about the protocol or talk about Starlay with other peers.

## Getting Started

You can install `@starlay-finance/starlay-protocol` as an NPM package in your Hardhat, Buidler or Truffle project to import the contracts and interfaces:

`npm install @starlay-finance/starlay-protocol`

Import at Solidity files:

```
import {ILendingPool} from "@starlay-finance/starlay-protocol/contracts/interfaces/ILendingPool.sol";

contract Misc {

  function deposit(address pool, address token, address user, uint256 amount) public {
    ILendingPool(pool).deposit(token, amount, user, 0);
    {...}
  }
}
```

The JSON artifacts with the ABI and Bytecode are also included into the bundled NPM package at `artifacts/` directory.

Import JSON file via Node JS `require`:

```
const LendingPoolV2Artifact = require('@@starlay-finance/starlay-protocol/artifacts/contracts/protocol/lendingpool/LendingPool.sol/LendingPool.json');

// Log the ABI into console
console.log(LendingPoolV2Artifact.abi)
```

## Setup

The repository uses Docker Compose to manage sensitive keys and load the configuration. Prior any action like test or deploy, you must run `docker-compose up` to start the `contracts-env` container, and then connect to the container console via `docker-compose exec contracts-env bash`.

Follow the next steps to setup the repository:

- Install `docker` and `docker-compose`
- Create an enviroment file named `.env` and fill the next enviroment variables

```
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura provider keys, alchemy takes preference at the config level
ALCHEMY_KEY=""
INFURA_KEY=""


# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""

```

## Markets configuration

The configurations related with the Starlay Markets are located at `markets` directory. You can follow the `IStarlayConfiguration` interface to create new Markets configuration or extend the current Starlay configuration.

Each market should have his own Market configuration file, and their own set of deployment tasks, using the Starlay market config and tasks as a reference.

## Test

You can run the full test suite with the following commands:

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# A new Bash terminal is prompted, connected to the container
npm run test
```

## Deployments

For deploying starlay-protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Shiden deployment

Shiden is development and testing environment.

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# A new Bash terminal is prompted, connected to the container
npm run starlay:shiden:full:migration
```
