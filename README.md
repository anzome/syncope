# SYNCOPE

## Disclaimer

This is not even an alpha version, please do not use it.
1. Node.js 8 supported due the usage of async/await operators.
2. Only three basic methods provided:
    .filter()
    .map()
    .reduce()

3. There is no tests that provided callback will get all expected params. Only the `value` for `.filter()` and `.map()`, and `accumulator` with `value` for `.reduce()` guarateed.

## Description

Makes async operations over any iterable (in perspective, for now only over arrays) object as simple as the sync ones.

## How to use

```javascript

const executor = input => {
    return Promise.resolve(input);
};
const otherExecutor = input => {
    return new Promise((res, rej) => setTimeout(() => res(input), 1000));
};
const nextExecutor = async input => {
    return await Promise.resolve(input);
};

const onlyAsyncCallbacks = await syncope([1, 2, 3])
    .filter(async v => await executor(v < 3))
    .map(v => otherExecutor(v + 1))
    .reduce(async (a, v) => await nextExecutor(a + v), 0);

if (onlyAsyncCallbacks !== 5) throw new Error('first result is wrong');

// sync functions also allowed to pass them as callback
syncope([5, 5, 5])
    .map(v => v * 2)
    .reduce((a, v) => executor(a - v), 30)
    .then(v => {
        if (v !== 0) throw new Error('second result is wrong');
    });
```

