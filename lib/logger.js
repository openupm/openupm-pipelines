const logDebug = function (...args) {
  console.debug(...args);
};

const logError = function (...args) {
  console.error(...args);
};

module.exports = {
  logDebug,
  logError,
};
