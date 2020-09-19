export type Transform<T, U> = (value: T) => U;


export type MapFunctor<T> = <U>(transform: Transform<T, U>) => Functor<U>;

export type FlatmapFunctor<T> = <U>(
  transform: Transform<T, Functor<U>>
) => Functor<U>;

export interface Functor<T> {
  // map: <U>(transform: Transform<T, U>) => Functor<U>;
  map: MapFunctor<T>;
}

export interface Monad<T> extends Functor<T> {
  // map: <U>(transform: Transform<T, U>) => Monad<U>;
  // flatmap: <U>(transform: Transform<T, Monad<U>>) => Monad<U>;
  flatmap: FlatmapFunctor<T>;
}

export type Unit<T> = () => T;

export type UnitOrValue<T> = Unit<T> | T;

export function unitOrValueToValue<T>(unitOrValue: UnitOrValue<T>): T {
  if (unitOrValue === undefined) {
    return undefined;
  }
  if (typeof unitOrValue === "function") {
    const unit = unitOrValue as Unit<T>;
    return unit();
  }
  return unitOrValue;
}

/**
 * Take a value or a function that supplies a value and covert to a Functor
 */
export function functor<T>(unitOrValue: UnitOrValue<T>): Functor<T> {
  return {
    map: (transform) => {
      return functor(transform(unitOrValueToValue(unitOrValue)));
    },
  };
}

/**
 * If it walks and talks like a Functor, it is a Functor
 * WARNING: The Typescript type system isn't powerful enough to determine the
 *  _type_ within the Functor
 * Suggestion: Use {@link object/Objects::toType}
 */
export function isFunctor(maybe: any): maybe is Functor<unknown> {
  if (maybe === undefined) {
    return undefined;
  }
  return typeof maybe === "object" && typeof maybe["map"] == "function";
}
