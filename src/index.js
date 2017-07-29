import {
    filterOperation,
    mapOperation,
    reduceOperation
} from "./operations";

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

const createStore = (initialState = []) => ({
    state: initialState,
    setState: function (newState) {
        if (newState.constructor === Array) {
            this.state = [...newState];
        } else {
            this.state = newState;
        }
    },
    getState: function () {
        if (this.state.constructor === Array) {
            return Promise.all([...this.state]);
        } else {
            return Promise.resolve(this.state);
        }
    }
});

const operationsStore = (store) => ({
    operations: [],
    add: function (type, handler, rest) {
        if (typeof handler !== 'function') {
            // no simple way to reach this condition from tests, and no need actually
            return;
        }

        const initOperation = chooseOperation(type);

        this.operations.push(initOperation(handler, rest));
    },
    list: function () {
        return [...this.operations];
    }
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

        for (let i = 0, len = ops.length; i < len; i++) {
            await ops[i](store.getState())
                .then(store.setState.bind(store))
                .catch(console.error);
        }

        const result = await store.getState();

        // it is good to be able call then several times in a row
        // return Promise.resolve(handler(state));
        handler(result);
    }
});

const syncope = (arr) => {
    if (arr.constructor !== Array) {
        throw new Error('Only array supported by now', arr);
    }

    const store = createStore(arr);

    return returnMethods(store, operationsStore(store));
};

export default syncope
