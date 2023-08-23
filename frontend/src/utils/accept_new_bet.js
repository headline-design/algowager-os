const { types } = require("@algo-builder/web");
const {
  tryExecuteTx,
  getOpenWagers,
  ALGO_USDC_TESTNET_ORACLE_APP_ID,
  WagerAppID,
  isApplicationOpted,
} = require("./common.js");
const { getApplicationAddress } = require("algosdk");
const { AppActions, LocalStateKeys } = require("../lib/constants.js");

export async function acceptNewBet(
  senderAddress,
  betPlacerAddr,
  network,
  webmode
) {
  // Get ALGO_USDC ASA
  //const algoUsdcASA = deployer.asa.get('ALGO_USDC');
  //const algoUsdcASA = SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC;

  const openWagers = await getOpenWagers(network);

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
  console.log("open", openWagers);

  /*
   * In this call we're accepting the bet placed by userA
   */
  const txGroup = [
    // call to wager app
    {
      type: types.TransactionType.CallApp,
      sign: types.SignType.SecretKey,
      fromAccountAddr: senderAddress,
      appID: WagerAppID(network),
      payFlags: { totalFee: 1000 },
      appArgs: [AppActions.ACCEPT_BET],
      accounts: [betPlacerAddr],
      foreignApps: [ALGO_USDC_TESTNET_ORACLE_APP_ID],
    },
    // payment (bet)
    {
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccountAddr: senderAddress,
      toAccountAddr: getApplicationAddress(WagerAppID(network)),
      amountMicroAlgos: openWagers[betPlacerAddr][LocalStateKeys.WAGER_AMOUNT],
      payFlags: { totalFee: 1000 },
    },
  ];

  await tryExecuteTx(webmode, txGroup);
}
