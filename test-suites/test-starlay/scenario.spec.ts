import BigNumber from 'bignumber.js';
import fs from 'fs';
import StarlayConfig from '../../markets/starlay';
import { strategyDAI, strategyDAIForTest } from './../../markets/starlay/reservesConfigs';
import { configuration as actionsConfiguration } from './helpers/actions';
import { makeSuite } from './helpers/make-suite';
import { executeStory } from './helpers/scenario-engine';
import { configuration as calculationsConfiguration } from './helpers/utils/calculations';

const scenarioFolder = './test-suites/test-starlay/helpers/scenarios/';

const selectedScenarios: string[] = [];

fs.readdirSync(scenarioFolder).forEach((file) => {
  if (selectedScenarios.length > 0 && !selectedScenarios.includes(file)) return;

  const scenario = require(`./helpers/scenarios/${file}`);

  makeSuite(scenario.title, async (testEnv) => {
    before('Initializing configuration', async () => {
      // Sets BigNumber for this suite, instead of globally
      BigNumber.config({ DECIMAL_PLACES: 0, ROUNDING_MODE: BigNumber.ROUND_DOWN });

      actionsConfiguration.skipIntegrityCheck = false; //set this to true to execute solidity-coverage

      calculationsConfiguration.reservesParams = {
        ...StarlayConfig.ReservesConfig,
        DAI: strategyDAIForTest,
      };
      const { usdc, weth, configurator } = testEnv;
      await configurator.enableReserveStableRate(weth.address);
      await configurator.enableReserveStableRate(usdc.address);
    });
    after('Reset', () => {
      // Reset BigNumber
      BigNumber.config({ DECIMAL_PLACES: 20, ROUNDING_MODE: BigNumber.ROUND_HALF_UP });
    });

    for (const story of scenario.stories) {
      it(story.description, async function () {
        // Retry the test scenarios up to 4 times if an error happens, due erratic HEVM network errors
        this.retries(4);
        await executeStory(story, testEnv);
      });
    }
  });
});
