import React, { useState, useEffect } from "react";
import "./style.css";
import Home from "./pages/Home";
import Header from "./components/Header";
import { Alert } from "@mui/material";
import { connect } from "react-redux";
import { removeError, removeSuccess } from "./redux/feedback_reducer";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Admin from "./pages/Admin";
import { Routes as RouteConstant } from "./lib/constants";

const PrivateRoute = ({ admin, children }) => {
  return admin ? children : <Navigate to="/" />;
};
function App(props) {
  const [isAdminLogged, setAdminLog] = useState(props.is_admin_logged);

  useEffect(() => {
    setAdminLog(props.is_admin_logged);
  }, [props.is_admin_logged]);

  return (
    <div>
      <Router>
        {props.error && (
          <div className="padding_sm">
            <Alert
              variant="filled"
              severity="error"
              onClose={() => props.removeError()}
            >
              <div className="font_size_small">{props.error}</div>
            </Alert>
          </div>
        )}
        {props.success && (
          <div className="padding_sm">
            <Alert
              variant="filled"
              severity="success"
              onClose={() => props.removeSuccess()}
            >
              <div className="font_size_small">{props.success}</div>
            </Alert>
          </div>
        )}
        <Header />
        <Routes>
          <Route path={RouteConstant.HOME} element={<Home />} />
          <Route
            path={RouteConstant.ADMIN}
            element={
              <PrivateRoute admin={isAdminLogged}>
                <Admin />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

const mapStateToProps = (state) => {
  return {
    error: state.feedback.error,
    success: state.feedback.success,
    is_admin_logged: state.wallet.is_admin_logged,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeError: () => dispatch(removeError()),
    removeSuccess: () => dispatch(removeSuccess()),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
