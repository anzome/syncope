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

    const getState = () => (
        Promise.all([...state])
    );

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

                    return temp.filter((item, i) => (
                        mask[i]
                    ));
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

                    const asyncAction = async (acc, val) => {
                        acc = await acc;
                        return handler(acc, val);
                    };

                    const reduceHandler = async (acc, val) => (
                        await asyncAction(acc, val)
                    );

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

            let update;
            for (let i = 0, len = operations.length; i < len; i++) {
                update = await operations[i]().catch(error => console.error(error));
                updateState(update);
            }

            handler(state);
        }
    };

    updateState(arr);

    return methods;
};

module.exports = syncope;
