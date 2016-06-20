// TODO: throw custom functions

export const reducerHelper = (actions, unformat) => (obj, initState) => {
    const nObj = {}
    for (const key in obj) {
        const nKey = actions[key]
        if (!nKey) { throw new Error(`unknown action: ${key}`) }
        const fn = obj[key]
        if (typeof fn !== "function") { throw new Error(`${key} is not a function`) }
        nObj[nKey] = obj[key]
    }

    return (state = initState, action) => {
        const { type, payload } = unformat(action)
        return nObj[type]
            ? nObj[type](state, payload, action)
            : state
    }
}
