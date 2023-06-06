const LRU = require("lru-cache");
const debug = require("debug")("add1ed:std-lib:cache");

const RESET_KEY = "__reset_xd04vbhjrr";

module.exports = function (keyFn, underlyingFn, opts = {}) {
  const log = opts.logger
    ? opts.logger.child({ component: "cache" })
    : { info() {} };

  let resetEpochSeconds = Number.MIN_SAFE_INTEGER;
  const resetCheck = opts.reset;
  const resetMaxAge = opts.resetMaxAge || 1000 * 60 * 20; // defaults to 20 minutes;

  const config = { ...{ max: 60000, maxAge: 1000 * 60 * 20 }, ...opts.cache };

  const cache = initCache();

  function initCache() {
    const inner = new LRU(config);

    return {
      get(name) {
        debug("getting %s", name);
        const item = inner.get(name);
        if (item) debug("got item for %s", name);
        else debug("failed to get item for %s", name);
        return item;
      },

      set(name, obj, maxAge) {
        debug("setting %s to %o", name, obj);
        if (maxAge !== undefined) debug("with maxAge %d", maxAge);
        const success = inner.set(name, obj, maxAge);
        debug("successfully set cache for %s", name);
        return success;
      },

      reset() {
        debug("resetting the cache");
        inner.reset();
        debug("successfully reset the cache");
      },
    };
  }

  async function resetter() {
    if (!resetCheck) return;

    let timestamp = cache.get(RESET_KEY);
    debug("found reset timestamp: %d", timestamp);

    const found = !!timestamp;

    if (!found) {
      timestamp = await resetCheck();
      debug("computed reset timestamp: %d", timestamp);
    }

    if (timestamp > resetEpochSeconds) {
      cache.reset();
      resetEpochSeconds = timestamp;
    }

    if (!found) {
      cache.set(RESET_KEY, timestamp, resetMaxAge);
    }
  }

  async function itemCacheWrapper(key) {
    await resetter();

    const found = cache.get(key);

    debug("found item: %o", found);

    if (found) {
      log.info("Requested item %s found in cache", key);
      return found;
    }

    const retrieved = await underlyingFn(key);

    debug("retrieved the following item from underlying store: %o", retrieved);

    if (retrieved) {
      cache.set(keyFn(retrieved), retrieved);
      return retrieved;
    } else {
      return null;
    }
  }

  async function arrayCacheWrapper(keys) {
    await resetter();

    // 'partition' the distinct keys based on whether we have the item in cache
    const { found, missing } = [...new Set(keys)].reduce((acc, key) => {
      const item = cache.get(key);
      if (item) acc.found.push(item);
      else acc.missing.push(key);
      return acc;
    }, { found: [], missing: [] });

    debug("found items: %o", found);

    debug("missing items: %o", missing);

    if (missing.length === 0) {
      log.info("All %d requested item(s) found in cache", found.length);
      return found;
    }

    log.info(
      { missing },
      "Found %d item(s) in cache. Calling underlying function with %d missing item(s)",
      found.length,
      missing.length,
    );

    const retrieved = await underlyingFn(missing);

    debug(
      "retrieved the following %d items from underlying store: %o",
      retrieved.length,
      retrieved,
    );

    // add to cache
    retrieved.forEach((item) => cache.set(keyFn(item), item));

    return found.concat(retrieved);
  }

  return opts.array === true ? arrayCacheWrapper : itemCacheWrapper;
};
