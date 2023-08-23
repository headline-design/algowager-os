/* global BigInt */
import { AppActions } from "../lib/constants.js";

const { types } = require("@algo-builder/web");
const {
  tryExecuteTx,
  SUPPORTED_ASA_FOR_WAGER,
  isApplicationOpted,
  WagerAppID,
} = require("./common.js");
const { getApplicationAddress } = require("algosdk");

export async function placeNewBet(
  senderAddress,
  limitDate,
  endDate,
  wagerBetDirection,
  betAmount,
  network,
  webmode
) {
  const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const isAppOpted = await isApplicationOpted(
    senderAddress,
    WagerAppID(network),
    network
  );

  if (!isAppOpted) {
    // optin to app first (only if not optedIn first)
    const optInParams = {
      type: types.TransactionType.OptInToApp,
      sign: types.SignType.SecretKey,
      fromAccountAddr: senderAddress,
      appID: WagerAppID(network),
      payFlags: { totalFee: 1000 },
    };
    await tryExecuteTx(webmode, optInParams);
  }

  const appArgs = [
    `int:${limitDate}`, // limit_date
    `int:${endDate}`, // end_date
    `str:${wagerBetDirection}`, // wager bet direction
  ];

  const txGroup = [
    // call to wager app
    {
      type: types.TransactionType.CallApp,
      sign: types.SignType.SecretKey,
      fromAccountAddr: senderAddress,
      appID: WagerAppID(network),
      payFlags: { totalFee: 1000 },
      appArgs: [AppActions.NEW_BET, ...appArgs],
      foreignAssets: [algoUsdcASA],
    },
    // payment (bet)
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccountAddr: senderAddress,
      toAccountAddr: getApplicationAddress(WagerAppID(network)),
      amountMicroAlgos: BigInt(betAmount * 1e6),
      payFlags: { totalFee: 1000 },
    },
  ];

  await tryExecuteTx(webmode, txGroup);
}
