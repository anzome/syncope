const test = require('ava');

const syncope = require('./syncope');

test('syncope: should throw is provided data structure is not an Array', async t => {
    await t.throws(syncope.bind(null, 'string'));
});

test('syncope: returns object with expected set of methods', t => {
    let syncope = syncope([1, 2, 3]);

    t.is(syncope instanceof Object, true);
    t.is(Object.keys(syncope).length, 4);
    t.is(syncope.map.constructor, Function);
    t.is(syncope.filter.constructor, Function);
    t.is(syncope.reduce.constructor, Function);
    t.is(syncope.then.constructor, Function);
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

test('syncope: .maps() works with async actions', async t => {
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
