import { Unit } from "./Monad";
import assert from "assert";
import { Test } from "test/Test";

export type Maybe<T> = Promise<T>;

/** Convert Promises into 'Maybe'-like, using the concept of _undefined_ as _empty_
 * - The contained value is {@link undefined} if _unit_ throws an exception
 * @param unit contains the value
 * @param errorHandler converts error -> value
 */
export function toMaybe<T>(
  unit: Unit<T>,
  errorHandler: (reason: unknown) => T = () => undefined
): Promise<T> {
  const promise: Promise<T> = new Promise((resolve) => {
    resolve(unit());
  });
  return promise.catch(errorHandler);
}

export namespace TO_MAYBE_TEST {
  export const toMaybeValueTest: Test = (pass, fail) => {
    const expected: number = 42;
    const maybe = toMaybe(() => expected);
    maybe.then((value: number) => {
      assert.deepStrictEqual(value, expected);
      pass();
    });
    return maybe;
  };
  export const toMaybeEmptyTest: Test = (pass, fail) => {
    const expected: number = undefined;
    const maybe = toMaybe(() => {
      throw "oops";
    });
    maybe.then((value: number) => {
      assert.deepStrictEqual(value, expected);
      pass();
    });
    return maybe;
  };
}
