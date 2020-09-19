import { toNad, Nad } from "./Nad";
import assert from "assert";

async function tests() {
  const results = [];
  results.push(...(await testValueConstructor()));
  results.push(...(await testPromiseConstructor()));
  results.push(...(await testPromiseExecutorConstructor()));
  results.push(...(await testMapAndFinally()));
  results.push(...(await testElse()));
  results.push(...(await testFlatmap()));
  assert.deepStrictEqual(results, [
    "Nad::constructor<value>",
    "Nad::constructor<Promise>",
    "Nad::constructor<PromiseExecutor>",
    "Nad::map",
    "Nad::finally",
    "Nad::else",
    "Nad::flatmap",
  ]);
  return results;
}
tests()
  .catch((reason) => {
    console.error("Error while running tests:",reason);
    process.exit(1);
  })
  .then((results) => console.log("All tests passed", results));

async function testValueConstructor(): Promise<string[]> {
  return new Promise((resolve) => {
    const actual: number[] = [];
    const expected: number[] = [42];
    const nadV: Nad<unknown, number> = toNad(42);
    nadV
      .map((value) => {
        actual.push(value);
        return value;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::constructor<value>"]);
        return true;
      });
  });
}

async function testPromiseConstructor(): Promise<string[]> {
  return new Promise((resolve) => {
    const actual: number[] = [];
    const expected: number[] = [42];
    const nad: Nad<unknown, number> = toNad(Promise.resolve(42));
    nad
      .map((value) => {
        actual.push(value);
        return value;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::constructor<Promise>"]);
        return true;
      });
  });
}

async function testPromiseExecutorConstructor(): Promise<string[]> {
  return new Promise((resolve) => {
    const actual: number[] = [];
    const expected: number[] = [42];
    const nad: Nad<unknown, number> = toNad((resolve) => resolve(42));
    nad
      .map((value) => {
        actual.push(value);
        return value;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::constructor<PromiseExecutor>"]);
        return true;
      });
  });
}

async function testMapAndFinally(): Promise<string[]> {
  return new Promise((resolve) => {
    const nad: Nad<string, number> = toNad(Promise.resolve(100), (reason) => {
      console.log("caught error", reason);
      throw new Error(`Unexpected error: ${reason}`);
    });
    const actual: number[] = [];
    const expected: number[] = [100, 200];

    nad
      .map((value) => {
        actual.push(value);
        return 200;
      })
      .map((value) => {
        actual.push(value);
        return 300;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::map", "Nad::finally"]);
        return true;
      });
  });
}

async function testElse(): Promise<string[]> {
  return new Promise((resolve) => {
    const actual: any[] = [];
    const expected: any[] = [42, 100, "Handled Error", "Meaning of Life", 777];
    const nad: Nad<string, number> = toNad(42, (reason) => {
      actual.push("Handled Error");
      return "Meaning of Life";
    });

    nad
      .map((value) => {
        actual.push(value);
        return 100;
      })
      .map((value) => {
        actual.push(value);
        throw new Error("foo");
      })
      .else((error) => {
        actual.push(error);
        return 777;
      })
      .map((value) => {
        actual.push(value);
        return 2000;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::else"]);
        return true;
      });
  });
}

async function testFlatmap(): Promise<string[]> {
  return new Promise((resolve) => {
    const actual: any[] = [];
    const expected: any[] = [42, 142];
    const nad: Nad<unknown, number> = toNad(42);
    const foo: Nad<unknown, boolean> = nad
      .flatmap((value) => {
        actual.push(value);
        const nad2: Nad<unknown, number> = toNad(value + 100);
        return nad2;
      })
      .map((value: number) => {
        actual.push(value);
        return value;
      })
      .finally(() => {
        assert.deepStrictEqual(actual, expected);
        resolve(["Nad::flatmap"]);
        return true;
      });
  });
}
