
export type Reader<A, T> = (answer: A) => T;

/**
 * Reader 'monad'
 * Return this instead of direct value to 'ask' the caller for a dependency
 *
 * WARNING: opinionated. If answer is 'undefined' an exception is thrown
 *
 * Not limited to monads.
 *
 * This pattern is popular for FP and where it is known as the 'Reader Monad'
 *
 */
export function ask<A, T>(questioner: (answer: A) => T): Reader<A, T> {
  return (answer: A) => {
    if (answer === undefined) {
      console.error("DUMP", [questioner, answer]);
      throw "No answer to Reader question";
    }
    return questioner(answer);
  };
}
