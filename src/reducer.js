import { unknownActionError, reducerHandlerError } from "./errors"
// TODO: throw custom functions

export const reducerHelper = (actions, unformat) => (obj, initState) => {
    const nObj = {}
    for (const key in obj) {
        const nKey = actions[key]
        if (!nKey) { throw unknownActionError(key) }
        const fn = obj[key]
        if (typeof fn !== "function") { throw reducerHandlerError(key) }
        nObj[nKey] = obj[key]
    }

    return (state = initState, action) => {
        const { type, payload } = unformat(action)
        return nObj[type]
            ? nObj[type](state, payload, action)
            : state
    }
}
