const syncope = (arr) => {

    if (arr.constructor !== Array) {
        throw new Error('Only array supported by now', arr);
    }

    let state = [];
    let operations = [];

    const updateState = (newState) => {
        if (newState.constructor === Array) {
            state = [...newState];
        } else {
            state = newState;
        }
    };

    const getState = () => {
        return Promise.all([...state]);
    };

    const createOperation = (type, handler, rest) => {
        if (typeof handler !== 'function') {
            // no simple way to reach this condition from tests, and no need actually
            return;
        }

        switch (type) {
            case 'filter':
                operations.push(async () => {
                    let temp = await getState();
                    let mask = await Promise.all(temp.map(handler));

                    temp = temp.filter((item, i) => {
                        return mask[i];
                    });

                    return temp;
                });

                break;

            case 'map':
                operations.push(async () => {
                    let temp = await getState();

                    temp = await Promise.all(temp.map(handler));

                    return temp;
                });

                break;

            case 'reduce':
                operations.push(async () => {
                    let temp = await getState();

                    let reduceHandler = (acc, val) => {

                        let asyncAction = async (acc, val) => {
                            return handler(await Promise.resolve(acc), val);
                        };

                        return asyncAction(acc, val);
                    };

                    return temp.reduce(reduceHandler, rest.initialValue);
                });

                break;

            default:
                // no simple way to reach this condition from tests
                // and no need actually
                break;
        }
    };

    const methods = {

        filter: (handler) => {
            createOperation('filter', handler);
            return methods;
        },

        map: (handler) => {
            createOperation('map', handler);
            return methods;
        },

        reduce: (handler, initialValue) => {
            createOperation('reduce', handler, {initialValue});
            return methods;
        },

        then: async (handler) => {

            await Promise.all(operations.map(async (op, i, all) => {
                let update;
                if (i) {
                    update = await all[i - 1]();
                    updateState(update);
                }

                update = await op();

                updateState(update);
            }));

            handler(state);
        }
    };

    updateState(arr);

    return methods;
};

exports = syncope;
