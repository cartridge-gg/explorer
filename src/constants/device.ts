export const isMac =
  typeof navigator !== "undefined" &&
  navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
