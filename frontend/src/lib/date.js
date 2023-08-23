import moment from "moment";

export function convertDateToSeconds(value) {
  return moment(value).unix();
}

export function convertSecondsToDate(value) {
  return moment.unix(value).format("lll");
}
