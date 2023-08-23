const { types } = require('@algo-builder/web');
const { tryExecuteTx, ALGO_USDC_TESTNET_ORACLE_APP_ID, getLiveWagers, SUPPORTED_ASA_FOR_WAGER } = require('../common/common.js');
const { accounts } = require('../common/accounts');
const { readAppLocalState } = require('@algo-builder/algob');

async function decideWinnerForPair(deployer, admin, wagerAppID, algoUdscASAID, oracleAppID, pair) {
  /*
   * Call the wager app to decide winner (callable by admin)
   */
  const tx = {
    type: types.TransactionType.CallApp,
    sign: types.SignType.SecretKey,
    fromAccount: admin,
    appID: wagerAppID,
    payFlags: { totalFee: 1000 },
    appArgs: [
      'str:decide_winner'
    ],
    accounts: [ pair[0].address, pair[1].address ],
    foreignAssets: [ algoUdscASAID ],
    foreignApps: [ oracleAppID ]
  }

  await tryExecuteTx(deployer, tx);
}

async function run (runtimeEnv, deployer) {
  const { admin } = accounts(deployer);

  // Get Wager App Info
  const wagerAppInfo = await deployer.getAppByName("Wager App");

  // Get ALGO_USDC ASA
  //const algoUsdcASA = deployer.asa.get('ALGO_USDC');
  const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const liveWagers = await getLiveWagers(deployer, wagerAppInfo.appID);

  // decide winner for each pair
  for (const pair of liveWagers) {
    await decideWinnerForPair(deployer, admin, wagerAppInfo.appID, algoUsdcASA, ALGO_USDC_TESTNET_ORACLE_APP_ID, pair);
  }
}

module.exports = { default: run };