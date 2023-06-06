# @add1ed/std-lib

A collection of useful functions, including minimised version of lodash and axios.

## tl;dr

Use lodash functions:
```js
const _ = require("@add1ed/std-lib");

const list = ["olives", "anchovies", "capers"];
const isVowel = x => "aeiou".includes(x);
const result = 
  _.pipe(
    _.filter(x => isVowel(x[0])),
    _.map(x => x.toUpperCase()),
    _.drop(1),
    _.first
  )(list);
console.log(result); // prints "ANCHOVIES"
```

Use axios:
```js
const { axios } = require("@add1ed/std-lib");
axios.get("https://www.bbc.com/robots.txt")
  .then(resp => console.log(resp.data));
```

Use the LRU cache:
```js
const { cache } = require("@add1ed/std-lib");

async function single() {
  let hits = 0;
  const fn = (id) => ({ id, hit: ++hits });
  const wrap = cache(x => x.id, fn);
  await wrap(3);
  await wrap(3);
  console.log(await wrap(1));
}

single(); // prints { id: 1, hit: 2 }

async function array() {
  let hits = 0;
  const inc = (id) => ({ id, hit: ++hits });
  const fn = xs => xs.map(inc);

  const wrap = cache(x => x.id, xs => xs.map(inc), { array: true });
  await wrap([4, 3]);
  await wrap([2, 4]);
  await wrap([2]);
  console.log(await wrap([2]));
}

array(); // prints [ { id: 2, hit: 3 } ]
```