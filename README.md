# deno_csv

Simple utility functions for reading CSV files.

## CSV.parse

Parses a CSV string. Returns an array of lines, which contain an array of fields.

```js
import * as CSV from './deps.ts';

const text = await Deno.readTextFile("./addresses.csv");
const lines = CSV.parse(text);

console.log(lines[0][0]);
```

You can optionally set the `header` option to `true` to obtain each lines as an
objects, using the first line as the keys.

```js
import * as CSV from './deps.ts';

const text = await Deno.readTextFile("./people.csv", { header: true });
const people = CSV.parse(text);

console.log(people[0].name);
```

## CSV.read

Reads a CSV string asynchronously. Useful when working on very large files or
dealing with real-time data from a readable stream.

```js
import * as CSV from './deps.ts';

const file = await Deno.open("./very_large_file.csv");

for await (const line of CSV.read(file.readable)) {
  for (const field of line) {
    console.log(field);
  }
}
```