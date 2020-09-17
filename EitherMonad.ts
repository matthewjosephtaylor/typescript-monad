import { Optional, PromiseExecutor } from "monad/OptionalMonad";
/**
 * Either left or right.
 *
 * Biased to the right.
 *
 * In cases where morality applies, remember:
 *  - The right side is the 'right' value.
 *  - The left side is the 'wrong' value.
 *  - Know that some people have a reversed attitude on this subject, and drive on the wrong side of the road
 */

import { Monad, Transform } from "./Monad";

export interface Either<L, R> extends Monad<R>, Promise<R> {
  map: <U>(transform: Transform<R, U>) => Either<L, U>;
  flatmap: <U>(transform: Transform<R, Monad<U>>) => Either<L, U>;
  left: <U>(transform: Transform<L, U>) => Either<U, R>;
  right: <U>(transform: Transform<R, U>) => Either<L, U>;
}

export function left<L, R>(value: L): Either<L, R> {
  // return either(value, undefined, undefined);
  const eitherTuple: [L, R] = [value, undefined];
  return either(Promise.resolve(eitherTuple), () => value);
}

export function right<L, R>(
  rightValue: R,
  errorToLeftValue: (reason: unknown) => L
): Either<L, R> {
  const eitherTuple: [L, R] = [undefined, rightValue];
  return either(Promise.resolve(eitherTuple), errorToLeftValue);
}

export type ErrorHandler<T> = (reason: unknown) => T;

/**
 * Either which is locked to the left once a left value exists
 *
 * NOTE: the map function works on the _right_ value. If there is no right value
 * then map will short-circuit and produce the known left
 *
 * Error is either an exception OR a right-value of 'undefined' while mapping
 *
 * @param leftValue undefined means the right value is active
 * @param rightUnitOrValue
 * @param errorToLeftValue
 */

export function either<L, R>(
  rightPromiseOrExecutor: Promise<[L, R]> | PromiseExecutor<[L, R]> = () =>
    undefined,
  errorToLeft: (reason: unknown) => L
): Either<L, R> {
  const promiseLR: Promise<[L, R]> =
    rightPromiseOrExecutor instanceof Promise
      ? rightPromiseOrExecutor
      : new Promise(rightPromiseOrExecutor);

  const mapFunctor: <U>(transform: Transform<R, U>) => Either<L, U> = <U>(
    transform: Transform<R, U>
  ) => {
    const transformedPromise: Promise<[L, U]> = promiseLR
      .then((valueLR) => {
        const [valueL, valueR] = valueLR;
        if (valueR === undefined) {
          const reason = new Error("either: Undefined right value");
          const errorLeft: L = errorToLeft(reason);
          const noRight: U = undefined;
          const result: [L, U] = [errorLeft, noRight];
          return result;
        }
        const u: U = transform(valueR);
        const result: [L, U] = [valueL, u];
        return result;
      })
      .catch((reason) => {
        const errorLeft: L = errorToLeft(reason);
        const noRight: U = undefined;
        const result: [L, U] = [errorLeft, noRight];
        return result;
      });
    return either(transformedPromise, errorToLeft);
  };
  const flatmapFunctor: <U>(
    transform: Transform<R, Either<L, U>>
  ) => Either<L, U> = (transform) => {
    return either((resolve) => {
      mapFunctor(transform).left((l) => resolve([l, undefined]));
      mapFunctor(transform).right((lu) => {
        lu.left((l) => resolve([l, undefined]));
        lu.right((u) => resolve([undefined, u]));
      });
    }, errorToLeft);
  };

  const leftFunctor: <U>(transform: Transform<L, U>) => Either<U, R> = <U>(
    transform: Transform<L, U>
  ) => {
    const transformedPromise: Promise<[U, R]> = promiseLR.then((lr) => {
      const [l, r] = lr;
      if (l === undefined) {
        return [undefined, r];
      }
      const u = transform(l);
      return [u, r];
    });
    return either(transformedPromise, transform);
  };

  const promiseR = promiseLR.then((lr) => lr[1]);
  const eth: Either<L, R> = Object.assign(promiseR, {
    map: mapFunctor,
    flatmap: flatmapFunctor,
    left: leftFunctor,
    right: mapFunctor,
  });
  return eth;
}

function tests() {
  const eth: Either<string, number> = right(22, (reason) => "WTF" + reason);
  eth.right((v) => console.log("right value", v));
  eth
    .right((v) => {
      throw new Error("oh no!");
    })
    .left((v) => v + "NOOOOO")
    // .right((v) => console.log("SHOULD NOT BE", v))
    .left((v) => console.log("after all this I got", v));
}

// tests();
