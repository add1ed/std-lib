const { axios } = require("./lib/axios");
const cache = require("./lib/cache");
const finiteCuckooBag = require("./lib/finite-cuckoo-bag");
const middleware = require("./lib/middleware");
const _ = require("./lib/lodash");

module.exports = _;
module.exports.axios = axios;
module.exports.fetch = axios;
module.exports.cache = cache;
module.exports.finiteCuckooBag = finiteCuckooBag;
module.exports.brailer = finiteCuckooBag;
module.exports.middleware = middleware;
module.exports.arrayify = function arrayify(item) {
  return Array.isArray(item) ? item : [item];
};
