const {
  executeTransaction, readAppLocalState
} = require('@algo-builder/algob');
const { getApplicationAddress, encodeAddress } = require('algosdk');

async function tryExecuteTx (deployer, txnParams) {
  try {
    await executeTransaction(deployer, txnParams);
  } catch (e) {
    console.error('Transaction Failed', e.response?.body ?? e.response ?? e.body ?? e);
  }
};

const now = Math.round(Date.now() / 1000);

/**
 * Returns a list of accounts with open wagers
 * + We use the indexer to query all accounts opted in,
 */
async function getOpenWagers(deployer, wagerAppID) {
  const iClient = deployer.indexerClient;
  const accounts = await iClient.searchAccounts()
    .applicationID(wagerAppID)
    .do();

  const openWagers = {};
  for (const acc of accounts.accounts) {
    let localState;
    try {
      localState = await readAppLocalState(deployer, acc.address, wagerAppID);
    } catch (error) {
      continue;
    }
    if (localState === undefined) { continue; }

    // state must be pending and wager limit date must be in future
    const wagerState =  Buffer.from(localState.get('wager_state') ?? '', 'base64').toString();
    const limitDate = localState.get('limit_date');
    if (wagerState === "PENDING" && now < limitDate) {
      openWagers[acc.address] = {
        "limit_date": limitDate,
        "end_date": localState.get("end_date"),
        "wager_state": wagerState,
        "wager_amount": localState.get("wager_amount"),
        "wager_bet_direction": Buffer.from(localState.get('wager_bet_direction') ?? '', 'base64').toString()
      };
    }
  }

  return openWagers;
}


// returns the index of the account which has betted "against this account" (passed in function param)
function _getWagerAgainstAcc(accounts, againstAddress) {
  for (let i = 0; i < accounts.length; ++i) {
    if (accounts[i].address === againstAddress) {
      return i; 
    }
  }

  return -1;
}

const _getAddress = (localState, key) => {
  return encodeAddress(
    new Uint8Array(Buffer.from(localState.get(key) ?? '', "base64"))
  );
}

/**
 * Returns a list of "pairs" (live wagers against users)
 */
 async function getLiveWagers(deployer, wagerAppID) {
  const iClient = deployer.indexerClient;
  const accounts = await iClient.searchAccounts()
    .applicationID(wagerAppID)
    .do();
  
  const liveWagers = [];
  const marked = {}; // marked addresses (address which have already been included in live wagers)
  for (const acc of accounts.accounts) {
    let localState;
    try {
      localState = await readAppLocalState(deployer, acc.address, wagerAppID);
    } catch (error) {
      continue;
    }
    if (localState === undefined || marked[acc.address] === 1) { continue; }
    
    const wagerAgainst = _getAddress(localState, 'wager_against');

    // below right field will only be present at the second account (who accepted the wager)
    if (wagerAgainst === undefined || localState.get('asa_price_at_wager_accept') !== undefined) { continue; }

    // fetch the other account of the wager from the accounts array
    const idx = _getWagerAgainstAcc(accounts.accounts, wagerAgainst);
    const againstAcc = accounts.accounts[idx];
    if (againstAcc === undefined) { continue; }

    const againstAccLocalState = await readAppLocalState(deployer, againstAcc.address, wagerAppID);
    liveWagers.push([
      {
        "address": acc.address,
        "limit_date": localState.get('limit_date'),
        "end_date": localState.get("end_date"),
        "wager_state": Buffer.from(localState.get('wager_state') ?? '', 'base64').toString(),
        "wager_amount": localState.get("wager_amount"),
        "wager_bet_direction": Buffer.from(localState.get('wager_bet_direction') ?? '', 'base64').toString()
      },
      {
        "address": againstAcc.address,
        "limit_date": againstAccLocalState.get('limit_date'),
        "end_date": againstAccLocalState.get("end_date"),
        "wager_state": Buffer.from(againstAccLocalState.get('wager_state') ?? '', 'base64').toString(),
        "wager_amount": againstAccLocalState.get("wager_amount"),
        "wager_bet_direction": Buffer.from(againstAccLocalState.get('wager_bet_direction') ?? '', 'base64').toString(),
        "asa_price_at_wager_accept": againstAccLocalState.get('asa_price_at_wager_accept')
      }
    ]);

    marked[acc.address] = 1;
    marked[againstAcc.address] = 1;
  }

  return liveWagers;
}

/**
 * Returns an array with arrays of the given size.
 *
 * @param myArray {Array} array to split
 * @param chunk_size {Integer} Size of every group
 */
function chunkArray(myArray, chunk_size){
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    myChunk = myArray.slice(index, index+chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

const SUPPORTED_ASA_FOR_WAGER = {
  TESTNET: {
    ALGO_USDC: 14674378
  },
  MAINNET: {
    ALGO_USDC: ""
  }
}

const ALGO_USDC_TESTNET_ORACLE_APP_ID = 53083112;

module.exports = {
  tryExecuteTx,
  chunkArray,
  getOpenWagers,
  getLiveWagers,
  SUPPORTED_ASA_FOR_WAGER,
  ALGO_USDC_TESTNET_ORACLE_APP_ID
};