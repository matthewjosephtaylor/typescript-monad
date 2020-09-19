# MJT Typescript Monad

Some simple and handy things for creating / working with
[Monads](<https://en.wikipedia.org/wiki/Monad_(functional_programming)>) in
Typescript

## Why?

This module is half learning exercise / half opinions of how I want these things
to behave in my Typescript environment.

Like a Jedi having to craft his own lightsaber, it seems those who go down the
FP path must at some point craft the classic Monads for themselves.

## Warning

There are many libraries for dealing with javascript in an FP way. I would
highly recommend checking those out for 'production work'.

Feel free to inspect this code and use if desired, however note that I will
certainly update this project without warning as my knowledge/opinions change.

This is a 'working' module (module I include in my work) which does not attempt
to follow any rules regarding semver. _I_ trust it but make no guarantees.

## Lessons Learned

- Promise is the primary 'Monad' in the Javascript ecosystem
- If one tries to make monads outside of the Promise one is in for some 'nested
  Monad hell'
- If one tries to _extend_ promises the hell is less but then one is left with a
  Promise that the user should not use (data inside effectively becomes
  'private') which causes issues since it is a Promise but 'then' produces odd
  results.
- Optional is just a stripped down version of Either

# Questions

- What if I hide the promise as internal state of the Monads I create?
  - might give a cleaner api to the created Monads

## Clarity on what I really want

- Promises promote async await behavior that I consider harmful and so I'm
  attempting to _hide_ promises behind a layer of abstraction more to my liking

## Is this a good idea?

- Perhaps what is wanted is merely better 'operational semantics' for Promises
  - Promise.all 'do' syntax

## Nad

[Nad](./Nad.ts) is a Mo*nad* with an internal hidden promise and more functional
(value-oriented) style error-handling.

## License

MIT

## Blame

Matt Taylor https://mjt.dev
