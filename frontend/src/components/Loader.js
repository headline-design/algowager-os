import { Backdrop, CircularProgress } from "@mui/material";
import { Color } from "../lib/constants";

const Loader = ({ loading }) => {
  return (
    <Backdrop
      sx={{
        color: "#fff",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
      open={loading}
    >
      <div>
        <div
          style={{
            fontSize: "2.7rem",
            color: Color.DARK_YELLOW,
            marginRight: 10,
            fontWeight: "bolder",
          }}
        >
          Processing your request
        </div>
      </div>
      <CircularProgress
        style={{
          color: Color.DARK_YELLOW,
        }}
      />
    </Backdrop>
  );
};

export default Loader;
