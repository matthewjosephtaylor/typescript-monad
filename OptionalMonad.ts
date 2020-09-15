import { Monad, Transform, UnitOrValue, unitOrValueToValue } from "monad/Monad";
import { flatten } from "monad/Monads";

export interface Optional<T> extends Promise<T>, Monad<T> {
  map: <U>(transform: Transform<T, U>) => Optional<U>;
  flatmap: <U>(transform: Transform<T, Optional<U>>) => Optional<U>;
  else: <U>(transform: UnitOrValue<U>) => Optional<U>;
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
 * The optional @param exceptionHandler can be used to gather the reason if there
 * was an exception. If an exception is re-thrown in the exceptionHandler, it is
 * considered a fatal exception and will not be re-caught.
 *
 * NOTE: Promises technically aren't monads, but they are close enough to be
 * coerced into one, if one is brave enough :)
 */
export function optional<T>(
  promiseOrExecutor: Promise<T> | PromiseExecutor<T> = () => undefined,
  exceptionHandler: (reason: unknown) => void = (reason) => {
    console.warn(reason);
  }
): Optional<T> {
  const promise =
    promiseOrExecutor instanceof Promise
      ? promiseOrExecutor
      : new Promise(promiseOrExecutor);
  let handledPromise: Promise<T> = promise.catch((reason) => {
    exceptionHandler(reason);
    return undefined;
  });

  // prettier-ignore
  const mapFunctor: 
  <U>(transform: Transform<T, U>) => Optional<U> = 
  <U>(transform: Transform<T, U>) => {
    return optional(
      handledPromise.then((promiseValue) => {
        return promiseValue === undefined ? undefined : transform(promiseValue);
      }));
  };

  // prettier-ignore
  const elseFunctor: 
  <U>(transform: UnitOrValue<U>) => Optional<U> = 
  <U>(transform: UnitOrValue<U>) => {
    return optional(
      handledPromise.then((promiseValue) => {
        return promiseValue === undefined ? undefined : unitOrValueToValue(transform);
      }));
  };

  const opt: Optional<T> = Object.assign(handledPromise, {
    map: mapFunctor,
    flatmap: <U>(transform: Transform<T, Optional<U>>) => {
      const nested: Optional<Optional<U>> = mapFunctor(transform);
      const flattened: Optional<U> = flatten(nested);
      return flattened;
    },
    else: elseFunctor,
  });
  return opt;
}
