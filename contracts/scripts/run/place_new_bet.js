const { types } = require('@algo-builder/web');
const { tryExecuteTx, SUPPORTED_ASA_FOR_WAGER } = require('../common/common.js');
const { accounts } = require('../common/accounts');
const { getApplicationAddress } = require('algosdk');

const now = Math.round(Date.now() / 1000);

async function run (runtimeEnv, deployer) {
  const { _, userA } = accounts(deployer);

  // Get Wager App Info
  const wagerAppInfo = await deployer.getAppByName("Wager App");

  // Get ALGO_USDC ASA
  //const algoUsdcASA = deployer.asa.get('ALGO_USDC');
  const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;


  // optin to app first (only if not optedIn first)
  const optInParams = {
    type: types.TransactionType.OptInToApp,
    sign: types.SignType.SecretKey,
    fromAccount: userA,
    appID: wagerAppInfo.appID,
    payFlags: { totalFee: 1000 }
  };
  await tryExecuteTx(deployer, optInParams);


  const appArgs = [
    `int:${now + (5 * 60)}`, // limit_date
    `int:${now + (10 * 60)}`, // end_date
    `str:UP` // wager bet direction
  ]

  const betAmount = 10e6 // 10 ALGO;

  /*
   * In this call we're betting that (local) ALGO/USDC ASA price will go UP
   * after 10min from now. Bets are only accepted till 5min from now.
   */
  const txGroup = [
    // call to wager app
    {
      type: types.TransactionType.CallApp,
      sign: types.SignType.SecretKey,
      fromAccount: userA,
      appID: wagerAppInfo.appID,
      payFlags: { totalFee: 1000 },
      appArgs: [
        'str:place_new_bet', ...appArgs
      ],
		  foreignAssets: [ algoUsdcASA ],
    },
    // payment (bet)
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: userA,
      toAccountAddr: getApplicationAddress(wagerAppInfo.appID),
      amountMicroAlgos: betAmount,
      payFlags: { totalFee: 1000 }
    }
  ]

  await tryExecuteTx(deployer, txGroup);
}

module.exports = { default: run };