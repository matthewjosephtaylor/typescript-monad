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

import { ErrorHandler, PromiseExecutor } from "./Monads";
import { Monad, Transform } from "./Monad";

export interface Either<L, R> extends Monad<R>, Promise<R> {
  map: <U>(transform: Transform<R, U>) => Either<L, U>;
  flatmap: <U>(transform: Transform<R, Either<L, U>>) => Either<L, U>;
  left: <U>(transform: Transform<L, U>) => Either<U, R>;
  right: <U>(transform: Transform<R, U>) => Either<L, U>;
}

export function left<L, R>(value: L): Either<L, R> {
  // return either(value, undefined, undefined);
  const eitherTuple: [L, R] = [value, undefined];
  return either(Promise.resolve(eitherTuple), () => value);
}

export function right<L, R>(
  promiseOrExecutor: Promise<R> | PromiseExecutor<R>,
  errorHandler: ErrorHandler<L> = (reason) =>
    (new Error(String(reason)) as unknown) as L,
  undefinedIsError: boolean = true
): Either<L, R> {
  const promise =
    promiseOrExecutor instanceof Promise
      ? promiseOrExecutor
      : new Promise(promiseOrExecutor);
  const transformedPromise = promise.then((rightValue) => {
    const eitherTuple: [L, R] = [undefined, rightValue];
    return eitherTuple;
  });
  return either(transformedPromise, errorHandler, undefinedIsError);
}


export type Absurd<T> = () => void;

/**
 * Either which is locked to the left once a left value exists
 *
 * Based on {@link Promise} which uses the _right_ value for 'then-ing'
 *
 * Normally constructed via {@link left} or {@link right}
 *
 * NOTE: the map function works on the _right_ value. If there is no right value
 * then map will short-circuit and produce the known left
 *
 * @param errorHandler used when right-value mapping excepts to transform the
 * reason into a left-value
 *
 * Error is either an exception OR a right-value of 'undefined' while mapping
 */
export function either<L, R>(
  promiseOrExecutor: Promise<[L, R]> | PromiseExecutor<[L, R]> = () =>
    undefined,
  errorHandler: ErrorHandler<L> = () => undefined,
  undefinedIsError: boolean = true
): Either<L, R> {
  const promiseLR: Promise<[L, R]> =
    promiseOrExecutor instanceof Promise
      ? promiseOrExecutor
      : new Promise(promiseOrExecutor);

  const mapFunctor: <U>(transform: Transform<R, U>) => Either<L, U> = <U>(
    transform: Transform<R, U>
  ) => {
    const transformedPromise: Promise<[L, U]> = promiseLR
      .then((valueLR) => {
        const [valueL, valueR] = valueLR;
        if (valueR === undefined && undefinedIsError) {
          const reason = new Error("either: Undefined right value");
          const errorLeft: L = errorHandler(reason);
          const noRight: U = undefined;
          const result: [L, U] = [errorLeft, noRight];
          return result;
        }
        const u: U = transform(valueR);
        const result: [L, U] = [valueL, u];
        return result;
      })
      .catch((reason) => {
        const errorLeft: L = errorHandler(reason);
        const noRight: U = undefined;
        const result: [L, U] = [errorLeft, noRight];
        return result;
      });
    return either(transformedPromise, errorHandler);
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
    }, errorHandler);
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
  // const eth: Either<string, number> = right(22, (reason) => "WTF" + reason);
  // eth.right((v) => console.log("right value", v));
  // eth
  //   .right((v) => {
  //     throw new Error("oh no!");
  //   })
  //   .left((v) => v + "NOOOOO")
  //   // .right((v) => console.log("SHOULD NOT BE", v))
  //   .left((v) => console.log("after all this I got", v));
}

// tests();
