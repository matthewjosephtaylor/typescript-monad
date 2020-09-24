import { FlatmapFunctor, MapFunctor, Monad, Transform } from "./Monad";
import { ErrorHandler, isPromiseExecutor, PromiseExecutor } from "./Monads";

export type ElseFunctor<E> = <U>(transform: Transform<E, U>) => Nad<E, U>;
export type FinallyFunctor<E> = <U>(unit: () => U) => Nad<E, U>;

export type CatchFunctor<E, T> = <U>(transform: Transform<E, U>) => Nad<U, T>;

export interface NadMapFunctor<E, T> extends MapFunctor<T> {
  <U>(transform: Transform<T, U>): Nad<E, U>;
}

export interface NadFlatmapFunctor<E, T> extends FlatmapFunctor<T> {
  <U>(transform: Transform<T, Nad<E, U>>): Nad<E, U>;
}

/**
 * An abstraction over {@link Promise} that promotes healthier error handling.
 *
 * Demotes exception-style error handling practices like
 *  - async / await
 *  - try /catch
 *  - .then / .catch
 *
 * It achieves this by _hiding_ the Promise inside the Nad and allowing the user
 * to handle errors by providing an {@link ElseFunctor}
 *
 * This promotes a more purely FP style of development where errors are values.
 *
 * Example:
 * ```
 * nad(somePromise).map(v => ...do-something).else(error=>...transform error to good value)
 * ```
 */
export interface Nad<E, T> extends Monad<T> {
  map: NadMapFunctor<E, T>;
  flatmap: NadFlatmapFunctor<E, T>;
  catch: CatchFunctor<E, T>;
  finally: FinallyFunctor<E>;
  else: ElseFunctor<E>;
}

export type NadValue<T> = Promise<T> | PromiseExecutor<T> | T;

function nadValueToPromise<T>(nadValue?: NadValue<T>): Promise<T> {
  let promise: Promise<T> = undefined;
  if (nadValue === undefined) {
    promise = new Promise(() => {});
  } else if (nadValue instanceof Promise) {
    promise = nadValue;
  } else if (isPromiseExecutor(nadValue)) {
    promise = new Promise(nadValue);
  } else {
    promise = Promise.resolve(nadValue);
  }
  return promise;
}

/**
 * Construct a {@link Nad} given a {@link Promise} or {@link PromiseExecutor}
 * @see {@link Nad} for definition of Nad behavior
 */
export function toNad<E,T>(
  nadValue?: Promise<T> | PromiseExecutor<T> | T,
  errorHandler: ErrorHandler<E> = (reason) => reason as E,
  isUndefinedError: boolean = true
): Nad<E, T> {
  const promise: Promise<T> = nadValueToPromise(nadValue);
  const selfPromise: Promise<T> = promise.then((value) => {
    if (isUndefinedError && value === undefined) {
      throw new Error("Undefined value");
    }
    return value;
  });

  const mapFunctor: NadMapFunctor<E, T> = <U>(transform: Transform<T, U>) => {
    const transformedPromise: Promise<U> = new Promise((resolve, reject) => {
      selfPromise.then((value) => {
        try {
          resolve(transform(value));
        } catch (reason) {
          reject(reason);
        }
      });
    });
    return toNad(transformedPromise, errorHandler, isUndefinedError);
  };

  const flatmapFunctor: NadFlatmapFunctor<E, T> = <U>(
    transform: Transform<T, Nad<E, U>>
  ) => {
    const transformedPromise: Promise<U> = new Promise((resolve) => {
      selfPromise.then((value) => {
        transform(value).map((v) => {
          resolve(v);
          return v;
        });
      });
    });

    return toNad(transformedPromise, errorHandler, isUndefinedError);
  };

  const elseFunctor: ElseFunctor<E> = <U>(transform: Transform<E, U>) => {
    const transformedPromise: Promise<U> = new Promise((resolve) => {
      selfPromise.catch((reason) => {
        const error: E = errorHandler(reason);
        const transformedError: U = transform(error);
        resolve(transformedError);
      });
    });
    return toNad(transformedPromise, errorHandler, isUndefinedError);
  };

  const catchFunctor: CatchFunctor<E, T> = <U>(transform: Transform<E, U>) => {
    return toNad(selfPromise, transform, isUndefinedError);
  };

  const finallyFunctor: FinallyFunctor<E> = <U>(unit: () => U) => {
    const transformedPromise: Promise<U> = new Promise((resolve) => {
      selfPromise.finally(() => {
        const unitValue: U = unit();
        resolve(unitValue);
      });
    });
    return toNad(transformedPromise, errorHandler, isUndefinedError);
  };

  return {
    map: mapFunctor,
    flatmap: flatmapFunctor,
    else: elseFunctor,
    catch: catchFunctor,
    finally: finallyFunctor,
  };
}

export function toErrorNad<E, T>(errorValue: E): Nad<E, T> {
  return toNad(undefined, () => errorValue);
}
