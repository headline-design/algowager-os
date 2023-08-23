const { accounts, fundAccount } = require('./common/accounts');

async function run(runtimeEnv, deployer) {
  console.log("Sample script has started execution!");
  const { admin, userA, userB, fee } = accounts(deployer);

  console.log('admin account:', admin);

  // fund account
  //await fundAccount(deployer, [admin, userA, userB, fee]);

  //const optimumASA = await deployer.deployASA('ALGO_USDC', { creator: admin });
  //console.log(optimumASA);
}

module.exports = { default: run };