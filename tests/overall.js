"use strict";

const test = require('ava');

const syncope = require('../dist/index');

test('syncope: should throw is provided data structure is not an Array', async t => {
    await t.throws(syncope.bind(null, 'string'));
});

test('syncope: returns object with expected set of methods', t => {
    let syn = syncope([1, 2, 3]);

    t.is(syn instanceof Object, true);
    t.is(Object.keys(syn).length, 4);
    t.is(syn.map.constructor, Function);
    t.is(syn.filter.constructor, Function);
    t.is(syn.reduce.constructor, Function);
    t.is(syn.then.constructor, Object.getPrototypeOf(async () => {
    }).constructor);
});

test('syncope: result is always thenable', async t => {
    let resultOne = syncope([1, -1, 2, -2, 3, -3, 'b']);

    let resultTwo = syncope([1, -1, 2, -2, 3, -3, 'b']).filter(async item => {
        item = await Promise.resolve(Number(item));
        return item;
    });

    let resultThree = syncope([1, -1, 2, -2, 3, -3, 'b']).map(async item => {
        return Promise.resolve(item);
    });

    t.is(resultOne.then(() => {
    }) instanceof Promise, true);
    t.is(resultTwo.then(() => {
    }) instanceof Promise, true);
    t.is(resultThree.then(() => {
    }) instanceof Promise, true);
});

test('syncope: .filter() works with async actions', async t => {
    let result = syncope([1, -1, 2, -2, 3, -3, 'b']).filter(async item => {
        item = await Promise.resolve(Number(item));
        return item;
    }).filter(async item => {
        item = await Promise.resolve(item > 0);
        return item;
    });

    result = await result;

    t.deepEqual(result, [1, 2, 3]);
});

test('syncope: .map() works with async actions', async t => {
    let result = syncope([1, -1, 2, -2, 3, -3]).map(async item => {
        item = await Promise.resolve(item * item);
        return item;
    }).map(async item => {
        item = await Promise.resolve(item + 1);
        return item;
    });

    result = await result;

    t.deepEqual(result, [2, 2, 5, 5, 10, 10]);
});

test('syncope: .reduce() works with async actions', async t => {
    let one = await syncope([1, 1, 1, 1, 1]).reduce(async (acc, val) => await Promise.resolve(acc + val), 0);
    let two = await syncope([1, 2, 1, 2, 1]).reduce(async (acc, val) => {
        if (val % 2) {
            return await Promise.resolve([...acc, val]);
        } else {
            return await Promise.resolve(acc);
        }
    }, []).reduce((acc, val) => (acc + val), 0);

    t.is(one, 5);
    t.is(two, 3);
});

test(`code examples from readme checked`, async t => {
    t.plan(2);

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

    t.is(onlyAsyncCallbacks, 5);

    // sync functions also allowed to be passed as callback
    return syncope([5, 5, 5])
        .map(v => v * 2)
        .reduce((a, v) => executor(a - v), 30)
        .then(v => t.is(v, 0));
});
