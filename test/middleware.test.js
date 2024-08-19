import _ from "../index.js";
const M = _.middleware;

describe("middleware", () => {
  describe("normalizeError", () => {
    it("includes details from a json error response", () => {
      const normed = M.normalizeError({
        response: {
          status: 404,
          data: {
            message: "item not found",
            code: 1001,
          },
        },
      });

      expect(normed.status).toBe(404);
      expect(normed.message).toBe("item not found");
      expect(normed.code).toBe(1001);
    });

    it("uses error's message for a non-json error response", () => {
      const normed = M.normalizeError({
        message: "pizza",
        response: {
          status: 503,
          data: "Server timeout",
        },
      });

      expect(normed.status).toBe(503);
      expect(normed.message).toBe("pizza");
    });
  });

  describe("normalizeAndRethrow", () => {
    it("includes details from a json error response", () => {
      const normed = () =>
        M.normalizeAndRethrow({
          response: {
            status: 404,
            data: {
              message: "item not found",
              code: 1001,
            },
          },
        });

      expect(normed).toThrow(/not found/);
    });

    it("uses error's message for a non-json error response", () => {
      const normed = () =>
        M.normalizeAndRethrow({
          message: "pizza",
          response: {
            status: 503,
            data: "Server timeout",
          },
        });

      expect(normed).toThrow(/pizza/);
    });
  });
});
