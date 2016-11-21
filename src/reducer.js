import shallowequal from "shallowequal"
import { combineReducers } from "redux"
import { unknownActionError, reducerHandlerError } from "./errors"
import { createPromiseReducer } from "./promise"

export const createReducerCreator = (actions) => (baseReducers, initState) => {
    const reducerMap = createReducerMap(actions, baseReducers)

    return (state = initState, action) => {
        const { type, payload } = action
        return reducerMap[type]
            ? reducerMap[type](state, payload, action)
            : state
    }
}

export const createReducerGroupCreator = (actions) =>
    (baseReducerGroups, initState) => {
        const reducerGroups = {}
        for (const key in baseReducerGroups) {
            if (!initState[key]) {
                throw new Error(`Reducer segment ${key} is missing initial state`)
            }
            reducerGroups[key] = createReducerMap(baseReducerGroups[key], initState[key])
        }

        return (state = initState, action) => {
            const nextState = {}
            const { type, payload } = action
            for (const key in reducerGroups) {
                if (reducerGroups[key][type]) {
                    nextState[key] = reducerGroups[key][type](state[key], payload, state, action)
                } else {
                    nextState[key] = state[key]
                }
            }

            if (shallowequal(state, nextState)) { return state }
            return nextState
        }
    }

export function createRootReducer (actions, selectors) {
    const reducers = {}
    const createReducer = createReducerCreator(actions)
    const createReducerGroup = createReducerGroupCreator(actions)

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
        case "reducerGroup":
            reducers[id] = createReducerGroup(
                payload.reducerGroup, payload.initState)
            break
        case "asyncSelector":
            reducers[id] = createPromiseReducer(id, createReducerCreator)
        }
    }

    return combineReducers(reducers)
}

function createReducerMap (actions, baseReducers) {
    const reducerMap = {}
    for (const key in baseReducers) {
        const action = actions[key]
        if (!action || !action.type) { throw unknownActionError(key) }
        const fn = baseReducers[key]
        if (typeof fn !== "function") { throw reducerHandlerError(key) }
        reducerMap[action.type] = fn
    }
    return reducerMap
}
