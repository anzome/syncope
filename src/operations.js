export const filterOperation = (handler, rest) => async (prevState) => {
    let temp = await prevState;
    let mask = await Promise.all(temp.map(handler));

    return temp.filter((item, i) => (
        mask[i]
    ));
};
export const mapOperation = (handler, rest) => async (prevState) => {
    let temp = await prevState;

    temp = await Promise.all(temp.map(handler));
    return temp;
};

export const reduceOperation = (handler, rest) => async (prevState) => {
    let temp = await prevState;

    const asyncAction = async (acc, val) => {
        acc = await acc;
        return handler(acc, val);
    };

    const reduceHandler = async (acc, val) => (
        await asyncAction(acc, val)
    );

    return temp.reduce(reduceHandler, rest.initialValue);
};

