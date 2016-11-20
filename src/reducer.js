import { combineReducers } from "redux"
import { unknownActionError, reducerHandlerError } from "./errors"
import { createPromiseReducer } from "./promise"
import { actionInScope, createScopedReducer } from "./scope"

export const createReducerCreator = (actions, parentScope = []) =>
    (baseReducers, initState, childScope = []) => {
        const scope = parentScope.concat(childScope)

        const reducerMap = {}
        for (const key in baseReducers) {
            const action = actionInScope(actions, scope, key)
            if (!action || !action.type) { throw unknownActionError(key) }
            const fn = baseReducers[key]
            if (typeof fn !== "function") { throw reducerHandlerError(key) }
            reducerMap[action.type] = fn
        }

        const reducer = (state = initState, action) => {
            const { type, payload } = action
            return reducerMap[type]
                ? reducerMap[type](state, payload, action)
                : state
        }

        if (scope.length) {
            return createScopedReducer(reducer, scope)
        } else {
            return reducer
        }
    }

export function createRootReducer (actions, selectors) {
    const reducers = {}
    const createReducer = createReducerCreator(actions)

    for (const key in selectors) {
        const { id, field } = selectors[key]
        const { type, payload } = field.selector
        switch (type) {
        case "plainReducer":
            reducers[id] = payload.reducer
            break
        case "reducerMap":
            reducers[id] = createReducer(
                payload.reducers, payload.initState)
            break
        case "asyncSelector":
            reducers[id] = createPromiseReducer(id, createReducerCreator)
        }
    }

    return combineReducers(reducers)
}
