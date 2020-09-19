/**
 * Useful functions for dealing with monad-like things
 */

import { Optional, optional } from "./OptionalMonad";
import { Functor } from "./Monad";

export type PromiseExecutor<T> = (
  resolve: (value?: T | PromiseLike<T>) => void,
  reject: (reason?: any) => void
) => void;

export function isPromiseExecutor<T>(maybe: any): maybe is PromiseExecutor<T> {
  return typeof maybe === "function";
}

export type ErrorHandler<T> = (reason: unknown) => T;

/**
 * Flatten nested Functors
 * Takes advantage of Optional, which in turn takes advantage of Promises
 *
 * @returns an Optional which is also a Functor and a Monad
 * This means that if any of the functors map to 'undefined' then the result
 * will be an 'empty' Optional
 */
export function flatten<A>(nested: Functor<Functor<A>>): Optional<A> {
  // In reality already flattened just need to convert type
  if (nested instanceof Promise) {
    return optional(nested);
  }
  // Use Promise to condense the nest
  return optional((resolve) => {
    nested.map((fa) => {
      fa.map((a) => {
        resolve(a);
      });
    });
  });
}

/**
 * Unrolled 'loop' of Functor composers
 *
 * At some point there might be a more generalizable way of doing this with
 * typescript. Perhaps there is already and I'm just unaware :)
 *
 * I think the rule of 3-5 applies here so likely this unrolled 'loop' should
 * not have to be expanded much if ever.
 */
export type Composer2<A, B, R> = (a: A, b: B) => R;
export type Composer3<A, B, C, R> = (a: A, b: B, c: C) => R;
export type Composer4<A, B, C, D, R> = (a: A, b: B, c: C, d: D) => R;

export type Resolver<T> = (value: T) => T;

export function compose2<A, B, R>(
  composer: Composer2<A, B, R>,
  ...functors: [Functor<A>, Functor<B>]
): Optional<R> {
  const nestedResult = functors[0].map((a) =>
    functors[1].map((b) => composer(a, b))
  );
  return flatten(nestedResult);
}

export function compose3<A, B, C, R>(
  composer: Composer3<A, B, C, R>,
  ...functors: [Functor<A>, Functor<B>, Functor<C>]
): Optional<R> {
  const nestedResult = functors[0].map((a) =>
    functors[1].map((b) => functors[2].map((c) => composer(a, b, c)))
  );
  return flatten(flatten(nestedResult));
}

export function compose4<A, B, C, D, R>(
  composer: Composer4<A, B, C, D, R>,
  ...functors: [Functor<A>, Functor<B>, Functor<C>, Functor<D>]
): Optional<R> {
  const nestedResult = functors[0].map((a) =>
    functors[1].map((b) =>
      functors[2].map((c) => functors[3].map((d) => composer(a, b, c, d)))
    )
  );
  return flatten(flatten(flatten(nestedResult)));
}
