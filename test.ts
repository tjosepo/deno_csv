import * as CSV from './mod.ts';
import { assertEquals } from 'https://deno.land/std@0.126.0/testing/asserts.ts';

Deno.test("CSV.parse", async () => {
  const addresses = await Deno.readTextFile("./addresses.csv");
  const lines = CSV.parse(addresses);
  
  assertEquals(lines[0][0], "John");
})

Deno.test("CSV.parse / Escaped quotes", async () => {
  const addresses = await Deno.readTextFile("./addresses.csv");
  const lines = CSV.parse(addresses);
  
  assertEquals(lines[2][0], 'John "Da Man"');
})

Deno.test("CSV.parse / Escaped line breaks", async () => {
  const addresses = await Deno.readTextFile("./addresses.csv");
  const lines = CSV.parse(addresses);
  
  assertEquals(lines[2][5], "08075\nFort Knox");
})

Deno.test("CSV.read", async () => {
  const addresses = await Deno.open("./addresses.csv");
  
  let i = 0;
  for await (const line of CSV.read(addresses.readable)) {
    if (i === 0) {
      assertEquals(line[0], "John");
    } else if (i === 2) {
      assertEquals(line[0], 'John "Da Man"');
      assertEquals(line[5], "08075\nFort Knox");
    }
    i++
  }
})

Deno.test("CSV.parse / Header", async () => {
  const text = await Deno.readTextFile("./header.csv");
  
  const people = CSV.parse(text, { header: true });
  assertEquals(people[0], { "Name": "John", "Age": "23", "Gender": "M" });
  assertEquals(people[1], { "Name": "Alex", "Age": "18", "Gender": "F" });
  assertEquals(people[2], { "Name": "Michael \"John\" Cena", "Age": "40", "Gender": "M" });
})