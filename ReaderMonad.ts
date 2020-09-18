import { Functor, Monad, Transform } from "monad/Monad";

type AskFunctor<Q, T> = (question: Q) => Reader<Q, T>;

type ReaderMapFunctor<Q, T> = <U>(transform: Transform<T, U>) => Reader<Q, U>;

type ReaderFlatMapFunctor<Q, T> = <U>(
  transform: Transform<T, Reader<Q, U>>
) => Reader<Q, U>;

export interface Reader<Q, T> extends Monad<T> {
  ask: AskFunctor<Q, T>;
  map: ReaderMapFunctor<Q, T>;
  flatmap: ReaderFlatMapFunctor<Q, T>;
}

export type Oracle<Q, A> = (question: Q) => A;

/**
 * Reader Monad
 * Return this instead of direct value to 'ask' the caller for a dependency
 */
export function reader<Q, A>(
  oracle: Oracle<Q, A>,
  question: Q = undefined
): Reader<Q, A> {
  const askFunctor: AskFunctor<Q, A> = (q) => {
    if (question !== undefined) {
      console.error("reader error", [question, q, oracle]);
      throw new Error("reader: already asked question");
    }
    return reader(oracle, q);
  };
  const mapFunctor: ReaderMapFunctor<Q, A> = <U>(
    transform: Transform<A, U>
  ) => {
    if (question == undefined) {
      return reader(oracle, question);
    }
    const transformedAnswer: U = transform(oracle(question));
    return reader(() => transformedAnswer, question);
  };
  const flatmapFunctor: ReaderFlatMapFunctor<Q, A> = <U>(
    transform: Transform<A, Reader<Q, U>>
  ) => {
    const ans: A = oracle(question);
    const transformedReader: Reader<Q, U> = transform(ans);
    return transformedReader;
  };

  return {
    ask: askFunctor,
    map: mapFunctor,
    flatmap: flatmapFunctor,
  };
}

function tests() {
  console.log("Testing ReaderMonad...");
  const life = 42;
  testReader().map((v) => {
    console.log("SHOULD NEVER BE CALLED", v);
  });
  testReader()
    .ask(life)
    .map((v) => {
      console.log("got answer", v);
      return 99;
    })
    // .ask(17)
    .map((v) => {
      console.log("new answer is", v);
      return 200;
    })
    .map((v) => {
      console.log("new new answer is", v);
      return 400;
    });
}

function testReader(): Reader<number, string> {
  return reader((ans: number) => {
    return "meaning of life is " + ans;
  });
}

//tests();
