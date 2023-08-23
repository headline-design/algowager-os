import * as WagerApp from "../../../contracts/artifacts/scripts/1-deploy-wager-app.js.cp.yaml";
import { LocalStateKeys, NetworkArray } from "../lib/constants";
import moment from "moment";
const { encodeAddress } = require("algosdk");
const { indexerClient } = require("./algob.config");

const networkKey = (network) => {
  switch (network) {
    case NetworkArray[1]:
      return "testnet";
    case NetworkArray[3]:
      return "default";
    default:
      break;
  }
};

const WagerAppID = (network) => {
  return Object.values(
    WagerApp.default[networkKey(network)].ssc["Wager App"]
  )[0].appID;
};

async function readAppLocalState(account, appID, network) {
  const accountInfoResponse = await indexerClient(network)
    .lookupAccountByID(account)
    .do();

  for (const app of accountInfoResponse.account["apps-local-state"]) {
    if (app.id === appID) {
      const localStateMap = new Map();
      if (app["key-value"]) {
        for (const g of app[`key-value`]) {
          const key = convertBase64ToString(g.key);
          if (g.value.type === 1) {
            localStateMap.set(key, g.value.bytes);
          } else {
            localStateMap.set(key, g.value.uint);
          }
        }
      }
      return localStateMap;
    }
  }
  return undefined;
}

async function tryExecuteTx(web, txnParams) {
  try {
    await web.executeTransaction(txnParams);
  } catch (e) {
    console.error("Transaction Failed", e);
    throw e;
  }
}

const now = moment(new Date()).unix();

function parseData(localState) {
  return {
    limit_date: localState.get(LocalStateKeys.LIMIT_DATE),
    end_date: localState.get(LocalStateKeys.END_DATE),
    wager_state: convertBase64ToString(
      localState.get(LocalStateKeys.WAGER_STATE)
    ),
    wager_amount: localState.get(LocalStateKeys.WAGER_AMOUNT),
    wager_bet_direction: convertBase64ToString(
      localState.get(LocalStateKeys.WAGER_BET_DIRECTION)
    ),
  };
}

function checkIfBetAlreadyExists(data, wagerAgainst, address) {
  let betAlreadyExists = false;
  if (data.length > 0) {
    for (const bet of data) {
      if (
        wagerAgainst === bet[LocalStateKeys.WAGER_FOR] &&
        address === bet[LocalStateKeys.WAGER_AGAINST]
      ) {
        betAlreadyExists = true;
      }
    }
  }
  return betAlreadyExists;
}

async function getBetsAccordingToTime(network) {
  const accounts = await indexerClient(network)
    .searchAccounts()
    .applicationID(WagerAppID(network))
    .do();

  const activeBets = [];
  const toBeClaimBets = [];
  const claimedBets = [];

  for (const acc of accounts.accounts) {
    let localState;
    try {
      localState = await readAppLocalState(
        acc.address,
        WagerAppID(network),
        network
      );
    } catch (error) {
      continue;
    }
    if (localState === undefined) {
      continue;
    }

    const limitDate = localState.get(LocalStateKeys.LIMIT_DATE);
    const endDate = localState.get(LocalStateKeys.END_DATE);
    const wagerState = convertBase64ToString(
      localState.get(LocalStateKeys.WAGER_STATE)
    );

    if (limitDate && endDate) {
      if (now < endDate) {
        let wagerAgainst = null;
        if (wagerState === LocalStateKeys.LIVE) {
          wagerAgainst = _getAddress(localState, LocalStateKeys.WAGER_AGAINST);
        }
        let data = {
          ...parseData(localState),
          [LocalStateKeys.WAGER_FOR]: acc.address,
        };
        if (wagerAgainst) data[LocalStateKeys.WAGER_AGAINST] = wagerAgainst;
        const betAlreadyExists = checkIfBetAlreadyExists(
          activeBets,
          wagerAgainst,
          acc.address
        );
        if (!betAlreadyExists) {
          activeBets.push(data);
        }
      } else if (now > endDate) {
        let wagerAgainst = null;
        if (localState.get(LocalStateKeys.WAGER_AGAINST)) {
          wagerAgainst = _getAddress(localState, LocalStateKeys.WAGER_AGAINST);
        }
        let data = {
          ...parseData(localState),
          [LocalStateKeys.WAGER_FOR]: acc.address,
        };
        if (wagerAgainst) data[LocalStateKeys.WAGER_AGAINST] = wagerAgainst;
        const betAlreadyExists = checkIfBetAlreadyExists(
          toBeClaimBets,
          wagerAgainst,
          acc.address
        );
        if (!betAlreadyExists) {
          toBeClaimBets.push(data);
        }
      }
    } else if (wagerState === LocalStateKeys.ENDED) {
      let wagerAgainst = null;
      if (localState.get(LocalStateKeys.WAGER_AGAINST)) {
        wagerAgainst = _getAddress(localState, LocalStateKeys.WAGER_AGAINST);
        let winnerAdd;
        let loserAddr;
        let data = {
          ...parseData(localState),
          [LocalStateKeys.WAGER_FOR]: acc.address,
        };
        if (wagerAgainst) {
          data[LocalStateKeys.WAGER_AGAINST] = wagerAgainst;
          if (
            localState.get(LocalStateKeys.WAGER_RESULT) === LocalStateKeys.WON
          ) {
            winnerAdd = acc.address;
            loserAddr = wagerAgainst;
          } else {
            winnerAdd = wagerAgainst;
            loserAddr = acc.address;
          }
          data[LocalStateKeys.WON] = winnerAdd;
          data[LocalStateKeys.LOST] = loserAddr;
        }
        const betAlreadyExists = checkIfBetAlreadyExists(
          claimedBets,
          wagerAgainst,
          acc.address
        );
        if (!betAlreadyExists) {
          claimedBets.push(data);
        }
      }
    }
  }

  return { activeBets, toBeClaimBets, claimedBets };
}
/**
 * Returns a list of accounts with open wagers
 * + We use the indexer to query all accounts opted in,
 */
