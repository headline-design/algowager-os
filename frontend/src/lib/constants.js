export const Wallet = {
  ALGOSIGNER: "AlgoSigner",
};

export const Color = {
  DARK_YELLOW: "#d2c500",
  RED: "#890f0d",
  YELLOW: "#fff323",
};

export const Routes = {
  HOME: "/",
  ADMIN: "/admin",
};

export const ImageSrc = {
  LOGO: "https://cdn.discordapp.com/attachments/953368390834217002/970019718050238524/opt-logo-sharp.png",
};

export const LocalStateKeys = {
  WAGER_STATE: "wager_state",
  LIMIT_DATE: "limit_date",
  PENDING: "PENDING",
  LIVE: "LIVE",
  ENDED: "ENDED",
  END_DATE: "end_date",
  WAGER_AMOUNT: "wager_amount",
  WAGER_BET_DIRECTION: "wager_bet_direction",
  WAGER_AGAINST: "wager_against",
  ASA_PRICE: "asa_price_at_wager_accept",
  WAGER_FOR: "wager_for",
  WON: "WON",
  LOST: "LOST",
  WAGER_RESULT: "wager_result",
};

export const AppActions = {
  ACCEPT_BET: "str:accept_bet",
  DECIDE_WINNER: "str:decide_winner",
  NEW_BET: "str:place_new_bet",
};

export const WageDirection = {
  UP: "UP",
  DOWN: "DOWN",
};

export const NetworkArray = ["MainNet", "TestNet", "BetaNet", "private-net"];

export const AlgoExplorerAlgodURL = {
  MAIN_NET_URL: "https://node.algoexplorerapi.io",
  TEST_NET_URL: "https://node.testnet.algoexplorerapi.io",
  BETA_NET_URL: "https://node.betanet.algoexplorerapi.io",
};

export const AlgoExplorerIndexerURL = {
  MAIN_NET_URL: "https://algoindexer.algoexplorerapi.io",
  TEST_NET_URL: "https://algoindexer.testnet.algoexplorerapi.io",
  BETA_NET_URL: "https://algoindexer.betanet.algoexplorerapi.io",
};

export const PurestakeAlgodURL = {
  MAIN_NET_URL: "https://mainnet-algorand.api.purestake.io/ps2",
  TEST_NET_URL: "https://testnet-algorand.api.purestake.io/ps2",
  BETA_NET_URL: "https://betanet-algorand.api.purestake.io/ps2",
};

export const PurestakeIndexerURL = {
  MAIN_NET_URL: "https://mainnet-algorand.api.purestake.io/idx2",
  TEST_NET_URL: "https://testnet-algorand.api.purestake.io/idx2",
  BETA_NET_URL: "https://betanet-algorand.api.purestake.io/idx2",
};

export const LOCAL_HOST = "http://localhost";

export const GovernanceAddr = "Governance Address";

export const TIMEOUT = 500; // for success and error messages

export const TimeValues = {
  ACTIVE: "Active",
  CLAIM: "Claim",
};

export const WalletAddressError =
  "Please connect to your account using the wallet.";
