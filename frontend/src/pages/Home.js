/* global AlgoSigner */
import React, { useEffect, useState } from "react";
import {
  Alert,
  AlertTitle,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
} from "@mui/material";
import { connect } from "react-redux";
import { changeWallet, updateAddress } from "../redux/wallet/actions";
import Form from "../components/Form";
import {
  Color,
  LocalStateKeys,
  Routes,
  TimeValues,
  WageDirection,
  WalletAddressError,
} from "../lib/constants";
import { useNavigate } from "react-router-dom";
import CustomToolTip from "../components/Tooltip";
import { getBetsAccordingToTime } from "../utils/common";
import { convertSecondsToDate } from "../lib/date";
import { truncateString } from "../lib/functions";
import { decideWinnerForPair } from "../utils/decide_winner";
import { addError, addSuccess } from "../redux/feedback_reducer";
import Loader from "../components/Loader";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { acceptNewBet } from "../utils/accept_new_bet";
import moment from "moment";
import CelebrationIcon from "@mui/icons-material/Celebration";

const { WebMode } = require("@algo-builder/web");

const Description = ({ label, value }) => {
  return (
    <div className="flexBox_between description">
      <p>{label}</p>
      <p style={{ color: Color.RED, fontWeight: 500 }}>{value}</p>
    </div>
  );
};