async function getOpenWagers(network) {
  const accounts = await indexerClient(network)
    .searchAccounts()
    .applicationID(WagerAppID(network))
    .do();

  const openWagers = {};
  for (const acc of accounts.accounts) {
    let localState;
    try {
      localState = await readAppLocalState(
        acc.address,
        WagerAppID(network),
        network
      );
    } catch (error) {
      continue;
    }
    if (localState === undefined) {
      continue;
    }

    // state must be pending and wager limit date must be in future
    const wagerState = convertBase64ToString(
      localState.get(LocalStateKeys.WAGER_STATE)
    );
    const limitDate = localState.get(LocalStateKeys.LIMIT_DATE);
    if (wagerState === LocalStateKeys.PENDING && now < limitDate) {
      openWagers[acc.address] = {
        limit_date: limitDate,
        end_date: localState.get(LocalStateKeys.END_DATE),
        wager_state: wagerState,
        wager_amount: localState.get(LocalStateKeys.WAGER_AMOUNT),
        wager_bet_direction: convertBase64ToString(
          localState.get(LocalStateKeys.WAGER_BET_DIRECTION)
        ),
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
    new Uint8Array(Buffer.from(localState.get(key) ?? "", "base64"))
  );
};

const convertBase64ToString = (value) => {
  return Buffer.from(value ?? "", "base64").toString();
};

/**
 * Returns a list of "pairs" (live wagers against users)
 */
async function getLiveWagers(network) {
  const accounts = await indexerClient(network)
    .searchAccounts()
    .applicationID(WagerAppID(network))
    .do();

  const liveWagers = [];
  const marked = {}; // marked addresses (address which have already been included in live wagers)
  for (const acc of accounts.accounts) {
    let localState;
    try {
      localState = await readAppLocalState(
        acc.address,
        WagerAppID(network),
        network
      );
    } catch (error) {
      continue;
    }
    if (localState === undefined || marked[acc.address] === 1) {
      continue;
    }

    const wagerAgainst = _getAddress(localState, LocalStateKeys.WAGER_AGAINST);

    // below right field will only be present at the second account (who accepted the wager)
    if (
      wagerAgainst === undefined ||
      localState.get(LocalStateKeys.ASA_PRICE) !== undefined
    ) {
      continue;
    }

    // fetch the other account of the wager from the accounts array
    const idx = _getWagerAgainstAcc(accounts.accounts, wagerAgainst);
    const againstAcc = accounts.accounts[idx];
    if (againstAcc === undefined) {
      continue;
    }

    const againstAccLocalState = await readAppLocalState(
      againstAcc.address,
      WagerAppID(network),
      network
    );
    liveWagers.push([
      {
        address: acc.address,
        limit_date: localState.get(LocalStateKeys.LIMIT_DATE),
        end_date: localState.get(LocalStateKeys.END_DATE),
        wager_state: convertBase64ToString(
          localState.get(LocalStateKeys.WAGER_STATE)
        ),
        wager_amount: localState.get(LocalStateKeys.WAGER_AMOUNT),
        wager_bet_direction: convertBase64ToString(
          localState.get(LocalStateKeys.WAGER_BET_DIRECTION)
        ),
      },
      {
        address: againstAcc.address,
        limit_date: againstAccLocalState.get(LocalStateKeys.LIMIT_DATE),
        end_date: againstAccLocalState.get(LocalStateKeys.END_DATE),
        wager_state: convertBase64ToString(
          againstAccLocalState.get(LocalStateKeys.WAGER_STATE)
        ),
        wager_amount: againstAccLocalState.get(LocalStateKeys.WAGER_AMOUNT),
        wager_bet_direction: convertBase64ToString(
          againstAccLocalState.get(LocalStateKeys.WAGER_BET_DIRECTION)
        ),
        asa_price_at_wager_accept: againstAccLocalState.get(
          LocalStateKeys.ASA_PRICE
        ),
      },
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
function chunkArray(myArray, chunk_size) {
  var index = 0;
  var arrayLength = myArray.length;
  var tempArray = [];

  for (index = 0; index < arrayLength; index += chunk_size) {
    let myChunk = myArray.slice(index, index + chunk_size);
    // Do something if you want with the group
    tempArray.push(myChunk);
  }

  return tempArray;
}

async function isApplicationOpted(accountAddress, appID, network) {
  const accountInfo = await indexerClient(network)
    .lookupAccountAppLocalStates(accountAddress)
    .do();

  if (accountInfo?.["apps-local-states"]) {
    for (const app of accountInfo["apps-local-states"]) {
      if (app["id"] === appID) {
        return true;
      }
    }
  }
  return false;
}

const SUPPORTED_ASA_FOR_WAGER = {
  TESTNET: {
    ALGO_USDC: 14674378,
  },
  MAINNET: {
    ALGO_USDC: "",
  },
};

const ALGO_USDC_TESTNET_ORACLE_APP_ID = 53083112;

export {
  tryExecuteTx,
  chunkArray,
  getOpenWagers,
  getLiveWagers,
  SUPPORTED_ASA_FOR_WAGER,
  ALGO_USDC_TESTNET_ORACLE_APP_ID,
  WagerAppID,
  isApplicationOpted,
  getBetsAccordingToTime,
};
