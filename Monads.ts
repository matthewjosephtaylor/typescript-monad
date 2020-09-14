import { monad, Monad, Transform } from "./Monad";

export type Reader<A, T> = {
  ask: (answer: A) => Monad<T>;
};

/**
 * Reader monad
 * Return this instead of direct value to 'ask' the caller for a dependency
 */
export function reader<A, T>(input: (answer: A) => T): Reader<A, T> {
  return {
    ask: (answer: A) => {
      return monad(input(answer));
    },
  };
}

export type Optional<T> = Promise<T> & {
  map: <U>(transform: Transform<T, U>) => Optional<U>;
  flatMap: <U>(transform: Transform<T, Optional<U>>) => Optional<U>;
};

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
 * treat 'exceptioned' Promises like 'empty'. 'undefined' is also
 * short-circuited when mapping.
 *
 * The optional @param exceptionHandler can be used to gather the reason if there
 * was an exception. If an exception is re-thrown in the exceptionHandler, it is
 * considered a fatal exception and will not be re-caught.
 *
 * NOTE: Promises technically aren't monads but they are close enough
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
  const optionalTransformer: 
  <U>(transform: Transform<T, U>) => Optional<U> = 
  <U>(transform: Transform<T, U>) => {
    return optional(
      handledPromise.then((promiseValue) => {
        return promiseValue === undefined ? undefined : transform(promiseValue);
      }));
  };
  const opt: Optional<T> = Object.assign(handledPromise, {
    map: optionalTransformer,
    flatMap: <U>(transform: Transform<T, Optional<U>>) => {
      const p: Promise<U> = handledPromise.then(transform);
      const o: Optional<U> = optional(p);
      return o;
    },
  });
  return opt;
}

export function unpack<A>(mmA: Monad<Optional<A>>): Optional<A> {
  return optional((resolve) => {
    // Javascript appears to 'collapse' Promise objects in reality
    mmA.map((a) => resolve(a));
  });
}

export function joinMonads<A, B, C>(
  mA: Monad<A>,
  mB: Monad<B>,
  joiner: (a: A, b: B) => C
): Monad<C> {
  return {
    map: <U>(transform: Transform<C, U>) => {
      const opt: Optional<U> = optional((resolve) => {
        mA.map((a) => {
          mB.map((b) => {
            const c: C = joiner(a, b);
            const u: U = transform(c);
            resolve(u);
          });
        });
      });
      return opt;
    },
  };
}
