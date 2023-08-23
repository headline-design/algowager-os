const { types } = require('@algo-builder/web');
const { tryExecuteTx, getOpenWagers, ALGO_USDC_TESTNET_ORACLE_APP_ID } = require('../common/common.js');
const { accounts } = require('../common/accounts');
const { getApplicationAddress } = require('algosdk');

const now = Math.round(Date.now() / 1000);

async function run (runtimeEnv, deployer) {
  const { _, userA, userB } = accounts(deployer);

  // Get Wager App Info
  const wagerAppInfo = await deployer.getAppByName("Wager App");

  // Get ALGO_USDC ASA
  //const algoUsdcASA = deployer.asa.get('ALGO_USDC');
  //const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const openWagers = await getOpenWagers(deployer, wagerAppInfo.appID);

  // optin to app first (only if not optedIn first)
  const optInParams = {
    type: types.TransactionType.OptInToApp,
    sign: types.SignType.SecretKey,
    fromAccount: userB,
    appID: wagerAppInfo.appID,
    payFlags: { totalFee: 1000 }
  };
  await tryExecuteTx(deployer, optInParams);


  /*
   * In this call we're accepting the bet placed by userA
   */
  const txGroup = [
    // call to wager app
    {
      type: types.TransactionType.CallApp,
      sign: types.SignType.SecretKey,
      fromAccount: userB,
      appID: wagerAppInfo.appID,
      payFlags: { totalFee: 1000 },
      appArgs: [ 'str:accept_bet' ],
      accounts: [ userA.addr ],
      foreignApps: [ ALGO_USDC_TESTNET_ORACLE_APP_ID ]
    },
    // payment (bet)
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: userB,
      toAccountAddr: getApplicationAddress(wagerAppInfo.appID),
      amountMicroAlgos: openWagers[userA.addr]['wager_amount'],
      payFlags: { totalFee: 1000 }
    }
  ]

  await tryExecuteTx(deployer, txGroup);
}

module.exports = { default: run };