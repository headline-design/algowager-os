import { AppActions } from "../lib/constants.js";
const { types } = require("@algo-builder/web");
const {
  tryExecuteTx,
  ALGO_USDC_TESTNET_ORACLE_APP_ID,
  getLiveWagers,
  SUPPORTED_ASA_FOR_WAGER,
  WagerAppID,
} = require("./common.js");

export async function decideWinnerForPair(
  adminAddr,
  wagerForAddr,
  wagerAgainstAddr,
  network,
  webmode
) {
  /*
   * Call the wager app to decide winner (callable by admin)
   */
  const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const tx = {
    type: types.TransactionType.CallApp,
    sign: types.SignType.SecretKey,
    fromAccountAddr: adminAddr,
    appID: WagerAppID(network),
    payFlags: { totalFee: 1000 },
    appArgs: [AppActions.DECIDE_WINNER],
    accounts: [wagerForAddr, wagerAgainstAddr],
    foreignAssets: [algoUsdcASA],
    foreignApps: [ALGO_USDC_TESTNET_ORACLE_APP_ID],
  };

  await tryExecuteTx(webmode, tx);
}