function Home(props) {
  const web = new WebMode(AlgoSigner, props.selected_network);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isAdminLogged, setAdminLog] = useState(props.is_admin_logged);
  const [liveBets, setLiveBets] = useState([]);
  const [claimBet, setClaimBets] = useState([]);
  const navigate = useNavigate();
  const [selectedTime, setTime] = useState(TimeValues.ACTIVE);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(false);

  const [isBackdropActive, setBackdropActive] = useState(false);

  useEffect(async () => {
    setAdminLog(props.is_admin_logged);
    if (props.selected_network && !showFormModal && !isBackdropActive) {
      setLoading(true);
      const { activeBets, claimedBets, toBeClaimBets } =
        await getBetsAccordingToTime(props.selected_network);
      setLiveBets(activeBets);
      setData(activeBets);
      setClaimBets(claimedBets.concat(toBeClaimBets));

      setLoading(false);
    }
  }, [props, showFormModal, isBackdropActive]);

  useEffect(() => {
    setLoading(true);
    switch (selectedTime) {
      case TimeValues.CLAIM:
        setData(claimBet);
        break;
      default:
        setData(liveBets);
        break;
    }
    setLoading(false);
  }, [selectedTime, liveBets, claimBet]);

  function showButton(item) {
    if (selectedTime === TimeValues.CLAIM) {
      if (item[LocalStateKeys.WAGER_STATE] === LocalStateKeys.LIVE) {
        return (
          <CustomToolTip title={!props.address && WalletAddressError}>
            <span>
              <Button
                variant="contained"
                className="wager_btn"
                disabled={!props.address}
                onClick={async () => {
                  setBackdropActive(true);
                  await decideWinnerForPair(
                    props.admin_addr,
                    item[LocalStateKeys.WAGER_FOR],
                    item[LocalStateKeys.WAGER_AGAINST],
                    props.selected_network,
                    web
                  )
                    .then((response) => {
                      setBackdropActive(false);
                      console.log("decide winner", response);
                      props.addSuccess("Congratulations, Winner is declared.");
                    })
                    .catch((error) => {
                      setBackdropActive(false);
                      props.addError(error.message);
                    });
                }}
              >
                Decide Winner
              </Button>
            </span>
          </CustomToolTip>
        );
      } else if (item[LocalStateKeys.WAGER_STATE] === LocalStateKeys.PENDING) {
        return (
          <CustomToolTip title={!props.address && WalletAddressError}>
            <span>
              <Button
                disabled={!props.address}
                variant="contained"
                className="wager_btn"
                onClick={async () => {
                  // TODO
                  // setBackdropActive(true);
                  // .then((response) => {
                  //   setBackdropActive(false);
                  //   console.log("decide winner", response);
                  //   props.addSuccess("Algos are successfully reclaimed.");
                  // })
                  // .catch((error) => {
                  //   setBackdropActive(false);
                  //   props.addError(error.message);
                  // });
                }}
              >
                Reclaim your amount
              </Button>
            </span>
          </CustomToolTip>
        );
      }
    } else {
      if (
        item[LocalStateKeys.WAGER_STATE] === LocalStateKeys.PENDING &&
        moment(new Date()).unix() < item[LocalStateKeys.LIMIT_DATE]
      )
        return (
          <CustomToolTip
            title={
              (!props.address && WalletAddressError) ||
              (props.address === item[LocalStateKeys.WAGER_FOR] &&
                "You have created the bet.")
            }
          >
            <span>
              <Button
                disabled={
                  !props.address ||
                  props.address === item[LocalStateKeys.WAGER_FOR]
                }
                variant="contained"
                className="wager_btn"
                onClick={async () => {
                  setBackdropActive(true);
                  await acceptNewBet(
                    props.address,
                    item[LocalStateKeys.WAGER_FOR],
                    props.selected_network,
                    web
                  )
                    .then((response) => {
                      setBackdropActive(false);
                      console.log("accept new bet", response);
                      props.addSuccess(
                        "Congratulations, you have accepted the bet."
                      );
                    })
                    .catch((error) => {
                      setBackdropActive(false);
                      props.addError(error.message);
                    });
                }}
              >
                Accept Bet: Direction{" "}
                {LocalStateKeys.WAGER_BET_DIRECTION === WageDirection.UP
                  ? "DOWN"
                  : "UP"}
              </Button>
            </span>
          </CustomToolTip>
        );
      else if (item[LocalStateKeys.WAGER_STATE] === LocalStateKeys.LIVE)
        return (
          <Button variant="outlined" className="already_selected_btn">
            Bet Already Accepted
          </Button>
        );
      else
        return (
          <Button variant="outlined" className="already_selected_btn">
            TimeOut
          </Button>
        );
    }
  }
  const AddressDescription = ({ label, value }) => {
    return (
      <div className="flexBox_between description">
        <p style={{ fontWeight: 500 }}>{label}</p>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(value);
            setToast(true);
          }}
        >
          {truncateString(value, 13)}
          <ContentCopyIcon className="btn_icon" />
        </Button>
      </div>
    );
  };

  return (
    <div>
      <Loader loading={isBackdropActive} />
      {showFormModal && (
        <Form closeModal={(state) => setShowFormModal(state)} />
      )}
      {isAdminLogged && (
        <div className="about_admin_container">
          <h1 className="admin_heading">Welcome Back Admin </h1>
          <h2 onClick={() => navigate(Routes.ADMIN)} className="admin_link">
            View page
          </h2>
        </div>
      )}
      <div className="contract_container marginBottom_medium">
        <Paper elevation={24} className="stats_card">
          <div className="padding_sm flexBox_between">
            <h1>Place your own bet:</h1>
            <div>
              <CustomToolTip title={!props.address && WalletAddressError}>
                <span>
                  <Button
                    disabled={!props.address}
                    size="large"
                    variant="contained"
                    className="admin_btn_left"
                    onClick={() => {
                      setShowFormModal(true);
                    }}
                  >
                    Add
                  </Button>
                </span>
              </CustomToolTip>
            </div>
          </div>
        </Paper>
      </div>
      <div className="padding_sm">
        {props.selected_network ? (
          <div style={{ color: Color.DARK_YELLOW }}>
            <div className="marginBottom_medium">
              <h1>Predictions:</h1>
              <FormControl>
                <RadioGroup
                  onChange={(ev) => setTime(ev.target.value)}
                  value={selectedTime}
                  defaultValue={TimeValues.ACTIVE}
                  row
                  aria-labelledby="filter"
                  name="data filter"
                >
                  <FormControlLabel
                    value={TimeValues.ACTIVE}
                    control={<Radio />}
                    label={<div className="label"> Active</div>}
                  />
                  <FormControlLabel
                    value={TimeValues.CLAIM}
                    control={<Radio />}
                    label={<div className="label"> Claimed/Reclaim</div>}
                  />
                </RadioGroup>
              </FormControl>
            </div>
            <div>
              {loading ? (
                <div className="center">
                  <CircularProgress
                    style={{
                      color: Color.DARK_YELLOW,
                      backgroundColor: "black",
                    }}
                  />
                </div>
              ) : (
                <div>
                  {data.length > 0 ? (
                    <div className="admin_grid ">
                      {data.map((item, index) => {
                        const hasEnded =
                          item[LocalStateKeys.WAGER_STATE] ===
                          LocalStateKeys.ENDED;
                        return (
                          <Paper className="stats_card" key={index}>
                            <div className="padding_sm">
                              {!hasEnded && (
                                <Description
                                  label="Accepting bets until"
                                  value={convertSecondsToDate(
                                    item[LocalStateKeys.LIMIT_DATE]
                                  )}
                                />
                              )}
                              {!hasEnded && (
                                <Description
                                  label="Claim after"
                                  value={convertSecondsToDate(
                                    item[LocalStateKeys.END_DATE]
                                  )}
                                />
                              )}
                              <Description
                                label="Bet Amount"
                                value={
                                  item[LocalStateKeys.WAGER_AMOUNT] / 1e6 +
                                  " Algos"
                                }
                              />
                              <Description
                                label="Status"
                                value={item[LocalStateKeys.WAGER_STATE]}
                              />
                              <AddressDescription
                                label="Wager Address"
                                value={item[LocalStateKeys.WAGER_FOR]}
                              />
                              {item[LocalStateKeys.WAGER_AGAINST] && (
                                <AddressDescription
                                  label="Wager Acceptor Address"
                                  value={item[LocalStateKeys.WAGER_AGAINST]}
                                />
                              )}
                              {hasEnded && (
                                <div>
                                  {item[LocalStateKeys.WON] ? (
                                    <div className="winner_details">
                                      <span
                                        className="pointer"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            item[LocalStateKeys.WON]
                                          );
                                          setToast(true);
                                        }}
                                      >
                                        <CelebrationIcon /> Winner is{" "}
                                        {truncateString(
                                          item[LocalStateKeys.WON],
                                          13
                                        )}
                                        <ContentCopyIcon
                                          style={{ marginLeft: "0.1rem" }}
                                        />
                                      </span>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="winner_details">
                                        <span
                                          className="pointer"
                                          onClick={() => {
                                            navigator.clipboard.writeText(
                                              item[LocalStateKeys.WON]
                                            );
                                            setToast(true);
                                          }}
                                        >
                                          Reclaimed by{" "}
                                          {truncateString(
                                            item[LocalStateKeys.WAGER_FOR],
                                            13
                                          )}
                                          <ContentCopyIcon
                                            style={{ marginLeft: "0.1rem" }}
                                          />
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div style={{ textAlign: "center" }}>
                                {showButton(item)}
                              </div>
                            </div>
                          </Paper>
                        );
                      })}
                    </div>
                  ) : (
                    <Alert variant="filled" severity="warning">
                      <AlertTitle>
                        <div className="warning_title">
                          No {selectedTime} bets exists.
                        </div>
                      </AlertTitle>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <Alert variant="filled" severity="warning">
              <AlertTitle>
                <div className="warning_title">
                  Please connect to a network to get the Bet details.
                </div>
              </AlertTitle>
            </Alert>
          </div>
        )}
      </div>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={toast}
        onClose={() => setToast(false)}
        autoHideDuration={1000}
      >
        <Alert
          variant="filled"
          severity="error"
          icon={false}
          className="font_size_small"
        >
          Copied
        </Alert>
      </Snackbar>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    selected: state.wallet.selected,
    address: state.wallet.address,
    is_admin_logged: state.wallet.is_admin_logged,
    selected_network: state.wallet.selected_network,
    admin_addr: state.wallet.admin_addr,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    changeWallet: (payload) => dispatch(changeWallet(payload)),
    updateAddress: (payload) => dispatch(updateAddress(payload)),
    addError: (payload) => dispatch(addError(payload)),
    addSuccess: (payload) => dispatch(addSuccess(payload)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Home);
