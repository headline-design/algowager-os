const { types } = require('@algo-builder/web');
const { tryExecuteTx, SUPPORTED_ASA_FOR_WAGER, ALGO_USDC_TESTNET_ORACLE_APP_ID } = require('./common/common.js');
const { accounts } = require('./common/accounts');
const { getApplicationAddress } = require('algosdk');

/**
 * Deploy Wager App
 */
async function run(runtimeEnv, deployer) {
    const accts = accounts(deployer);
    const [admin, feeAcc] = [accts.admin, accts.fee];

    // Wager App Template params
    const templateParam = {
        ARG_FEE_ADDRESS: feeAcc.addr,
        ARG_ASA_ID: SUPPORTED_ASA_FOR_WAGER.TESTNET.ALGO_USDC,
        ARG_ORACLE_APP_ID: ALGO_USDC_TESTNET_ORACLE_APP_ID
    };

    // Create Application
    const wagerAppInfo = await deployer.deployApp(
        'wager-app.py',
        'clear.py',
        {
            sender: admin,
            localInts: 5,
            localBytes: 5,
            globalInts: 5,
            globalBytes: 10,
            appArgs: []
        },
        {},
        templateParam,
        'Wager App'
    );
    console.log(wagerAppInfo);

    // fund application account with some ALGO(2)
    const fundAppParams = {
        type: types.TransactionType.TransferAlgo,
        sign: types.SignType.SecretKey,
        fromAccount: admin,
        toAccountAddr: getApplicationAddress(wagerAppInfo.appID),
        amountMicroAlgos: 2e6,
        payFlags: { totalFee: 1000 }
    };

    console.log(`Funding Wager App (ID = ${wagerAppInfo.appID})`);
    await tryExecuteTx(deployer, fundAppParams);


    // ----- opt in to Wager app by feeAcc -----
    const optAppInfo = await deployer.getAppByName('Wager App');
    try {
        await deployer.optInAccountToApp(
            feeAcc,
            optAppInfo.appID,
            { totalFee: 1000 },
            {}
        );
        console.log('Wager App opt-in successfully by fee addr!');
    } catch (error) {
        // already opted in
        console.log('Wager App already opt-in by fee addr!');
    }
}

module.exports = { default: run };
