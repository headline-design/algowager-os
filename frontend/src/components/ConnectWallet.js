/* global AlgoSigner */
import React, { useState, useEffect } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { connect } from "react-redux";

import {
  addChainAddressStore,
  changeNetwork,
  changeWallet,
  updateAddress,
  updateAdminAddr,
} from "../redux/wallet/actions";
import { addError } from "../redux/feedback_reducer";

import { Color, Wallet, NetworkArray } from "../lib/constants";
import { WagerAppID } from "../utils/common";
import { indexerClient } from "../utils/algob.config";

function ConnectWallet(props) {
  const [openModal, setOpenModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showAddressInfo, setShowAddressInfo] = useState(props.selected);
  const [accountInfoArray, setAccountInfoArray] = useState(
    props.account_store ? props.account_store : []
  );
  const [selectedAddress, setSelectedAddress] = useState(
    props.address ? props.address : undefined
  );

  const [selectedNetwork, setSelectedNetwork] = useState(
    props.selected_network
  );
  const handleCloseModal = () => setOpenModal(false);

  useEffect(() => {
    props.closeModal(openModal);
  }, [openModal]);

  async function getAccountInfo(value) {
    let accountStore = [];
    for (const acc of value) {
      if (acc && acc.address) {
        const accountInfo = await indexerClient(selectedNetwork)
          .lookupAccountByID(acc.address)
          .do();

        let account = accountInfo.account;
        accountStore.push({
          address: account.address,
          amount: account.amount / 1e6,
        });
      }
    }
    setAccountInfoArray(accountStore);
    return accountStore;
  }

  const handleClick = async (selectedWallet) => {
    if (selectedWallet === Wallet.ALGOSIGNER) {
      if (typeof AlgoSigner !== "undefined") {
        AlgoSigner.connect()
          .then(async (d) => {
            const address =
              (await AlgoSigner.accounts({
                ledger: selectedNetwork,
              })) ?? [];
            if (address.length) {
              props.changeWallet(Wallet.ALGOSIGNER);
              // fetching only if new address is added to wallet (since network change is not allowed by sign out)
              if (address.length !== accountInfoArray.length) {
                setLoading(true);
                const accountInfo = await getAccountInfo(address);
                setLoading(false);
                props.addChainAddressStore(accountInfo);
              }
              setShowAddressInfo(true);
            }
          })
          .catch((e) => {
            console.error(e);
            props.addError(JSON.stringify(e));
            handleCloseModal();
          });
      } else {
        props.addError("AlgoSigner is NOT installed.");
        handleCloseModal();
      }
    }
  };

  async function addAdminAddr(network) {
    const applicationInfo = await indexerClient(network)
      .lookupApplications(WagerAppID(network))
      .do();

    if (applicationInfo && applicationInfo.application) {
      const creator = applicationInfo.application.params.creator;
      props.updateAdminAddr(creator);
    }
  }

  return (
    <div>
      <Dialog onClose={handleCloseModal} open={openModal}>
        <div className="modal">
          {/* network config */}
          {!selectedNetwork ? (
            <div>
              <DialogTitle className="modal_heading">
                Select Network
              </DialogTitle>
              <List sx={{ pt: 0 }} className="marginTop_small">
                {NetworkArray.map((network, index) => {
                  return (
                    <ListItem key={index}>
                      <Button
                        variant="contained"
                        className="modal_option"
                        onClick={async () => {
                          props.changeNetwork(network);
                          setSelectedNetwork(network);
                          await addAdminAddr(network);
                        }}
                      >
                        {network}
                      </Button>
                    </ListItem>
                  );
                })}
              </List>
            </div>
          ) : !showAddressInfo ? (
            // wallet config
            <div>
              <DialogTitle className="modal_heading">
                Connect to Wallet
              </DialogTitle>
              <List sx={{ pt: 0 }}>
                <ListItem>
                  <Button
                    variant="contained"
                    className="modal_option"
                    onClick={() => handleClick(Wallet.ALGOSIGNER)}
                  >
                    {loading ? (
                      <div>
                        Fetching Address
                        <CircularProgress
                          size="2rem"
                          style={{
                            color: Color.RED,
                            marginLeft: 10,
                          }}
                        />
                      </div>
                    ) : (
                      "Connect to AlgoSigner"
                    )}
                  </Button>
                </ListItem>
              </List>
            </div>
          ) : (
            // address config
            <div>
              <DialogTitle className="modal_heading">
                Select Address
              </DialogTitle>
              <List sx={{ pt: 0 }}>
                <div className="address_list_container padding_sm list_header">
                  <div>Address</div>
                  <div>Amount</div>
                </div>
                {accountInfoArray.map((account, index) => {
                  const labelId = `checkbox-list-label-${index}`;
                  return (
                    <ListItem style={{ padding: 0 }} key={index}>
                      <ListItemButton
                        selected={selectedAddress === account.address}
                        onClick={() => {
                          setSelectedAddress(account.address);
                          props.updateAddress(account.address);
                          setTimeout(() => {
                            handleCloseModal();
                          }, 500);
                        }}
                        dense
                        className="padding_extra_sm"
                      >
                        <ListItemText
                          className="padding_sm"
                          style={{
                            backgroundColor:
                              selectedAddress === account.address
                                ? Color.DARK_YELLOW
                                : Color.RED,
                          }}
                          id={labelId}
                          primary={
                            <div className="address_list_container list_item">
                              <div>
                                {account.address.substring(0, 12)}
                                ...
                              </div>
                              <div>{account.amount}</div>
                            </div>
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  );
                })}
              </List>
            </div>
          )}
        </div>
      </Dialog>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    selected: state.wallet.selected,
    address: state.wallet.address,
    error: state.feedback.error,
    account_store: state.wallet.account_store,
    selected_network: state.wallet.selected_network,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeWallet: (payload) => dispatch(changeWallet(payload)),
    updateAddress: (payload) => dispatch(updateAddress(payload)),
    addError: (payload) => dispatch(addError(payload)),
    addChainAddressStore: (payload) => dispatch(addChainAddressStore(payload)),
    changeNetwork: (payload) => dispatch(changeNetwork(payload)),
    updateAdminAddr: (payload) => dispatch(updateAdminAddr(payload)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(ConnectWallet);
