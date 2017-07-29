'use strict';

const filterOperation = (getState, handler, rest) => async () => {
    let temp = await getState();
    let mask = await Promise.all(temp.map(handler));

    return temp.filter((item, i) => (
        mask[i]
    ));
};

const mapOperation = (getState, handler, rest) => async () => {
    let temp = await getState();

    temp = await Promise.all(temp.map(handler));

    return temp;
};

const reduceOperation = (getState, handler, rest) => async () => {
    let temp = await getState();

    const asyncAction = async (acc, val) => {
        acc = await acc;
        return handler(acc, val);
    };

    const reduceHandler = async (acc, val) => (
        await asyncAction(acc, val)
    );

    return temp.reduce(reduceHandler, rest.initialValue);
};

const chooseOperation = (type) => {
    switch (type) {
        case 'filter':
            return filterOperation;

            break;

        case 'map':
            return mapOperation;

            break;

        case 'reduce':
            return reduceOperation;

            break;

        default:
            // no simple way to reach this condition from tests
            // and no need actually
            break;
    }
};

const operationsStore = (operations, getState) => ({
    add: (type, handler, rest) => {
        if (typeof handler !== 'function') {
            // no simple way to reach this condition from tests, and no need actually
            return;
        }

        operations.push(chooseOperation(type)(getState, handler, rest));
    },
    list: () => [...operations]
});

const returnMethods = (store, operations) => ({

    filter: function (handler) {
        operations.add('filter', handler);
        return this;
    },

    map: function (handler) {
        operations.add('map', handler);
        return this;
    },

    reduce: function (handler, initialValue) {
        operations.add('reduce', handler, {initialValue});
        return this;
    },

    then: async function (handler) {

        let ops = operations.list();

        let update;
        for (let i = 0, len = ops.length; i < len; i++) {
            update = await ops[i]().catch(error => console.error(error));
            store.updateState(update);
        }

        const result = await store.getState();

        // it is good to be able call then several times in a row
        // return Promise.resolve(handler(state));
        handler(result);
    }
});

const updateState = (state) => (newState) => {
    if (newState.constructor === Array) {
        state = [...newState];
    } else {
        state = newState;
    }
};

const getState = (state) => () => {
    if (state.constructor === Array) {
        return Promise.all([...state]);
    } else {
        return Promise.resolve(state);
    }
};

const syncope = (arr) => {
    if (arr.constructor !== Array) {
        throw new Error('Only array supported by now', arr);
    }

    let state = [];
    let operations = [];
    const store = {
        updateState: updateState(state),
        getState: getState(state)
    };

    return returnMethods(store, operationsStore(operations, store.getState));
};

module.exports = syncope;
