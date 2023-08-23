import React, { useState } from "react";
import { Button } from "@mui/material";
import ConnectWallet from "./ConnectWallet";
import { connect } from "react-redux";
import CurrentAccount from "./CurrentAccount";
import { truncateString } from "../lib/functions";
import { useNavigate } from "react-router-dom";
import { ImageSrc } from "../lib/constants";

function Header(props) {
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showCurrentModal, setShowCurrentModal] = useState(false);
  const handleWalletModal = () => setShowWalletModal(true);
  const handleCurrentModal = () => setShowCurrentModal(true);
  const navigate = useNavigate();

  return (
    <div>
      <div className="header">
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            cursor: "pointer",
          }}
        >
          {/* <img alt="_img" className="header_img" src={ImageSrc.LOGO} /> */}
          <h1 className="header_heading">Algo Wager</h1>
        </div>
        <Button
          size="large"
          variant="contained"
          onClick={props.address ? handleCurrentModal : handleWalletModal}
          className="header_btn"
        >
          {props.address
            ? truncateString(props.address, 10)
            : props.selected
            ? "Select Address"
            : "Connect Wallet"}
        </Button>
      </div>
      {showWalletModal && (
        <ConnectWallet closeModal={(state) => setShowWalletModal(state)} />
      )}
      {showCurrentModal && (
        <CurrentAccount closeModal={(state) => setShowCurrentModal(state)} />
      )}
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    selected: state.wallet.selected,
    address: state.wallet.address,
  };
};

export default connect(mapStateToProps)(Header);
