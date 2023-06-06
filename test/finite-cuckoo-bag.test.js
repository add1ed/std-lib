const assert = require("assert");
const Store = require("../lib/finite-cuckoo-bag");

describe("max-hit-keyed-store", () => {
  describe("adding", () => {
    it("should throw if called without a key", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // THEN
      assert.throws(() => store.add(null));
      assert.throws(() => store.add());
    });

    it("should allow falsy keys", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      const added = store.add(0, { food: "pizza" });

      // THEN
      assert.ok(added);

      assert.equal(store.full("one"), false);

      assert.ok(store.has(0));

      assert.equal(store.hits(0), 1);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen(0));
    });

    it("should add new entry not seen before", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      const added = store.add("one", { food: "pizza" });

      // THEN
      assert.ok(added);

      assert.equal(store.full("one"), false);

      assert.ok(store.has("one"));

      assert.equal(store.hits("one"), 1);
      assert.equal(store.hits(), 1);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen("one"));
    });

    it("should add new entry for a seen key", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      const added1 = store.add("one", { food: "pizza" });
      const added2 = store.add("one", { food: "pasta" });

      // THEN
      assert.ok(added1);
      assert.ok(added2);

      assert.equal(store.full("one"), false);

      assert.ok(store.has("one"));

      assert.equal(store.hits("one"), 2);
      assert.equal(store.hits(), 2);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen("one"));
    });

    it("should add entries for different keys", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      const added1 = store.add("one", { food: "pizza" });
      const added2 = store.add("one", { food: "pasta" });
      const added3 = store.add("two", { food: "gelato" });
      const added4 = store.add("two", { food: "risotto" });

      // THEN
      assert.ok(added1);
      assert.ok(added2);
      assert.ok(added3);
      assert.ok(added4);

      assert.equal(store.full("one"), false);
      assert.equal(store.full("two"), false);

      assert.ok(store.has("one"));
      assert.ok(store.has("two"));

      assert.equal(store.hits("one"), 2);
      assert.equal(store.hits("two"), 2);
      assert.equal(store.hits(), 4);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen("one"));
      assert.ok(store.seen("two"));
    });

    it("counts duplicates twice", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      const added1 = store.add("one", { food: "pizza" });
      const added2 = store.add("one", { food: "pasta" });
      const added3 = store.add("one", { food: "pasta" });

      // THEN
      assert.ok(added1);
      assert.ok(added2);
      assert.ok(added3);

      assert.equal(store.full("one"), false);

      assert.ok(store.has("one"));

      assert.equal(store.hits("one"), 3);
      assert.equal(store.hits(), 3);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen("one"));
    });

    it("shouldn't add new entry when saturated", () => {
      // GIVEN
      const store = Store({ maxHits: 1 });

      // WHEN
      const added1 = store.add("one", { food: "pizza" });
      const added2 = store.add("one", { food: "pasta" });

      // THEN
      assert.ok(added1);
      assert.equal(added2, false);

      assert.equal(store.full("one"), true);

      assert.ok(store.has("one"));

      assert.equal(store.hits("one"), 1);
      assert.equal(store.hits(), 1);

      assert.equal(store.isEmpty(), false);

      assert.ok(store.seen("one"));
    });
  });

  describe("removing", () => {
    describe("for a given key", () => {
      it("should remove and return all items for given key", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add("one", { food: "pizza" });
        store.add("one", { food: "pasta" });
        store.add("one", { food: "gelato" });
        store.add("two", { food: "risotto" });

        // WHEN
        const items = store.drain("one");

        // THEN
        assert.equal(items.length, 3);
        assert.equal(store.has("one"), false);
        assert.equal(store.isEmpty(), false);
      });

      it("should remove and return all items for a falsy key", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add(0, { food: "pizza" });
        store.add(0, { food: "pasta" });
        store.add(false, { food: "gelato" });
        store.add(0, { food: "risotto" });

        // WHEN
        const items = store.drain(0);

        // THEN
        assert.equal(items.length, 3);
        assert.equal(store.has(0), false);
        assert.equal(store.isEmpty(), false);
      });

      it("should leave other keys untouched", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add("one", { food: "pizza" });
        store.add("one", { food: "pasta" });
        store.add("one", { food: "gelato" });
        store.add("two", { food: "risotto" });

        // WHEN
        store.drain("one");

        // THEN
        assert.equal(store.has("two"), true);
        assert.equal(store.isEmpty(), false);
      });

      it("should leave hit counts, fullness, and seen status, as they were", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add("one", { food: "pizza" });
        store.add("one", { food: "pasta" });
        store.add("one", { food: "gelato" });
        store.add("two", { food: "risotto" });

        const beforeOne = store.hits("one");
        const beforeTwo = store.hits("two");
        const beforeAll = store.hits();
        const fullnessOne = store.full("one");
        const fullnessTwo = store.full("two");

        // WHEN
        store.drain("one");

        // THEN
        assert.equal(store.hits("one"), beforeOne);
        assert.equal(store.hits("two"), beforeTwo);
        assert.equal(store.hits(), beforeAll);
        assert.equal(store.full("one"), fullnessOne);
        assert.equal(store.full("two"), fullnessTwo);
        assert.ok(store.seen("one"));
        assert.ok(store.seen("two"));
      });
    });

    describe("for all keys", () => {
      it("should remove and return all items", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add("one", { food: "pizza" });
        store.add("one", { food: "pasta" });
        store.add("one", { food: "gelato" });
        store.add("two", { food: "risotto" });

        // WHEN
        const items = store.drain();

        // THEN
        assert.equal(items.length, 4);
        assert.equal(store.has("one"), false);
        assert.equal(store.has("two"), false);
        assert.equal(store.isEmpty(), true);
      });

      it("should leave hit counts, fullness, and seen status, as they were", () => {
        // GIVEN
        const store = Store({ maxHits: 5 });
        store.add("one", { food: "pizza" });
        store.add("one", { food: "pasta" });
        store.add("one", { food: "gelato" });
        store.add("two", { food: "risotto" });

        const beforeOne = store.hits("one");
        const beforeTwo = store.hits("two");
        const beforeAll = store.hits();
        const fullnessOne = store.full("one");
        const fullnessTwo = store.full("two");

        // WHEN
        store.drain();

        // THEN
        assert.equal(store.hits("one"), beforeOne);
        assert.equal(store.hits("two"), beforeTwo);
        assert.equal(store.hits(), beforeAll);
        assert.equal(store.full("one"), fullnessOne);
        assert.equal(store.full("two"), fullnessTwo);
        assert.ok(store.seen("one"));
        assert.ok(store.seen("two"));
      });
    });
  });

  describe("accounting", () => {
    it("a newly created store reports correctly", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // THEN
      assert.equal(store.full("one"), false);
      assert.equal(store.has("one"), false);
      assert.equal(store.hits("one"), 0);
      assert.equal(store.hits(), 0);
      assert.equal(store.isEmpty(), true);
      assert.equal(store.seen("one"), false);
    });

    it("should not claim to have seen keys it hasn't", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      store.add("one", { food: "pizza" });

      // THEN
      assert.equal(store.seen("two"), false);
    });

    it("should report 0 hits for never seen keys", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      store.add("one", { food: "pizza" });

      // THEN
      assert.equal(store.hits("two"), 0);
    });

    it("should not claim to have values it doesn't", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // WHEN
      store.add("one", { food: "pizza" });

      // THEN
      assert.equal(store.has("two"), false);
    });

    it("should report correctly for falsy key", () => {
      // GIVEN
      const store = Store({ maxHits: 2 });

      // WHEN
      store.add(0, { food: "pasta" });
      store.add(0, { food: "pizza" });
      store.add(false, { food: "risotto" });

      // THEN
      assert.equal(store.full(0), true);
      assert.equal(store.full(false), false);

      assert.equal(store.has(0), true);
      assert.equal(store.has(false), true);

      assert.equal(store.hits(0), 2);
      assert.equal(store.hits(false), 1);
      assert.equal(store.hits(), 3);

      assert.equal(store.isEmpty(), false);

      assert.equal(store.seen(0), true);
      assert.equal(store.seen(false), true);
    });

    it("should throw if full called without key", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // THEN
      assert.throws(() => store.full());
    });

    it("should throw if has called without key", () => {
      // GIVEN
      const store = Store({ maxHits: 5 });

      // THEN
      assert.throws(() => store.has());
    });
  });
});
