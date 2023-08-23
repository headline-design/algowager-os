const {
  executeTransaction
} = require('@algo-builder/algob');
const { types } = require('@algo-builder/web');

/**
 * Fund accounts from master with 20 Algos
 * @param deployer algobDeployer
 * @param accounts account or list of accounts to fund
 */
async function fundAccount (deployer, accounts) {
  const master = deployer.accountsByName.get('master');
  const params = [];
  if (!(accounts instanceof Array)) {
    accounts = [accounts];
  }
  for (const a of accounts) {
    console.log(`* Funding Account: ${a.name} *`);
    params.push({
      type: types.TransactionType.TransferAlgo,
      sign: types.SignType.SecretKey,
      fromAccount: master,
      toAccountAddr: a.addr,
      amountMicroAlgos: 600e6,
      payFlags: { totalFee: 1000, note: 'funding account' }
    });
  }

  try {
    await executeTransaction(deployer, params);
  } catch (e) {
    console.error('Transaction Failed', e.response ? e.response.error.text : e);
  }
};

/**
 * This function loads accounts from deployer
 * @param deployer deployer object
 */
function accounts (deployer) {
  return {
    admin: deployer.accountsByName.get('john'),
    userA: deployer.accountsByName.get('elon-musk'),
    userB: deployer.accountsByName.get('alice'),
    // fee wallet (to collect fees)
    fee: deployer.accountsByName.get('fee'),
  };
};

module.exports = {
  fundAccount,
  accounts
};