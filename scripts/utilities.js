// utilities.js - logging, helpers
export function log(msg) {
  try {
    console.log(msg);
  } catch (e) {}
}

export function error(msg) {
  try {
    console.error(msg);
  } catch (e) {}
}

export function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
