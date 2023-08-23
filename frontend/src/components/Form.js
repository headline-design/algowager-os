/* global AlgoSigner */
import React, { useEffect, useState } from "react";
import { Button, Dialog, DialogTitle, Paper } from "@mui/material";
import CustomTextField from "./CustomTextField";
import { connect } from "react-redux";
import { addError, addSuccess } from "../redux/feedback_reducer";
import Loader from "./Loader";
import { WageDirection } from "../lib/constants";
import { placeNewBet } from "../utils/place_new_bet";
import { convertDateToSeconds } from "../lib/date";
const { WebMode } = require("@algo-builder/web");

function Form(props) {
  const web = new WebMode(AlgoSigner, props.selected_network);
  const [openModal, setOpenModal] = useState(true);
  const handleCloseModal = () => setOpenModal(false);
  const [limitDate, setLimitDate] = useState(null);
  const [limitDateError, setLimitDateError] = useState(null);

  const [endDate, setEndDate] = useState(null);
  const [endDateError, setEndDateError] = useState(null);

  const [direction, setDirection] = useState(null);
  const [directionError, setDirectionError] = useState(null);

  const [algoAmt, setAlgoAmt] = useState(undefined);
  const [amtError, setAmtError] = useState("");

  const [isBackdropActive, setBackdropActive] = useState(false);

  useEffect(() => {
    props.closeModal(openModal);
  }, [openModal]);
  const minDate = new Date().valueOf();

  async function handleClick() {
    let error = false;
    if (!limitDate) {
      setLimitDateError("Please input your limit date.");
      error = true;
    }
    if (!endDate) {
      setEndDateError("Please input your limit date.");
      error = true;
    }
    if (!algoAmt) {
      setAmtError("Please input your algos bet amount.");
      error = true;
    }
    if (!direction) {
      setDirectionError("Please select the direction of your prediction.");
      error = true;
    }
    if (!error) {
      // place the bet
      setBackdropActive(true);
      await placeNewBet(
        props.address,
        convertDateToSeconds(limitDate),
        convertDateToSeconds(endDate),
        direction,
        algoAmt,
        props.selected_network,
        web
      )
        .then((response) => {
          setBackdropActive(false);
          setOpenModal(false);
          console.log("place new bet", response);
          props.addSuccess("Your bet has successfully been placed.");
        })
        .catch((error) => {
          setBackdropActive(false);
          setOpenModal(false);
          props.addError(error.message);
        });
    }
  }

  return (
    <Dialog
      sx={{
        backdropFilter: "blur(2px)",
      }}
      onClose={handleCloseModal}
      open={openModal}
    >
      <Loader loading={isBackdropActive} />
      <div
        className="modal"
        style={{
          minHeight: "25rem",
          minWidth: "43rem",
        }}
      >
        <DialogTitle className="modal_heading">Bet Details</DialogTitle>

        <div className="flexBox_column form_container">
          <h3>Available ASAs to Bet On:</h3>

          <Paper elevation={24} className="stats_card padding_sm pointer">
            ALGO USDC
          </Paper>

          <CustomTextField
            error={limitDateError}
            key="limitDate"
            label="Limit Date"
            variant="filled"
            className="textfield"
            type="datetime-local"
            value={limitDate || ""}
            onChange={(event) => {
              setLimitDate(event.target.value);
              if (new Date(event.target.value).valueOf() < minDate) {
                setLimitDateError("Please select future date and time.");
              } else setLimitDateError("");
            }}
            giveMargin={true}
            helperText={limitDateError}
          />
          <CustomTextField
            error={endDateError}
            key="endDate"
            label="End Date"
            variant="filled"
            className="textfield"
            type="datetime-local"
            value={endDate || ""}
            onChange={(event) => {
              setEndDate(event.target.value);
              if (new Date(event.target.value).valueOf() < minDate) {
                setEndDateError("Please select future date and time.");
              } else if (
                limitDate &&
                new Date(event.target.value).valueOf() <
                  new Date(limitDate).valueOf()
              ) {
                setEndDateError(
                  "Please select date and time later than limit date."
                );
              } else setEndDateError("");
            }}
            giveMargin={true}
            helperText={endDateError}
          />
          <CustomTextField
            error={amtError}
            key="amt"
            label="Bet Amount (in Algos)"
            variant="filled"
            className="textfield"
            type="number"
            value={algoAmt || ""}
            onChange={(event) => {
              setAmtError("");
              setAlgoAmt(event.target.value);
            }}
            giveMargin={true}
            helperText={amtError}
          />
          {console.log(directionError)}
          <h3>
            Your Prediction Direction:
            {directionError?.length > 0 && (
              <div
                style={{
                  color: "#d32f2f",
                  fontSize: "1.1rem",
                  fontWeight: 400,
                }}
              >
                {directionError}
              </div>
            )}
          </h3>

          <div className="flex_row">
            <div
              onClick={() => {
                setDirectionError("");
                setDirection(WageDirection.UP);
              }}
            >
              <Paper
                elevation={24}
                className={`padding_sm pointer unselected_stats_card ${
                  direction === WageDirection.UP ? "selected_stats_card" : ""
                }`}
              >
                UP
              </Paper>
            </div>
            <div
              onClick={() => {
                setDirectionError("");
                setDirection(WageDirection.DOWN);
              }}
            >
              <Paper
                className={`padding_sm pointer marginLeft_medium unselected_stats_card ${
                  direction === WageDirection.DOWN ? "selected_stats_card" : ""
                }`}
                elevation={24}
              >
                DOWN
              </Paper>
            </div>
          </div>
          <Button
            className="link_btn marginTop_small"
            onClick={handleClick}
            // disabled={optError || amtError}
          >
            Add bet
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

const mapStateToProps = (state) => {
  return {
    address: state.wallet.address,
    error: state.feedback.error,
    success: state.feedback.success,
    selected_network: state.wallet.selected_network,
    admin_addr: state.wallet.admin_addr,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    addError: (payload) => dispatch(addError(payload)),
    addSuccess: (payload) => dispatch(addSuccess(payload)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Form);
