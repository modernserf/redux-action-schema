import { combineReducers } from "redux"
import { unknownActionError, reducerHandlerError } from "./errors"

export const createReducerCreator = (actions) => (baseReducers, initState) => {
    const reducerMap = {}
    for (const key in baseReducers) {
        const action = actions[key]
        if (!action || !action.type) { throw unknownActionError(key) }
        const fn = baseReducers[key]
        if (typeof fn !== "function") { throw reducerHandlerError(key) }
        reducerMap[action.type] = fn
    }

    return (state = initState, action) => {
        const { type, payload } = action
        return reducerMap[type]
            ? reducerMap[type](state, payload, action)
            : state
    }
}

export function createRootReducer (selectors, actions) {
    const reducers = {}
    const createReducer = createReducerCreator(actions)

    for (const key in selectors) {
        const { name, field } = selectors[key]
        const { type, payload } = field.selector
        switch (type) {
        case "plainReducer":
            reducers[name] = payload.reducer
            break
        case "reducerMap":
            reducers[name] = createReducer(
                payload.reducers, payload.initState)
        }
    }

    return combineReducers(reducers)
}
