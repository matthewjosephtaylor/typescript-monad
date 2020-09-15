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

import { Monad, Transform, UnitOrValue, unitOrValueToValue } from "./Monad";

export interface Either<L, R> extends Monad<R> {
  map: <U>(transform: Transform<R, U>) => Either<L, U>;
  flatmap: <U>(transform: Transform<R, Monad<U>>) => Either<L, U>;
  left: <U>(transform: Transform<L, U>) => Either<U, R>;
  right: <U>(transform: Transform<R, U>) => Either<L, U>;
}

export function left<L, R>(value: L): Either<L, R> {
  return either(value, undefined, undefined);
}

export function right<L, R>(
  unitOrValue: UnitOrValue<R>,
  errorToLeftValue: (reason: unknown) => L
): Either<L, R> {
  return either(undefined, unitOrValue, errorToLeftValue);
}

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
  leftValue?: L,
  rightUnitOrValue?: UnitOrValue<R>,
  errorToLeftValue?: (reason: unknown) => L
): Either<L, R> {
  const mapFunctor: <U>(transform: Transform<R, U>) => Either<L, U> = (
    transform
  ) => {
    try {
      /**  locked to the left once a left value exists */
      if (leftValue !== undefined) {
        return left(leftValue);
      }
      const rightResult = transform(unitOrValueToValue(rightUnitOrValue));
      if (rightResult === undefined) {
        return left(
          errorToLeftValue(
            new Error("right result of either mapping was undefined")
          )
        );
      }
      return right(rightResult, errorToLeftValue);
    } catch (reason: unknown) {
      return left(errorToLeftValue(reason));
    }
  };
  const flatmapFunctor: <U>(
    transform: Transform<R, Either<L, U>>
  ) => Either<L, U> = (transform) => {
    if (leftValue) {
      return left(leftValue);
    }
    return transform(unitOrValueToValue(rightUnitOrValue));
  };
  const leftFunctor: <U>(transform: Transform<L, U>) => Either<U, R> = (
    transform
  ) => {
    if (leftValue === undefined) {
      return right(unitOrValueToValue(rightUnitOrValue), transform);
    }
    return left(transform(leftValue));
  };
  const rightFunctor: <U>(transform: Transform<R, U>) => Either<L, U> = (
    transform
  ) => {
    if (leftValue !== undefined) {
      return left(leftValue);
    }
    return right(
      transform(unitOrValueToValue(rightUnitOrValue)),
      errorToLeftValue
    );
  };
  return {
    map: mapFunctor,
    flatmap: flatmapFunctor,
    left: leftFunctor,
    right: rightFunctor,
  };
}
