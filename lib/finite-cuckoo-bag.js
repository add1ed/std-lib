const _ = require("./lodash");

module.exports = function (opts) {
  const config = { maxHits: (opts && opts.maxHits) || 1 };
  const store = {};

  return { add, drain, full, has, hits, isEmpty, seen };

  function add(k, v) {
    if (_.isNil(k)) throw new Error("you haven't specified a key");
    if (!store[k]) store[k] = { total: 0, values: [] };
    if (store[k].total < config.maxHits) {
      store[k].total++;
      store[k].values.push(v);
      return true;
    } else {
      return false;
    }
  }

  function drain(k) {
    return _.isNil(k) ? _drainAll() : _drainOne(k);
  }

  function isEmpty() {
    return _.every((it) => it.values.length === 0)(_.values(store));
  }

  function full(k) {
    if (_.isNil(k)) throw new Error("you haven't specified a key");
    return !!store[k] && store[k].total === config.maxHits;
  }

  function has(k) {
    if (_.isNil(k)) throw new Error("you haven't specified a key");

    return !!store[k] ? store[k].values.length > 0 : false;
  }

  function hits(k) {
    return _.isNil(k)
      ? _.sumBy("total")(_.values(store))
      : (!!store[k] && store[k].total) || 0;
  }

  function seen(k) {
    return !!store[k];
  }

  function _drainOne(k) {
    return (!!store[k] && store[k].values.splice(0)) || [];
  }

  function _drainAll() {
    return _.pipe(
      _.values,
      _.filter((it) => it.values.length),
      _.map((it) => it.values.splice(0)),
      _.flatten,
    )(store);
  }
};
