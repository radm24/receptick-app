import { TIMEOUT_SEC } from './config.js';

/**
 * Returns rejected promise after a given amount of seconds.
 * @param {number} s Timeout seconds
 * @returns {Promise}
 */
const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} second`));
    }, s * 1000);
  });
};
/**
 * Makes a request to a given URL and returns promise with result.
 * @param {string} url URL
 * @param {Object} [opts] Request options
 * @returns {Promise}
 */
const AJAX = async (url, opts) => {
  try {
    const options = { ...opts };

    const res = await Promise.race([fetch(url, options), timeout(TIMEOUT_SEC)]);
    const data = await res.json();

    if (!res.ok) throw new Error(`${data.message} (${res.status})`);
    return data;
  } catch (err) {
    throw err;
  }
};

/**
 * Returns timestamp of the current date.
 * @returns {number}
 */
const getCurrentDateTS = () => new Date().setHours(0, 0, 0, 0);

export { AJAX, getCurrentDateTS };
