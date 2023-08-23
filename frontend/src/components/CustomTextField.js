import * as React from "react";
import { CircularProgress, InputAdornment, TextField } from "@mui/material";
import styled from "@emotion/styled";
import { Color } from "../lib/constants";

const CssTextField = styled(TextField)({
  "& .MuiFilledInput-root": {
    "&:after": {
      borderBottom: "2px solid yellow",
    },
  },
  "& .MuiFormHelperText-root": {
    fontSize: "1.2rem",
  },
  "MuiInputBase-input-MuiFilledInput-input.Mui-disabled": {
    color: Color.YELLOW,
  },
  input: {
    color: Color.YELLOW,
    fontSize: "1.5rem",
    WebkitTextFillColor: `${Color.DARK_YELLOW} !important`,
  },
  label: {
    color: `${Color.DARK_YELLOW} !important`,
    fontSize: "1.5rem",
    WebkitTextFillColor: `${Color.DARK_YELLOW} !important`,
    "&.Mui-focused": {
      color: Color.DARK_YELLOW,
    },
  },
});

export default function CustomTextField({
  error,
  key,
  label,
  variant,
  className,
  type,
  value,
  disabled,
  onChange,
  helperText,
  giveMargin,
  showLoader,
}) {
  return (
    <div style={{ marginBlock: giveMargin ? 10 : 0 }}>
      <CssTextField
        InputLabelProps={{
          shrink: true,
        }}
        fullWidth
        error={error}
        key={key}
        label={label}
        variant={variant}
        className={className}
        type={type}
        value={value}
        disabled={disabled}
        onChange={onChange}
        helperText={helperText}
        InputProps={
          showLoader && {
            startAdornment: (
              <InputAdornment position="start">
                <CircularProgress
                  size="1.5rem"
                  style={{
                    color: Color.DARK_YELLOW,
                  }}
                />
              </InputAdornment>
            ),
          }
        }
      ></CssTextField>
    </div>
  );
}
