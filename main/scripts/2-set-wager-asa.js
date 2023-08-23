const { types } = require('@algo-builder/web');
const { tryExecuteTx, SUPPORTED_ASA_FOR_WAGER } = require('./common/common.js');
const { accounts } = require('./common/accounts');

async function run (runtimeEnv, deployer) {
  /*

  const { admin } = accounts(deployer);

  // Get Wager App Info
  const wagerAppInfo = await deployer.getAppByName("Wager App");

  // Get ALGO_USDC ASA
  const algoUsdcASA = deployer.asa.get('ALGO_USDC');

  //const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const txParams = {
    type: types.TransactionType.CallApp,
    sign: types.SignType.SecretKey,
    fromAccount: admin,
    appID: wagerAppInfo.appID,
    payFlags: { totalFee: 1000 },
    appArgs: [
      'str:add_asa', `int:${algoUsdcASA.assetIndex}`
    ]
  };

  await tryExecuteTx(deployer, txParams);

  */
}

module.exports = { default: run };