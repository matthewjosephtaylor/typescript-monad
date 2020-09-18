import { either, Either, right } from "monad/EitherMonad";
import { Monad, Transform, UnitOrValue, unitOrValueToValue } from "monad/Monad";
import { flatten } from "monad/Monads";

export interface Optional<T> extends Either<any, T>, Monad<T> {
  map: <U>(transform: Transform<T, U>) => Optional<U>;
  flatmap: <U>(transform: Transform<T, Optional<U>>) => Optional<U>;
}

export type PromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;

/**
 * Optional monad (kinda)
 *
 * In the JS world 'undefined' is used as a way of determining 'no value' for a
 * function. For instance, it is the _default_ value returned for functions with
 * no explicit return value.
 *
 * Here we take this one step further and assign _exceptions_ to undefined and
 * treat 'exception-ed' Promises like 'empty'. 'undefined' is also
 * short-circuited when mapping.
 *
 * The optional @param errorHandler can be used to gather the reason if there
 * was an exception. If an exception is re-thrown in the exceptionHandler, it is
 * considered a fatal exception and will not be re-caught.
 *
 * NOTE: Promises technically aren't monads, but they are close enough to be
 * coerced into one, if one is brave enough :)
 */
export function optional<T>(
  promiseOrExecutor: Promise<T> | PromiseExecutor<T> = () => undefined,
  errorHandler: (reason: unknown) => Error = (reason) => {
    return new Error(String(reason));
  }
): Optional<T> {
  const promise =
    promiseOrExecutor instanceof Promise
      ? promiseOrExecutor
      : new Promise(promiseOrExecutor);
  let handledPromise: Promise<[Error, T]> = promise
    .then((value) => {
      const lr: [Error, T] = [undefined, value];
      return lr;
    })
    .catch((reason) => {
      const error = errorHandler(reason);
      const lr: [Error, T] = [error, undefined];
      return lr;
    });
  const eth: Either<Error, T> = either(handledPromise, errorHandler);

  const mapFunctor: <U>(transform: Transform<T, U>) => Optional<U> = (
    transform
  ) => {
    return optional(eth.map(transform));
  };
  const flatmapFunctor: <U>(
    transform: Transform<T, Optional<U>>
  ) => Optional<U> = (transform) => {
    return optional(eth.flatmap(transform));
  };

  const opt: Optional<T> = Object.assign(eth, {
    map: mapFunctor,
    flatmap: flatmapFunctor,
  });
  return opt;
}
