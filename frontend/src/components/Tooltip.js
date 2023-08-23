import * as React from "react";
import { styled } from "@mui/material/styles";
import Tooltip, { tooltipClasses } from "@mui/material/Tooltip";
import { Color } from "../lib/constants";

const LightTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: Color.RED,
    color: Color.DARK_YELLOW,
    boxShadow: theme.shadows[1],
    fontSize: "1.5rem",
  },
}));

const CustomToolTip = ({ children, title }) => {
  return (
    <div>
      {title ? <LightTooltip title={title}>{children}</LightTooltip> : children}
    </div>
  );
};

export default CustomToolTip;
