export type Transform<T, U> = (value: T) => U;

export type Monad<T> = {
  map: <U>(transform: Transform<T, U>) => Monad<U>;
};

export type Unit<T> = () => T;

export type UnitOrValue<T> = Unit<T> | T;

function unitOrValueToValue<T>(unitOrValue: UnitOrValue<T>): T {
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
 * Take a value or a function that supplies a value and covert to Monad
 */
export function monad<T>(unitOrValue: UnitOrValue<T>): Monad<T> {
  return {
    map: (transform) => {
      return monad(transform(unitOrValueToValue(unitOrValue)));
    },
  };
}

/**
 * If it walks and talks like a Monad, it is a Monad
 * WARNING: The Typescript type system isn't powerful enough to determine the
 *  _type_ within the Monad
 * Suggestion: Use {@link object/Objects::toType}
 */
export function isMonad(maybe: any): maybe is Monad<unknown> {
  if (maybe === undefined) {
    return undefined;
  }
  return (
    typeof maybe === "object" &&
    typeof maybe["map"] == "function"
  );
}
