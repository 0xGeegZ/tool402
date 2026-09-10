type BrowserLogger = {
  log: () => void;
  error: () => void;
  warn: () => void;
  info: () => void;
  debug: () => void;
  trace: () => void;
};

const noop = () => undefined;

class BrowserTransport {}

export const createLogger = (): BrowserLogger => ({
  log: noop,
  error: noop,
  warn: noop,
  info: noop,
  debug: noop,
  trace: noop,
});

export const format = {
  combine: () => ({}),
  timestamp: () => ({}),
  errors: () => ({}),
  json: () => ({}),
  printf: () => ({}),
};

export const transports = {
  Console: BrowserTransport,
  File: BrowserTransport,
};

export default {
  createLogger,
  format,
  transports,
};
