export type Monad<T> = {
  id: () => T;
  map: <U>(transform: (value: T) => U) => U;
  flatMap: <U>(transform: (value: T) => U[]) => U[];
};

export type Unit<T> = () => T;

type UnitOrValue<T> = Unit<T> | T;

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

export function monad<T>(unitOrValue: UnitOrValue<T>): Monad<T> {
  return {
    id: () => {
      return unitOrValueToValue(unitOrValue);
    },
    map: (transform) => {
      return transform(unitOrValueToValue(unitOrValue));
    },
    flatMap: (transform) => {
      return transform(unitOrValueToValue(unitOrValue));
    },
  };
}

/**
If it walks and talks like a Monad, it is a Monad

WARNING: The Typescript type system isn't powerful enough to determine the _type_
within the Monad
 */
export function isMonad(maybe: any): maybe is Monad<unknown> {
  if (maybe === undefined) {
    return undefined;
  }
  return (
    typeof maybe === "object" &&
    typeof maybe["map"] == "function" &&
    typeof maybe["flatmap"] == "function"
  );
}
