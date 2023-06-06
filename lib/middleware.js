const _ = require("./lodash");
const E = require("http-errors");

// fn : (req, res) -> Promise unit
function reqHandlerMiddleware(fn) {
  return async function handler(req, res, next) {
    try {
      await fn(req, res);
    } catch (e) {
      return next(e);
    }
  };
}

function reqHandlerWrap(data) {
  return { data };
}

function reqHandlerUnwrap({ data }) {
  return data;
}

function normalizeAxiosError(error) {
  if (error.response) {
    const { status, data: { message, description, code } } = error.response;
    return new E(status, message, { code, description });
  }

  if (error.request) {
    const { message, code, name } = error;
    return new E(500, message, { code, name });
  }

  return error;
}

function normalizeAndRethrowAxiosError(error) {
  throw normalizeAxiosError(error);
}

function checkWasFound(klass, params = {}) {
  return function inner(data) {
    if (!_.isNil(data)) return data;

    const opts = JSON.stringify(params).replace(/\"/g, "'");
    throw new E(404, `No ${klass} found for: ${opts}`, { params });
  };
}

function checkWasSuccessful(result) {
  if (_.isNil(result)) {
    throw new E(500, "checkWasSuccessful called with nil result");
  }

  if (!result.error && result.success !== false) return result;

  const { status = 500, message = "Unknown error", code, name } =
    result.error || {};
  throw new E(status, message, { code, name });
}

function paginationPayload(originalQuery = {}) {
  return function inner(data = []) {
    const query = { ...originalQuery };

    const pagination = {
      limit: query.limit,
      offset: query.offset,
      count: (data && data.length) || 0,
    };
    delete query.auth;
    delete query.limit;
    delete query.offset;

    return { data, query, pagination };
  };
}

function queryParams(req) {
  const opts = _.mapValues(arrayify)(req.query);

  opts.auth = extractAuth(req);
  opts.q = req.query.q || "";
  opts.offset = Math.max(0, req.query.offset || 0);
  opts.limit = Math.max(0, Math.min(req.query.limit || 20, 100));

  return opts;
}

function extractAuth(req) {
  if (!req || !req.actor) return void 0;
  const { actorId, teamId } = req.actor;
  return { actorId, teamId };
}

function arrayify(item) {
  return Array.isArray(item) ? item : [item];
}

module.exports.extractAuth = extractAuth;
module.exports.handle = reqHandlerMiddleware;
module.exports.normalizeError = normalizeAxiosError;
module.exports.normalizeAndRethrow = normalizeAndRethrowAxiosError;
module.exports.paginationPayload = paginationPayload;
module.exports.queryParams = queryParams;
module.exports.unwrap = reqHandlerUnwrap;
module.exports.wasFound = checkWasFound;
module.exports.wasSuccessful = checkWasSuccessful;
module.exports.wrap = reqHandlerWrap;
