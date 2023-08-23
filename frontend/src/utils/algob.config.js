const { default: algosdk } = require("algosdk");
const {
  NetworkArray,
  PurestakeAlgodURL,
  LOCAL_HOST,
  PurestakeIndexerURL,
} = require("../lib/constants");

const PurestakeToken = {
  "X-API-Key": "TgxWI5WBWNUlKgWik5j4ayezLDkb71J5VTw1mzd6",
};
function getNetworkAlgodConfig(networkType) {
  switch (networkType) {
    case NetworkArray[0]:
      return {
        token: PurestakeToken,
        server: PurestakeAlgodURL.MAIN_NET_URL,
        port: "",
      };
    case NetworkArray[1]:
      return {
        token: PurestakeToken,
        server: PurestakeAlgodURL.TEST_NET_URL,
        port: "",
      };
    case NetworkArray[2]:
      return {
        token: "",
        server: PurestakeAlgodURL.BETA_NET_URL,
        port: "",
      };
    case NetworkArray[3]:
      return {
        token:
          "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        server: LOCAL_HOST,
        port: 4001,
      };
    default:
      return {
        token: "",
        server: "",
        port: "",
      };
  }
}

function getNetworkIndexerConfig(networkType) {
  switch (networkType) {
    case NetworkArray[0]:
      return {
        token: PurestakeToken,
        server: PurestakeIndexerURL.MAIN_NET_URL,
        port: "",
      };
    case NetworkArray[1]:
      return {
        token: PurestakeToken,
        port: "",
        server: PurestakeIndexerURL.TEST_NET_URL,
      };
    case NetworkArray[2]:
      return {
        token: PurestakeToken,
        server: PurestakeIndexerURL.BETA_NET_URL,
        port: "",
      };
    case NetworkArray[3]:
      return {
        token: "",
        server: LOCAL_HOST,
        port: 8980,
      };
    default:
      return {
        token: "",
        server: "",
        port: "",
      };
  }
}

const indexerClient = (network) => {
  const walletURL = getNetworkIndexerConfig(network);
  return new algosdk.Indexer(walletURL.token, walletURL.server, walletURL.port);
};

const algodClient = (network) => {
  const walletURL = getNetworkAlgodConfig(network);

  return new algosdk.Algodv2(walletURL.token, walletURL.server, walletURL.port);
};

module.exports = {
  indexerClient,
  algodClient,
};
