import { monad, Monad } from "@mjtdev/monad/Monad";

export type Reader<A, T> = {
  ask: (answer: A) => Monad<T>;
};

export function reader<A, T>(input: (answer: A) => T): Reader<A, T> {
  return {
    ask: (answer: A) => {
      return monad(input(answer));
    },
  };
}
